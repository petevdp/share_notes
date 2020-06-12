import {
  Convergence,
  RealTimeString,
  LocalRangeReference,
  StringInsertEvent,
  StringRemoveEvent,
  ElementReference,
  ModelReference,
  ReferenceSetEvent,
  RangeReference,
  IndexReference,
  RemoteReferenceCreatedEvent,
  ReferenceClearedEvent,
  ReferenceDisposedEvent,
} from "@convergence/convergence";
import * as monaco from "monaco-editor";
import {
  RemoteCursorManager,
  RemoteSelectionManager,
  EditorContentManager,
} from "@convergencelabs/monaco-collab-ext";
import { ColorAssigner as ConvergenceColorAssigner } from "@convergence/color-assigner";
import { LocalIndexReference } from "@convergence/convergence/typings/model/reference/LocalIndexReference";
import { RemoteSelection } from "@convergencelabs/monaco-collab-ext/typings/RemoteSelection";
import { filter } from "rxjs/operators";

Convergence.connect;

const referenceKeys = {
  CURSOR: "cursor",
  SELECTION: "selection",
};

export class MonacoConvergenceAdapter {
  private _contentManager: EditorContentManager;
  private _colorAssigner: ConvergenceColorAssigner.ColorAssigner;
  private _remoteCursorManager: RemoteCursorManager;
  private _selectionReference: LocalRangeReference;
  private _remoteSelectionManager: RemoteSelectionManager;
  private _cursorReference: LocalIndexReference;

  constructor(
    private _monacoEditor: monaco.editor.ICodeEditor,
    private realtimeEditorText: RealTimeString
  ) {
    this._colorAssigner = new ConvergenceColorAssigner();
  }

  bind() {
    this._initSharedData();
    this._initSharedCursors();
    this._initSharedSelection();
  }

  dispose() {}

  _initSharedData() {
    this._monacoEditor.setValue(this.realtimeEditorText.value());
    this._contentManager = new EditorContentManager({
      editor: this._monacoEditor,
      onInsert: (index, text) => {
        this.realtimeEditorText.insert(index, text);
      },
      onReplace: (index, length, text) => {
        this.realtimeEditorText.model().startBatch();
        this.realtimeEditorText.remove(index, length);
        this.realtimeEditorText.insert(index, text);
        this.realtimeEditorText.model().completeBatch();
      },
      onDelete: (index, length) => {
        console.log("replacing ", index);
        this.realtimeEditorText.remove(index, length);
      },
      remoteSourceId: "convergence",
    });

    this.realtimeEditorText.events().subscribe({
      next: (e) => {
        const { INSERT, REMOVE } = RealTimeString.Events;
        switch (e.name) {
          case INSERT: {
            const event = e as StringInsertEvent;
            this._contentManager.insert(event.index, event.value);
            break;
          }
          case REMOVE: {
            const event = e as StringRemoveEvent;
            this._contentManager.delete(event.index, event.value.length);
            break;
          }
        }
      },
    });

    this.realtimeEditorText.value;
  }

  _initSharedCursors() {
    this._remoteCursorManager = new RemoteCursorManager({
      editor: this._monacoEditor,
      tooltips: true,
      tooltipDuration: 2,
    });
    this._cursorReference = this.realtimeEditorText.indexReference(
      referenceKeys.CURSOR
    );

    const references = this.realtimeEditorText.references({
      key: referenceKeys.CURSOR,
    });
    references.forEach((reference) => {
      if (!reference.isLocal()) {
        this._addRemoteCursor(reference);
      }
    });

    this._setLocalCursor();
    this._cursorReference.share();

    this._monacoEditor.onDidChangeCursorPosition(() => {
      this._setLocalCursor();
    });

    this.realtimeEditorText
      .events()
      .pipe(filter((e) => e.name === RemoteReferenceCreatedEvent.NAME))
      .subscribe((e) => {
        const event = e as RemoteReferenceCreatedEvent;
        const reference = event.reference as ModelReference<number>;
        this._addRemoteCursor(reference);
      });
  }

  _setLocalCursor() {
    const position = this._monacoEditor.getPosition();
    const offset = this._monacoEditor.getModel().getOffsetAt(position);
    this._cursorReference.set(offset);
  }

  _addRemoteCursor(reference: ModelReference<number>) {
    const color = this._colorAssigner.getColorAsHex(reference.sessionId());
    const remoteCursor = this._remoteCursorManager.addCursor(
      reference.sessionId(),
      color,
      reference.user().displayName
    );

    reference.events().subscribe((e) => {
      switch (e.name) {
        case ReferenceSetEvent.NAME:
          {
            const cursorIndex = reference.value();
            remoteCursor.setOffset(cursorIndex);
          }
          break;
        case ReferenceClearedEvent.NAME:
          remoteCursor.hide();
          break;
        case ReferenceDisposedEvent.NAME:
          remoteCursor.dispose();
          break;
      }
    });
  }

  _initSharedSelection() {
    this._remoteSelectionManager = new RemoteSelectionManager({
      editor: this._monacoEditor,
    });

    this._selectionReference = this.realtimeEditorText.rangeReference(
      referenceKeys.SELECTION
    );
    this._setLocalSelection();
    this._selectionReference.share();

    this._monacoEditor.onDidChangeCursorSelection(() => {
      this._setLocalSelection();
    });

    const references = this.realtimeEditorText.references({
      key: referenceKeys.SELECTION,
    });
    references.forEach((reference) => {
      if (!reference.isLocal()) {
        this._addRemoteSelection(reference);
      }
    });

    this.realtimeEditorText
      .events()
      .pipe(filter((e) => e.name === RemoteReferenceCreatedEvent.NAME))
      .subscribe((e) => {
        const event = e as ReferenceSetEvent<RangeReference>;
        this._addRemoteSelection((event as any).e as RangeReference);
      });
  }

  _setLocalSelection() {
    const selection = this._monacoEditor.getSelection();
    if (!selection.isEmpty()) {
      const start = this._monacoEditor
        .getModel()
        .getOffsetAt(selection.getStartPosition());
      const end = this._monacoEditor
        .getModel()
        .getOffsetAt(selection.getEndPosition());
      this._selectionReference.set({ start, end });
    } else if (this._selectionReference.isSet()) {
      this._selectionReference.clear();
    }
  }

  _addRemoteSelection(reference: RangeReference) {
    const color = this._colorAssigner.getColorAsHex(reference.sessionId());
    const remoteSelection = this._remoteSelectionManager.addSelection(
      reference.sessionId(),
      color
    );

    if (reference.isSet()) {
      const selection = reference.value();
      remoteSelection.setOffsets(selection.start, selection.end);
    }

    reference.events().subscribe((e) => {
      const { CLEARED, DISPOSED, SET } = RangeReference.Events;
      switch (e.name) {
        case CLEARED:
          remoteSelection.hide();
          break;
        case DISPOSED:
          remoteSelection.dispose();
          break;
        case SET:
          {
            const selection = reference.value();
            remoteSelection.setOffsets(selection.start, selection.end);
          }
          break;
      }
    });
  }
}
