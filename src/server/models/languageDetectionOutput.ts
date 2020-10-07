import { Field, ObjectType } from 'type-graphql';

@ObjectType()
export class LanguageDetectionOutput {
  @Field(() => String)
  tabId: string;

  @Field(() => String, { nullable: true })
  mode?: string;
}
