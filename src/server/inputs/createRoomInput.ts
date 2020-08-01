import { InputType, Field, ID } from 'type-graphql';

@InputType()
export class CreateRoomInput {
  @Field(() => String)
  name: string;

  @Field(() => ID)
  ownerId: string;
}
