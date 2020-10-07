import { languageDetectionInput } from 'Shared/inputTypes/languageDetectionInputTypes';
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
