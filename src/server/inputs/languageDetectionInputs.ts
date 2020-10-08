import { languageDetectionInput } from 'Shared/types/languageDetectionTypes';
import { Field, InputType } from 'type-graphql';

@InputType()
export class LanguageDetectionInput implements languageDetectionInput {
  @Field(() => String)
  tabId: string;

  @Field(() => String)
  filename: string;

  @Field(() => String)
  content: string;
}
