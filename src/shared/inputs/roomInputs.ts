import { InputType, Field, ID } from 'type-graphql';

@InputType()
export class RoomInput {
  @Field(() => String, { nullable: true })
  uuid?: string;

  @Field(() => ID, { nullable: true })
  id?: number;
}
@InputType()
export class CreateRoomInput {
  @Field(() => String)
  name: string;

  @Field(() => ID)
  ownerId: number;
}
