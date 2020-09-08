import { createAction } from '@reduxjs/toolkit';

export type roomSliceState = {
  isCreatingRoom: boolean;
};

export const startCreatingRoom = createAction('startCreatingRoom');
