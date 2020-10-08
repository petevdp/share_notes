import { gql } from 'graphql-request';

import { user } from './userTypes';

export interface clientSideRoom {
  id: number;
  name: string;
  gistName: string;
  owner: user;
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
