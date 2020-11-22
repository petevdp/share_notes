export interface user {
  id: string;
  githubDatabaseId: number;
  githubLogin: string;
}

export interface userInput {
  id?: string;
  login?: string;
}

export interface currentUserInput {
  sessionToken: string;
}

export interface createUserInput {
  username: string;
}
