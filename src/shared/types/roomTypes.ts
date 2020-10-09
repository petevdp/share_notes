import { gql } from 'graphql-request';

import { roomVisit } from './roomVisitTypes';
import { user } from './userTypes';

export interface room {
  id: number;
  name: string;
  gistName: string;
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
  gistName: string;
  ownerId: string;
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
