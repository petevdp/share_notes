export interface Context {
  githubSessionToken?: string;
  login?: string;
}

export interface AuthorizedContext {
  githubSessionToken: string;
  login: string;
}
