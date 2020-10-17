import { createAction } from '@reduxjs/toolkit';
import {
  GET_CURRENT_USER,
  GET_VIEWER_GITHUB_DETAILS,
  getCurrentUserGithubDetailsResponse,
  getCurrentUserResult,
} from 'Client/utils/queries';
import { getGithubGraphqlClient } from 'Client/utils/utils';
import { request as gqlRequest } from 'graphql-request';
import { merge } from 'lodash';
import { GRAPHQL_URL } from 'Shared/environment';
import { clientSideRoom } from 'Shared/types/roomTypes';

export interface currentUser {
  githubLogin: string;
  id: string;
  ownedRooms: clientSideRoom[];
}

export interface githubUserDetails {
  avatarUrl: string;
  url: string;
}

export interface currentUserDetailsSliceState {
  userDetails?: currentUser;
  githubUserDetails?: githubUserDetails;
}

export const setGithubUserDetails = createAction('setGithubUserDetails', (details: githubUserDetails) => ({
  payload: details,
}));

export const setCurrentUserDetails = createAction('setCurrentUserDetails', (data: currentUser) => ({ payload: data }));

export function getCurrentUserDetails() {
  // get user data from server
  const getCurrentUserDataPromise = gqlRequest<getCurrentUserResult>(GRAPHQL_URL, GET_CURRENT_USER).then((r) =>
    setCurrentUserDetails(r.currentUser),
  );

  const githubClient = getGithubGraphqlClient();
  // get user data from github
  const getGithubUserDetails = githubClient
    .request<getCurrentUserGithubDetailsResponse>(GET_VIEWER_GITHUB_DETAILS)
    .then((r) => setGithubUserDetails(r.viewer));

  // update the store as we get responses
  return merge(getCurrentUserDataPromise, getGithubUserDetails);
}
