export interface languageDetectionInput {
  tabId: string;
  filename: string;
  content: string;
}

export interface languageDetectionOutput {
  tabId: string;
  mode?: string;
}
