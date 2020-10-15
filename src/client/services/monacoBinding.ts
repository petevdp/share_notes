import { styletronEngine } from 'Client/styletronEngine';
import * as error from 'lib0/error.js';
import { createMutex } from 'lib0/mutex.js';
import * as monaco from 'monaco-editor';
import { Observable } from 'rxjs/internal/Observable';
import { fromArray } from 'rxjs/internal/observable/fromArray';
import { merge } from 'rxjs/internal/observable/merge';
import { concatMap } from 'rxjs/internal/operators/concatMap';
import { distinctUntilChanged } from 'rxjs/internal/operators/distinctUntilChanged';
import { startWith } from 'rxjs/internal/operators/startWith';
import { Subscription } from 'rxjs/internal/Subscription';
import { CSSFn } from 'styletron-react';
import { Awareness } from 'y-protocols/awareness.js'; // eslint-disable-line
import * as Y from 'yjs';
import { AbsolutePosition } from 'yjs/dist/src/internals';

import { lighterColors } from './awarenessColors';
import { globalAwareness, userAwareness } from './clientSideRoomManager';

class RelativeSelection {
  /**
   * @param {Y.RelativePosition} start
   * @param {Y.RelativePosition} end
   * @param {monaco.SelectionDirection} direction
   */
  constructor(
    public start: Y.RelativePosition,
    public end: Y.RelativePosition,
    public direction: monaco.SelectionDirection,
  ) {}
}

/**
 * @param {monaco.editor.IStandaloneCodeEditor} editor
 * @param {monaco.editor.ITextModel} monacoModel
 * @param {Y.Text} yText
 */
const createRelativeSelection = (
  editor: monaco.editor.IStandaloneCodeEditor,
  monacoModel: monaco.editor.ITextModel,
  yText: Y.Text,
) => {
  const sel = editor.getSelection();
  if (sel !== null) {
    const startPos = sel.getStartPosition();
    const endPos = sel.getEndPosition();
    const start = Y.createRelativePositionFromTypeIndex(yText, monacoModel.getOffsetAt(startPos));
    const end = Y.createRelativePositionFromTypeIndex(yText, monacoModel.getOffsetAt(endPos));
    return new RelativeSelection(start, end, sel.getDirection());
  }
  return null;
};

/**
 * @param {monaco.editor.IEditor} editor
 * @param {Y.Text} type
 * @param {RelativeSelection} relSel
 * @param {Y.Doc} doc
 * @return {null|monaco.Selection}
 */
const createMonacoSelectionFromRelativeSelection = (
  editor: monaco.editor.IStandaloneCodeEditor,
  type: Y.Text,
  relSel: RelativeSelection,
  doc: Y.Doc,
) => {
  const start = Y.createAbsolutePositionFromRelativePosition(relSel.start, doc);
  const end = Y.createAbsolutePositionFromRelativePosition(relSel.end, doc);
  if (start !== null && end !== null && start.type === type && end.type === type) {
    const model = editor.getModel();
    if (!model) {
      return null;
    }
    const startPos = model.getPositionAt(start.index);
    const endPos = model.getPositionAt(end.index);
    return monaco.Selection.createWithDirection(
      startPos.lineNumber,
      startPos.column,
      endPos.lineNumber,
      endPos.column,
      relSel.direction,
    );
  }
  return null;
};

export class MonacoBinding {
  mux: any;
  private _savedSelections: Map<any, any>;
  private _beforeTransaction: () => void;
  private doc: Y.Doc;
  private _decorations: Map<any, any>;
  private _rerenderDecorations: () => void;
  private _ytextObserver: (event: any) => void;
  private _monacoChangeHandler: monaco.IDisposable;
  private isDestroyed = false;
  awareness: Awareness;
  awarenessCursorStyles: RemoteCursorStyleManager;
  /**
   * @param {Y.Text} ytext
   * @param {monaco.editor.ITextModel} monacoModel
   * @param {Set<monaco.editor.IStandaloneCodeEditor>} [editors]
   * @param {Awareness?} [awareness]
   */
  constructor(
    private ytext: Y.Text,
    public monacoModel: monaco.editor.ITextModel,
    public editors: Set<monaco.editor.IStandaloneCodeEditor> = new Set(),
    awarenessCursorStyles: RemoteCursorStyleManager,
    awareness: Awareness,
    awareness$: Observable<globalAwareness>,
  ) {
    if (!ytext.doc) {
      throw 'no doc set on ytext';
    }
    this.doc = /** @type {Y.Doc} */ ytext.doc;
    this.mux = createMutex();
    /**
     * @type {Map<monaco.editor.IStandaloneCodeEditor, RelativeSelection>}
     */
    this._savedSelections = new Map();
    this._beforeTransaction = () => {
      this.mux(() => {
        this._savedSelections = new Map();
        editors.forEach((editor) => {
          if (editor.getModel() === monacoModel) {
            const rsel = createRelativeSelection(editor, monacoModel, ytext);
            if (rsel !== null) {
              this._savedSelections.set(editor, rsel);
            }
          }
        });
      });
    };
    this.doc.on('beforeAllTransactions', this._beforeTransaction);
    this._decorations = new Map();
    // this.awarenessCursorStyles = new AwarenessCursorStyleManager(awareness, awareness$, this.doc.clientID);
    this._rerenderDecorations = () => {
      editors.forEach((editor) => {
        if (awareness && editor.getModel() === monacoModel) {
          // render decorations
          const currentDecorations = this._decorations.get(editor) || [];
          const newDecorations: monaco.editor.IModelDeltaDecoration[] = [];
          // const decoration: monaco.editor.IModelDecoration = {options: {}}
          awareness.getStates().forEach((state: userAwareness, clientID: number) => {
            if (
              clientID !== this.doc.clientID &&
              state.selection != null &&
              state.selection.anchor != null &&
              state.selection.head != null &&
              state.user
            ) {
              const anchorAbs = Y.createAbsolutePositionFromRelativePosition(state.selection.anchor, this.doc);
              const headAbs = Y.createAbsolutePositionFromRelativePosition(state.selection.head, this.doc);
              const classNames = awarenessCursorStyles.includedClientStyles.get(clientID);
              if (
                anchorAbs !== null &&
                headAbs !== null &&
                anchorAbs.type === ytext &&
                headAbs.type === ytext &&
                classNames
              ) {
                let start, end, afterContentClassName, beforeContentClassName;
                if (anchorAbs.index < headAbs.index) {
                  start = monacoModel.getPositionAt(anchorAbs.index);
                  end = monacoModel.getPositionAt(headAbs.index);
                  afterContentClassName = classNames.selectionHead;
                  beforeContentClassName = null;
                } else {
                  start = monacoModel.getPositionAt(headAbs.index);
                  end = monacoModel.getPositionAt(anchorAbs.index);
                  afterContentClassName = null;
                  beforeContentClassName = classNames.selectionHead;
                }

                newDecorations.push({
                  range: new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column),
                  options: {
                    className: classNames.selectionBody,
                    afterContentClassName,
                    beforeContentClassName,
                  },
                });
              }
            }
          });
          this._decorations.set(editor, editor.deltaDecorations(currentDecorations, newDecorations));
        } else {
          // ignore decorations
          this._decorations.delete(editor);
        }
      });
    };
    this._ytextObserver = (event) => {
      this.mux(() => {
        let index = 0;
        event.delta.forEach((op: any) => {
          if (op.retain !== undefined) {
            index += op.retain;
          } else if (op.insert !== undefined) {
            const pos = monacoModel.getPositionAt(index);
            const range = new monaco.Selection(pos.lineNumber, pos.column, pos.lineNumber, pos.column);
            monacoModel.pushEditOperations([], [{ range, text: op.insert }], () => null);
            index += op.insert.length;
          } else if (op.delete !== undefined) {
            const pos = monacoModel.getPositionAt(index);
            const endPos = monacoModel.getPositionAt(index + op.delete);
            const range = new monaco.Selection(pos.lineNumber, pos.column, endPos.lineNumber, endPos.column);
            monacoModel.pushEditOperations([], [{ range, text: '' }], () => null);
          } else {
            throw error.unexpectedCase();
          }
        });
        monacoModel.pushStackElement();
        this._savedSelections.forEach((rsel, editor) => {
          const sel = createMonacoSelectionFromRelativeSelection(editor, ytext, rsel, this.doc);
          if (sel !== null) {
            editor.setSelection(sel);
          }
        });
      });
      this._rerenderDecorations();
    };
    ytext.observe(this._ytextObserver);
    monacoModel.setValue(ytext.toString());
    this._monacoChangeHandler = monacoModel.onDidChangeContent((event) => {
      console.log('handling change: ', event);
      // apply changes from right to left
      this.mux(() => {
        this.doc.transact(() => {
          event.changes
            .sort((change1, change2) => change2.rangeOffset - change1.rangeOffset)
            .forEach((change) => {
              ytext.delete(change.rangeOffset, change.rangeLength);
              ytext.insert(change.rangeOffset, change.text);
            });
        }, this);
      });
    });
    monacoModel.onWillDispose(() => {
      if (!this.isDestroyed) {
        this.destroy();
      }
    });
    if (awareness) {
      editors.forEach((editor) => {
        editor.onDidChangeCursorSelection(() => {
          if (editor.getModel() === monacoModel) {
            const sel = editor.getSelection();
            if (sel === null) {
              return;
            }
            let anchor = monacoModel.getOffsetAt(sel.getStartPosition());
            let head = monacoModel.getOffsetAt(sel.getEndPosition());
            if (sel.getDirection() === monaco.SelectionDirection.RTL) {
              const tmp = anchor;
              anchor = head;
              head = tmp;
            }
            awareness.setLocalStateField('selection', {
              anchor: Y.createRelativePositionFromTypeIndex(ytext, anchor),
              head: Y.createRelativePositionFromTypeIndex(ytext, head),
            });
          }
        });
        awareness.on('change', this._rerenderDecorations);
      });
      this.awareness = awareness;
    }
  }

  getEditor() {
    return [...this.editors.values()][0];
  }

  destroy() {
    this._monacoChangeHandler.dispose();
    this.ytext.unobserve(this._ytextObserver);
    this.doc.off('beforeAllTransactions', this._beforeTransaction);
    this.editors.forEach((editor) => {
      editor.dispose();
    });
    if (this.awareness !== null) {
      this.awareness.off('change', this._rerenderDecorations);
    }
    this.isDestroyed = true;
  }
}

/**
 * This exists to style remote cursors/selection with styletroon, as well as manage a dynamic stylesheet for some css properties for the editor that we can't style directly with styletron.
 */
export class RemoteCursorStyleManager {
  element: HTMLStyleElement;
  stylesheet: CSSStyleSheet;
  includedClientStyles: Map<number, { selectionHead: string; selectionBody: string }>;
  awarenessSubscription: Subscription;
  constructor(awareness: Awareness, awareness$: Observable<globalAwareness>, clientID: number) {
    this.element = document.createElement('style');
    this.element.id = 'extra-selection-styles';
    this.includedClientStyles = new Map();
    document.head.appendChild(this.element);
    this.stylesheet = this.element.sheet as CSSStyleSheet;
    const globalAwareness: globalAwareness = {};
    for (let [i, v] of awareness.getStates().entries()) {
      globalAwareness[i.toString()] = {
        currentTab: v.currentTab,
        user: v.user,
      };
    }
    this.awarenessSubscription = awareness$
      .pipe(
        startWith(globalAwareness),
        concatMap((globalAwareness) => {
          const newEntries = Object.entries(globalAwareness)
            .map(([clientID, userAwareness]): [number, userAwareness] => [parseInt(clientID), userAwareness])
            .filter(([clientID, userAwareness]) => !this.includedClientStyles.has(clientID) && userAwareness.user);

          return fromArray(newEntries);
        }),
      )
      .subscribe((args) => {
        this.setAwarenessStyle(...args);
      });
  }
  setAwarenessStyle(clientID: number, userAwareness: userAwareness) {
    if (this.includedClientStyles.has(clientID) || !userAwareness.user) {
      return;
    }
    const selectionHeadClass = styletronEngine.renderStyle({
      position: 'absolute',
      borderLeft: `${userAwareness.user.color} solid 2px`,
      borderTop: `${userAwareness.user.color} solid 2px`,
      borderBottom: `${userAwareness.user.color} solid 2px`,
      height: '100%',
      boxSizing: 'border-box',
    });
    const selectionBodyClass = styletronEngine.renderStyle({
      backgroundColor: lighterColors[userAwareness.user.color],
    });
    const selectionHeadClassForClientID = `selection-head-${clientID}`;
    const selectionBodyClassForClientID = `selection-body-${clientID}`;

    const style = `
      .${selectionHeadClassForClientID}:after {
        position: absolute;
        height: min-content;
        width: min-content;
        background-color: ${userAwareness.user.color};
        padding: 1px;
        top: -22px;
        content: '${userAwareness.user.name}';
        color: white;
        font-weight: bold;
      }
      `;
    // put the tag on the bottom on the first line
    const firstChildStyle = `
      .view-line[style*='top:0px'] .${selectionHeadClassForClientID}:after {
        top: 22px;
      }
    `;
    this.stylesheet.insertRule(style);
    this.stylesheet.insertRule(firstChildStyle);
    this.includedClientStyles.set(clientID, {
      selectionHead: [selectionHeadClass, selectionHeadClassForClientID].join(' '),
      selectionBody: [selectionBodyClass, selectionBodyClassForClientID].join(' '),
    });

    return selectionHeadClass;
  }

  destroy() {
    this.element.remove();
    this.awarenessSubscription.unsubscribe();
  }
}
