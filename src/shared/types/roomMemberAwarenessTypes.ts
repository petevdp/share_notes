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

export type roomMemberWithColor = roomMember & { color: string };

export interface clientAwareness {
  roomMemberDetails?: roomMemberWithColor;
  selection?: {
    anchor: Y.RelativePosition;
    head: Y.RelativePosition;
  };
  currentTab?: string;
}
