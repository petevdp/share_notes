// data required to create a room
export type roomCreationDetails = {
  name: string;
};

// data we can expect from a room RealTimeObject
export interface roomData {
  name: string;
  ownerId: string;
  editorIds: string[];
  participantIds: string[];
}

export type sliceState = {
  // undefined(no active creation) -> creating -> created -> undefined
  creationStatus: null | 'creating' | 'created';
  // ids of created rooms, pushed in order of creation
  creationHistory: string[];
  subscribedToUserOwnedRooms: boolean;
  userOwnedRooms: [];
};
