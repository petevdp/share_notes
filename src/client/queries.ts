import { gql } from '@apollo/client';

export const GET_ROOM = gql`
  query GetRoom($data: RoomInput!) {
    room(data: $data) {
      id
      name
      gistName
      owner {
        id
        githubLogin
      }
    }
  }
`;

export interface getRoomResponse {
  room: {
    id: string;
    name: string;
    gistName: string;
    owner: {
      id: string;
      githubLogin: string;
    };
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
    ownedRooms: { id: string; name: string; hashId: string }[];
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

export const GET_CURRENT_USER = gql`
  query getUser {
    currentUser {
      id
      githubLogin
    }
  }
`;

export interface getCurrentUserResult {
  currentUser: {
    githubLogin: string;
    id: string;
  };
}

export const GET_VIEWER_GITHUB_DETAILS = gql`
  query github__getUserDetails {
    viewer {
      avatarUrl
    }
  }
`;

export interface getCurrentUserGithubDetailsResponse {
  viewer: {
    avatarUrl: string;
  };
}

export const GET_GIST = gql`
  query github__getGist($name: String!, $ownerLogin: String!) {
    user(login: $ownerLogin) {
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
  user: {
    id: string;
    name: string;
    gist?: {
      id: string;
      files: {
        name: string;
        text: string;
      }[];
    };
  };
}
