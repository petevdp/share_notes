export class roomInput {
  hashId?: string;
  id?: number;
}

export class createRoomInput {
  name: string;
  gistName: string;
  ownerId: string;
}

export class deleteRoomInput {
  id: string;
}
