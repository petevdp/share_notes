import { gql } from 'graphql-request';

import { roomVisit } from './roomVisitTypes';
import { user } from './userTypes';

export interface room {
  id: number;
  name: string;
  gistName?: string;
  owner: user;
  createdAt: Date;
  visits: roomVisit[];
}

export interface clientSideRoom extends room {
  hashId: string;
}

export interface roomInput {
  hashId?: string;
  id?: number;
}

export interface createRoomInput {
  name: string;
  gistName?: string;
  ownerId: string;
  createdGistUrl?: string;
}

export interface deleteRoomInput {
  id: string;
}

export const ROOM_DETAILS_FRAGMENT = gql`
  fragment RoomDetails on ClientSideRoom {
    id
    name
    gistName
    owner {
      id
      githubLogin
      githubDatabaseId
    }
    hashId
  }
`;

const ROOM_DETAILS_FRAGMENT_WITH_VISITS = gql`
  fragment RoomDetailsWithVisits on ClientSideROom {
    ...RoomDetails
  }

  ${ROOM_DETAILS_FRAGMENT}
`;

export enum GistUpdateType {
  None,
  Delete,
  Create,
  Import,
}

export const gistUpdateTypeArr = [
  GistUpdateType.None,
  GistUpdateType.Delete,
  GistUpdateType.Create,
  GistUpdateType.Import,
];

export type gistUpdate =
  | {
      type: GistUpdateType.Create;
      name: string;
      description: string;
    }
  | {
      type: GistUpdateType.Delete;
    }
  | {
      type: GistUpdateType.Import;
      gistId: string;
    }
  | {
      type: GistUpdateType.None;
    };

export interface updateRoomInput {
  roomId: string;
  roomName: string;
  gistUpdate: gistUpdate;
}
