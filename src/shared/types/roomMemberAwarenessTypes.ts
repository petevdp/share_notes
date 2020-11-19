import * as Y from 'yjs';

export type roomMemberType = 'github' | 'anonymous';

export interface anonymousRoomMemberInput {
  type: 'anonymous';
  name: string;
  userIdOrAnonID: string;
}

export type anonymousRoomMember = anonymousRoomMemberInput;

export interface githubRoomMemberInput {
  type: 'github';
  name: string;
  userIdOrAnonID: string;
  avatarUrl: string;
  profileUrl: string;
}

export type githubRoomMember = githubRoomMemberInput;

export type roomMemberInput = anonymousRoomMemberInput | githubRoomMemberInput;

export type roomMember = anonymousRoomMember | githubRoomMember;

export type roomMemberWithComputed = roomMember;

export interface clientAwareness {
  roomMemberDetails?: roomMember;
  timeJoined: number;
  selection?: {
    anchor: Y.RelativePosition;
    head: Y.RelativePosition;
  };
  currentTab?: string;
}

export type globalAwarenessMap = Map<number, clientAwareness>;
export type globalAwareness = { [id: string]: clientAwareness };
