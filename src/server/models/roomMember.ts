import {
  clientAwareness,
  roomMember,
  roomMemberType,
  roomMemberWithColor,
} from 'Shared/types/roomMemberAwarenessTypes.ts';
import { Field, Int, ObjectType } from 'type-graphql';

import { User } from './user';

@ObjectType()
export class RoomMember {
  @Field(() => String)
  type: roomMemberType;

  @Field(() => String)
  name: string;

  @Field(() => String)
  color: string;

  @Field(() => String, { nullable: true })
  userIdOrAnonID: string;

  @Field(() => String, { nullable: true })
  avatarUrl?: string;

  @Field(() => String)
  profileUrl?: string;
}
