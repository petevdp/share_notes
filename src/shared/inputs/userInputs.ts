import { InputType, Field, ID } from 'type-graphql';

@InputType()
export class UserInput {
  @Field(() => ID, { nullable: true })
  id?: number;

  @Field(() => ID, { nullable: true })
  login?: string;
}

@InputType()
export class CurrentUserInput {
  @Field(() => String)
  sessionToken: string;
}

@InputType()
export class CreateUserInput {
  @Field(() => String)
  username: string;
}
