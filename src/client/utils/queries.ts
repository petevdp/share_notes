import { gql } from 'graphql-request';
import { languageDetectionOutput } from 'Shared/types/languageDetectionTypes';
import { clientSideRoom, ROOM_DETAILS_FRAGMENT, updateRoomInput } from 'Shared/types/roomTypes';

export const GET_ROOM = gql`
  query GetRoom($data: RoomInput!) {
    room(data: $data) {
      ...RoomDetails
    }
  }

  ${ROOM_DETAILS_FRAGMENT}
`;

export interface getRoomResponse {
  room?: clientSideRoom;
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
    }
  }
  ${ROOM_DETAILS_FRAGMENT}
`;

export interface userRoomsResponse {
  user: {
    ownedRooms: clientSideRoom[];
  };
}

export const CREATE_ROOM = gql`
  mutation CreateRoom($data: CreateRoomInput!) {
    createRoom(data: $data) {
      ...RoomDetails
    }
  }

  ${ROOM_DETAILS_FRAGMENT}
`;
export type createRoomResponse = {
  createRoom: clientSideRoom;
};

export const DELETE_ROOM = gql`
  mutation DeleteRoom($data: DeleteRoomInput!) {
    deleteRoom(data: $data)
  }
`;

export const UPDATE_ROOM = gql`
  mutation UpdateRoom($input: UpdateRoomInput!) {
    updateRoom(input: $input) {
      ...RoomDetails
    }
  }

  ${ROOM_DETAILS_FRAGMENT}
`;

export interface updateRoomVariables {
  input: updateRoomInput;
}

export interface updateRoomResponse {
  updateRoom: clientSideRoom;
}

export interface deleteRoomResponse {
  deleteRoom: boolean;
}

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
    ownedRooms: clientSideRoom[];
  };
}

export const GET_VIEWER_GITHUB_DETAILS = gql`
  query github__getUserDetails {
    viewer {
      id
      url
      avatarUrl
    }
  }
`;

export interface getCurrentUserGithubDetailsResponse {
  viewer: {
    id: string;
    url: string;
    avatarUrl: string;
  };
}

const GIST_DETAILS_FRAGMENT = gql`
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

export interface gistDetailsGraphqlFragment {
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

export const GET_GIST = gql`
  query github__getGist($name: String!, $ownerLogin: String!) {
    user(login: $ownerLogin) {
      id
      name
      gist(name: $name) {
        ...GistDetails
      }
    }
  }

  ${GIST_DETAILS_FRAGMENT}
`;

export interface getGistResponse {
  user: {
    id: string;
    name: string;
    gist?: gistDetailsGraphqlFragment;
  };
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

  ${GIST_DETAILS_FRAGMENT}
`;

export interface getCurrentUserGistsVariables {
  gistCount: number;
}

export interface getCurrentUserGistsResponse {
  viewer: {
    gists: {
      nodes: gistDetailsGraphqlFragment[];
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
  detectFiletype: languageDetectionOutput[];
}

export const GET_RECENTLY_VISITED_ROOMS_FOR_CURRENT_USER = gql`
  query getRecentRoomsForUser($userId: ID!, $first: Int) {
    currentUser {
      recentlyVisitedRooms(first: 5) {
        id
        name
        visits(first: 1, fromCurrentUser: true) {
          id
          visitTime
          room {
            name
            activeRoomMembers {
              userId
              name
              color
              avatarUrl
            }
          }
        }
      }
    }
  }

  ${ROOM_DETAILS_FRAGMENT}
`;

export interface getRecentlyVisitedRoomsForCurrentUserResponse {
  currentUser: {
    recentlyVisitedRooms: {
      id: string;
      name: string;
      visits: {
        visitTime: Date;
        room: {
          name: string;
          activeRoomMembers: {
            userId: string;
            name: string;
            color: string;
            avatarUrl: string;
          }[];
        }[];
      };
    }[];
  };
}

export interface getRecentRoomsForUserResponse {
  roomsByVisits: clientSideRoom[];
}

export const GET_OWNED_ROOMS_FOR_CURRENT_USER = gql`
  query getOwnedRoomsForUser {
    currentUser {
      ownedRooms {
        id
        name
        gistName
        hashId
        owner {
          id
          githubLogin
        }
        visits(first: 1, fromCurrentUser: true) {
          id
          visitTime
        }
      }
    }
  }
`;

export interface roomWithVisited {
  id: string;
  name: string;
  gistName?: string;
  hashId: string;
  owner: {
    id: string;
    githubLogin: string;
  };
  visits: {
    id: string;
    visitTime: string;
  }[];
}

export interface getOwnedRoomsForCurrentUserResponse {
  currentUser: {
    ownedRooms: roomWithVisited[];
  };
}
