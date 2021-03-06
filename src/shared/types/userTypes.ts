export interface user {
  id: string;
  githubDatabaseId: number;
  githubLogin: string;
}

export interface userInput {
  id?: number;
  login?: string;
}

export interface currentUserInput {
  sessionToken: string;
}

export interface createUserInput {
  username: string;
}
