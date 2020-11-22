import { createUserInput, currentUserInput, userInput } from 'Shared/types/userTypes';
import { Field, ID, InputType, Int } from 'type-graphql';

@InputType()
export class UserInput implements userInput {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field(() => ID, { nullable: true })
  login?: string;
}

@InputType()
export class CurrentUserInput implements currentUserInput {
  @Field(() => String)
  sessionToken: string;
}

@InputType()
export class CreateUserInput implements createUserInput {
  @Field(() => String)
  username: string;
}

@InputType()
export class RoomVisitsForUserInput {
  @Field(() => String)
  sort?: 'ASC' | 'DESC';

  @Field(() => Int)
  first?: number;

  @Field(() => Boolean)
  perRoom?: boolean;
}
