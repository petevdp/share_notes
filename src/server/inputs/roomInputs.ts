import { createRoomInput, deleteRoomInput, roomInput } from 'Shared/inputTypes/roomInputTypes';
import { Field, ID, InputType } from 'type-graphql';

@InputType()
export class RoomInput implements roomInput {
  @Field(() => String, { nullable: true })
  hashId?: string;

  @Field(() => ID, { nullable: true })
  id?: number;
}
@InputType()
export class CreateRoomInput implements createRoomInput {
  @Field(() => String)
  name: string;

  @Field(() => String)
  gistName: string;

  @Field(() => ID)
  ownerId: string;
}

@InputType()
export class DeleteRoomInput implements deleteRoomInput {
  @Field(() => ID)
  id: string;
}
