import { Subject } from 'rxjs/internal/Subject';
import * as Y from 'yjs';

import { getKeysForMap } from './ydocUtils';

export interface fileDetailsState {
  tabId: string;
  filename: string;
  deleted: boolean;
}

export interface allFileDetailsStates {
  [id: string]: fileDetailsState;
}

export interface roomDetails {
  id: string;
  gistLoaded: boolean;
  hashId: string;
  name: string;
  gistName: string;
}

export interface startingRoomDetails {
  id: string;
  hashId: string;
  name: string;
  gistName: string;
}

export class RoomManager {
  yData: {
    // storing file text and details separately as a performance optimization
    fileDetailsState: Y.Map<Y.Map<any>>;
    fileContents: Y.Map<Y.Text>;
    // for now just contains an object with details, there's probably a better way to do this though
    details: Y.Map<any>;
  };

  roomDestroyed$$: Subject<boolean>;
  providerSynced: Promise<true>;

  constructor(public ydoc = new Y.Doc()) {
    this.roomDestroyed$$ = new Subject<boolean>();
    this.yData = {
      fileDetailsState: ydoc.getMap(`fileDetails`),
      fileContents: ydoc.getMap(`fileContents`),
      details: ydoc.getMap(`details`),
    };
  }

  addNewFile(detailsInput?: { filename?: string; content?: string }) {
    const fileDetails = new Y.Map();
    const text = new Y.Text();
    const highestId = getKeysForMap(this.yData.fileDetailsState).reduce(
      (max, id) => (Number(id) > max ? Number(id) : max),
      0,
    );

    const tabId = (Number(highestId) + 1).toString();
    fileDetails.set('tabId', tabId);
    fileDetails.set('deleted', false);
    if (detailsInput) {
      text.insert(0, detailsInput.content || '');
      this.yData.fileContents.set(tabId, new Y.Text());
      fileDetails.set('filename', detailsInput.filename);
    } else {
      fileDetails.set('filename', `new-file-${tabId}`);
    }
    this.yData.fileDetailsState.set(tabId, fileDetails);
    this.yData.fileContents.set(tabId, text);
    return fileDetails.toJSON() as fileDetailsState;
  }

  removeFile(tabId: string) {
    const ids = getKeysForMap(this.yData.fileDetailsState);
    if (ids.length === 1) {
      throw 'handle no files left case better';
    }
    this.yData.fileDetailsState.delete(tabId);
    this.yData.fileContents.delete(tabId);
  }

  destroy() {
    this.ydoc.destroy();
  }
}
