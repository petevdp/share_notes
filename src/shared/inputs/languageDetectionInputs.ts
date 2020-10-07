import { Field, InputType } from 'type-graphql';

@InputType()
export class LanguageDetectionInput {
  @Field(() => String)
  tabId: string;

  @Field(() => String)
  filename: string;

  @Field(() => String)
  content: string;
}
