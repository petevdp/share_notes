import * as Y from 'yjs';

export type roomMemberType = 'github' | 'anonymous';

export interface roomMemberInput {
  type: roomMemberType;
  name: string;
  // could either be our database id or a client side v4 uuid
  userIdOrAnonID?: string;

  avatarUrl?: string;
  profileUrl?: string;
}

export interface roomMember extends roomMemberInput {
  userIdOrAnonID: string;
  color: string;
}

export interface clientAwareness {
  roomMemberDetails?: roomMember;
  selection?: {
    anchor: Y.RelativePosition;
    head: Y.RelativePosition;
  };
  currentTab?: string;
}
