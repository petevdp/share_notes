import { createAction } from '@reduxjs/toolkit';

export interface fileRenamingSliceState {
  currentRename?: {
    tabIdToRename: string;
    newFilename: string;
  };
}
