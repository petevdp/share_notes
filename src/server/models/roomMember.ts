import { roomMemberType } from 'Shared/types/roomMemberAwarenessTypes.ts';
import { Field, ObjectType } from 'type-graphql';

@ObjectType()
export class RoomMember {
  @Field(() => String)
  type: roomMemberType;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  userIdOrAnonID: string;

  @Field(() => String, { nullable: true })
  avatarUrl?: string;

  @Field(() => String)
  profileUrl?: string;
}
