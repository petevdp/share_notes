import { Observable } from 'rxjs/internal/Observable';
import { ConnectableObservable } from 'rxjs/internal/observable/ConnectableObservable';
import { publish } from 'rxjs/internal/operators/publish';
import { Subject } from 'rxjs/internal/Subject';
import { v4 as uuidv4 } from 'uuid';
import * as Y from 'yjs';

import { fileDetails, gistDetails } from './githubTypes';
import { getKeysForMap } from './ydocUtils';

export interface baseFileDetailsState {
  tabId: string;
  filename: string;
  deleted: boolean;
  filetype?: string;
  gistContent?: string;
}

export type computedFileDetailsState = null;

export type unifiedFileDetailsState = baseFileDetailsState & computedFileDetailsState;

export interface allBaseFileDetailsStates {
  [id: string]: baseFileDetailsState;
}

export interface allComputedFileDetailsStates {
  [id: string]: computedFileDetailsState;
}

export interface allUnifiedFileDetailsStates {
  [id: string]: unifiedFileDetailsState;
}

export interface startingRoomDetails {
  id: number;
  hashId: string;
  name: string;
  gistName?: string;
}

export interface roomDetails extends startingRoomDetails {
  gistLoaded: boolean;
}

export abstract class RoomManager {
  yData: {
    // storing file text and details separately as a performance optimization
    fileDetailsState: Y.Map<Y.Map<any>>;
    // supplied by server, consumed by clients
    computedFileDetails: Y.Map<Y.Map<any | undefined>>;
    fileContents: Y.Map<Y.Text>;
    // for now just contains an object with details, there's probably a better way to do this though
    details: Y.Map<any>;
  };
  roomDestroyed$$: Subject<boolean>;

  constructor(public ydoc = new Y.Doc()) {
    this.roomDestroyed$$ = new Subject<boolean>();
    this.yData = {
      fileDetailsState: ydoc.getMap(`fileDetails`),
      computedFileDetails: ydoc.getMap(`computedFileDetails`),
      fileContents: ydoc.getMap(`fileContents`),
      details: ydoc.getMap(`details`),
    };
  }

  populate(startingRoomDetails: startingRoomDetails, files?: { [key: string]: fileDetails }) {
    const details: roomDetails = {
      ...startingRoomDetails,
      gistLoaded: true,
    };

    for (let [key, detail] of Object.entries(details)) {
      this.yData.details.set(key, detail);
    }

    if (files) {
      this.ydoc.transact(() => {
        for (let file of Object.values(files)) {
          this.addNewFile({ filename: file.filename, content: file.content });
        }
      });
    }
  }

  addNewFile(detailsInput?: { filename?: string; content?: string }) {
    const fileDetails = new Y.Map();
    const text = new Y.Text();
    const tabId = uuidv4();
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
    return fileDetails.toJSON() as baseFileDetailsState;
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
    this.roomDestroyed$$.next(true);
    this.roomDestroyed$$.complete();
  }
}
