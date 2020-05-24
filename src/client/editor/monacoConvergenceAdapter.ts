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

// interface IEditorEvent extends IConvergenceEvent {
//   index: number;
//   value: string;
// }

Convergence.connect;

export class MonacoConvergenceAdapter {
  private _contentManager: EditorContentManager;
  private _colorAssigner: ConvergenceColorAssigner.ColorAssigner;
  private _remoteCursorManager: RemoteCursorManager;
  private _selectionReference: LocalRangeReference;
  private _remoteSelectionManager: RemoteSelectionManager;
  private _cursorReference: LocalIndexReference;

  constructor(
    private _monacoEditor: monaco.editor.ICodeEditor,
    private stringElement: RealTimeString
  ) {
    this._colorAssigner = new ConvergenceColorAssigner();
  }

  bind() {
    this._initSharedData();
    this._initSharedCursors();
    this._initSharedSelection();
  }

  _initSharedData() {
    this._monacoEditor.setValue(this.stringElement.value());
    this._contentManager = new EditorContentManager({
      editor: this._monacoEditor,
      onInsert: (index, text) => {
        this.stringElement.insert(index, text);
      },
      onReplace: (index, length, text) => {
        this.stringElement.model().startBatch();
        this.stringElement.remove(index, length);
        this.stringElement.insert(index, text);
        this.stringElement.model().completeBatch();
      },
      onDelete: (index, length) => {
        console.log("replacing ", index);
        this.stringElement.remove(index, length);
      },
      remoteSourceId: "convergence",
    });

    this.stringElement.events().subscribe({
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

    this.stringElement.value;
  }

  _initSharedCursors() {
    this._remoteCursorManager = new RemoteCursorManager({
      editor: this._monacoEditor,
      tooltips: true,
      tooltipDuration: 2,
    });
    this._cursorReference = this.stringElement.indexReference("cursor");

    const references = this.stringElement.references({ key: "cursor" });
    references.forEach((reference) => {
      if (!reference.isLocal()) {
        this._addRemoteCursor(reference);
      }
    });

    this._setLocalCursor();
    this._cursorReference.share();

    this._monacoEditor.onDidChangeCursorPosition(() => {
      console.log("monaco change cursor position");
      this._setLocalCursor();
    });

    this.stringElement.on("reference", (e) => {
      if (e.name === "cursor") {
        this._addRemoteCursor(e);
      }
    });
  }

  _setLocalCursor() {
    const position = this._monacoEditor.getPosition();
    const offset = this._monacoEditor.getModel().getOffsetAt(position);
    this._cursorReference.set(offset);
  }

  _addRemoteCursor(reference) {
    const color = this._colorAssigner.getColorAsHex(reference.sessionId());
    const remoteCursor = this._remoteCursorManager.addCursor(
      reference.sessionId(),
      color,
      reference.user().displayName
    );

    reference.on("cleared", () => remoteCursor.hide());
    reference.on("disposed", () => remoteCursor.dispose());
    reference.on("set", () => {
      const cursorIndex = reference.value();
      remoteCursor.setOffset(cursorIndex);
    });
  }

  _initSharedSelection() {
    this._remoteSelectionManager = new RemoteSelectionManager({
      editor: this._monacoEditor,
    });

    this._selectionReference = this.stringElement.rangeReference("selection");
    this._setLocalSelection();
    this._selectionReference.share();

    this._monacoEditor.onDidChangeCursorSelection(() => {
      this._setLocalSelection();
    });

    const references = this.stringElement.references({ key: "selection" });
    references.forEach((reference) => {
      if (!reference.isLocal()) {
        this._addRemoteSelection(reference);
      }
    });

    this.stringElement.on("reference", (e) => {
      if (e.name === "selection") {
        const event = e as ReferenceSetEvent<RangeReference>;
        console.log("selection event: ", e);
        this._addRemoteSelection((event as any).e as RangeReference);
      }
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

    reference.on("cleared", () => remoteSelection.hide());
    reference.on("disposed", () => remoteSelection.dispose());
    reference.on("set", () => {
      const selection = reference.value();
      remoteSelection.setOffsets(selection.start, selection.end);
    });
  }
}
