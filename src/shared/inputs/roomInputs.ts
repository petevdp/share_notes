import { Field, ID, InputType } from 'type-graphql';

@InputType()
export class RoomInput {
  @Field(() => String, { nullable: true })
  hashId?: string;

  @Field(() => ID, { nullable: true })
  id?: number;
}
@InputType()
export class CreateRoomInput {
  @Field(() => String)
  name: string;

  @Field(() => String)
  gistName: string;

  @Field(() => ID)
  ownerId: string;
}

@InputType()
export class DeleteRoomInput {
  @Field(() => ID)
  id: string;
}
