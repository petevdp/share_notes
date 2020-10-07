import { gql } from 'graphql-request';
import { roomDetails } from 'Shared/roomManager';

export const GET_ROOM = gql`
  query GetRoom($data: RoomInput!) {
    room(data: $data) {
      id
      hashId
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
  room: roomDetails;
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
      id
      hashId
      name
      gistName
      owner {
        id
        githubLogin
      }
    }
  }
`;
export type createRoomResponse = {
  createRoom: {
    id: string;
    hashId: string;
    name: string;
    gistName: string;
    owner: {
      id: string;
      githubLogin: string;
    };
  };
};

export const GET_CURRENT_USER = gql`
  query getCurrentUser {
    currentUser {
      id
      githubLogin
      ownedRooms {
        id
        name
        hashId
      }
    }
  }
`;

export interface getCurrentUserResult {
  currentUser: {
    githubLogin: string;
    id: string;
    ownedRooms: {
      id: string;
      name: string;
      hashId: string;
    }[];
  };
}

export const GET_VIEWER_GITHUB_DETAILS = gql`
  query github__getUserDetails {
    viewer {
      avatarUrl
      id
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
        name
        description
        url
        files {
          name
          text
        }
      }
    }
  }
`;

const gistDetailsFragment = gql`
  fragment GistDetails on Gist {
    id
    name
    description
    url
    files {
      name
      text
    }
  }
`;

export interface getGistResponse {
  user: {
    id: string;
    name: string;
    gist?: {
      id: string;
      name: string;
      description: string;
      url: string;
      files: {
        name: string;
        text: string;
      }[];
    };
  };
}

export interface gistDetailsGraphql {
  id: string;
  name: string;
  description: string;
  url: string;
  owner: {
    login: string;
    id: number;
  };
  files: { name: string; content: string }[];
}

export const GET_CURRENT_USER_GISTS_COUNT = gql`
  query github__getCurrentUserGistsCount {
    viewer {
      gists(first: 0, privacy: ALL) {
        totalCount
      }
    }
  }
`;

export interface getCurrentUserGistsCountResponse {
  viewer: {
    gists: {
      totalCount: number;
    };
  };
}

export const GET_CURRENT_USER_GISTS = gql`
  query github__getCurrentUserGists($gistCount: Int) {
    viewer {
      gists(first: $gistCount, privacy: ALL) {
        nodes {
          ...GistDetails
        }
      }
    }
  }

  ${gistDetailsFragment}
`;

export interface getCurrentUserGistsVariables {
  gistCount: number;
}

export interface getCurrentUserGistsResponse {
  viewer: {
    gists: {
      nodes: gistDetailsGraphql[];
    };
  };
}

export const DETECT_LANGUAGES = gql`
  query detectLanguages($data: [LanguageDetectionInput!]!) {
    detectFiletype(data: $data) {
      tabId
      mode
    }
  }
`;

export interface languageDetectionResponse {
  detectFiletype: {
    tabId: string;
    mode: string | null;
  }[];
}
