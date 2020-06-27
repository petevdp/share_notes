export interface UserArgs {
  id: number;
}

export interface UserCreateArgs {
  username: string;
}

export interface RoomArgs {
  id: number;
}

export interface RoomCreateArgs {
  ownerId: number;
  name: string;
}
