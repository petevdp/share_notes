import { gql } from '@apollo/client';

export const GET_ROOM = gql`
  query GetRoom($data: RoomInput!) {
    room(data: $data) {
      id
      name
      gistName
    }
  }
`;

export interface getRoomResponse {
  room: {
    id: number;
    name: string;
    gistName: string;
  };
}

export const USER_ROOMS = gql`
  query GetUserOwnedRooms($data: UserInput!) {
    user(data: $data) {
      ownedRooms {
        id
        name
        hashId
      }
    }
  }
`;

export interface userRoomsResponse {
  user: {
    ownedRooms: { id: number; name: string; hashId: string }[];
  };
}

export const CREATE_ROOM = gql`
  mutation CreateRoom($data: CreateRoomInput!) {
    createRoom(data: $data) {
      hashId
    }
  }
`;

export interface createRoomResponse {
  createRoom: {
    hashId: string;
  };
}

export const GET_GIST = gql`
  query github__getGist($name: String!) {
    viewer {
      id
      name
      gist(name: $name) {
        id
        files {
          name
          text
        }
      }
    }
  }
`;

export interface getGistResponse {
  viewer: {
    id: string;
    name: string;
    gist: {
      id: string;
      files: {
        name: string;
        text: string;
      }[];
    };
  };
}
