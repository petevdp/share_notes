import { Field, InputType } from 'type-graphql';

export interface languageDetectionInput {
  tabId: string;
  filename: string;
  content: string;
}
