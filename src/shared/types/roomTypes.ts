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

export interface clientSideRoom {
  hashId: string;
  name: string;
  gistName?: string;
  owner: user;
  createdAt: Date;
  visits: roomVisit[];
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
  hashId: string;
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
  roomHashId: string;
  roomName: string;
  gistUpdate: gistUpdate;
}
