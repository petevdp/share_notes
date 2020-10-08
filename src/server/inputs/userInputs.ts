import { createUserInput, currentUserInput, userInput } from 'Shared/types/userTypes';
import { Field, ID, InputType } from 'type-graphql';

@InputType()
export class UserInput implements userInput {
  @Field(() => ID, { nullable: true })
  id?: number;

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
