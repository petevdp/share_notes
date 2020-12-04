import { GistsGetResponseData } from '@octokit/types/dist-types';
export interface gistFileDetails {
  filename?: string;
  type?: string;
  language?: string;
  raw_url?: string;
  size?: number;
  truncated?: boolean;
  content?: string;
  [k: string]: unknown;
}

export interface fileInputForGithub {
  [filename: string]: {
    filename: string;
    content: string;
  };
}

export type gistDetails = GistsGetResponseData;

export type fileDetails = gistDetails['files'][string];

// export interface gistDetails {
//   id: string;
//   name: string;
//   description: string;
//   url: string;
//   files: {
//     [key: string]: gistFileDetails;
//   };
//   owner: {
//     login: string;
//     id: number;
//   };
// }
