import { Subject } from 'rxjs/internal/Subject';
import { v4 as uuidv4 } from 'uuid';
import * as Y from 'yjs';

import { fileDetails, fileInputForGithub } from './githubTypes';
import { getKeysForMap } from './utils/ydocUtils';

export interface baseFileDetails {
  tabId: string;
  filename: string;
  deleted: boolean;
  filetype?: string;
  gistContent?: string;
}

export type computedFileDetailsState = null;

export type unifiedFileDetailsState = baseFileDetails & computedFileDetailsState;

export interface allFileContentsState {
  [tabId: string]: string;
}

export interface allBaseFileDetailsStates {
  [id: string]: baseFileDetails;
}

export interface allComputedFileDetailsStates {
  [id: string]: computedFileDetailsState;
}

export interface allUnifiedFileDetailsStates {
  [id: string]: unifiedFileDetailsState;
}

export interface startingRoomDetails {
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
    fileDetails: Y.Map<baseFileDetails>;
    // supplied by server, consumed by clients
    fileContents: Y.Map<Y.Text>;
    // for now just contains an object with details, there's probably a better way to do this though
    details: Y.Map<any>;
  };
  roomDestroyed$$: Subject<boolean>;

  constructor(protected roomHashId: string, public ydoc = new Y.Doc()) {
    this.roomDestroyed$$ = new Subject<boolean>();
    this.yData = {
      fileDetails: ydoc.getMap(`fileDetails`),
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
    } else {
      this.ydoc.transact(() => {
        const filename = startingRoomDetails.name.toLowerCase().split(' ').join('-');
        this.addNewFile({
          filename,
          content: `# ${filename}`,
        });
      });
    }
  }

  addNewFile(detailsInput?: { filename?: string; content?: string }) {
    const text = new Y.Text();
    const tabId = uuidv4();

    let filename: string | undefined;
    if (detailsInput) {
      text.insert(0, detailsInput.content || '');
      this.yData.fileContents.set(tabId, new Y.Text());
      filename = detailsInput.filename;
    }

    if (!filename) {
      filename = `new-file-${tabId}`;
    }

    const fileDetails: baseFileDetails = {
      filename,
      tabId,
      deleted: false,
    };
    this.yData.fileDetails.set(tabId, fileDetails);
    this.yData.fileContents.set(tabId, text);
    return fileDetails;
  }

  removeFile(tabId: string) {
    const ids = getKeysForMap(this.yData.fileDetails);
    if (ids.length === 1) {
      throw 'handle no files left case better';
    }
    this.yData.fileDetails.delete(tabId);
    this.yData.fileContents.delete(tabId);
  }

  destroy() {
    console.log('destroying room ', this.roomHashId);
    this.ydoc.destroy();
    this.roomDestroyed$$.next(true);
    this.roomDestroyed$$.complete();
  }

  getAllFileContents() {
    return this.yData.fileContents.toJSON() as allFileContentsState;
  }

  getRoomDetails() {
    return this.yData.details.toJSON() as roomDetails;
  }

  getFileDetails(): allBaseFileDetailsStates {
    return this.yData.fileDetails.toJSON() as allBaseFileDetailsStates;
  }

  getFilesForGithub(): fileInputForGithub {
    const contents = this.getAllFileContents();
    const details = this.getFileDetails();

    const inputForGithub: fileInputForGithub = {};

    for (let [tabId, { filename }] of Object.entries(details)) {
      inputForGithub[filename] = { filename, content: contents[tabId] };
    }
    return inputForGithub;
  }
}
