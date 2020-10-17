import { createSlice } from '@reduxjs/toolkit';

import { currentUserDetailsSliceState, setCurrentUserDetails, setGithubUserDetails } from './types';

const initialState: currentUserDetailsSliceState = {};

export const currentUserDetailsSlice = createSlice({
  name: 'userDetails',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(setCurrentUserDetails, (state, action) => ({ ...state, userDetails: action.payload }));
    builder.addCase(setGithubUserDetails, (state, action) => ({ ...state, githubUserDetails: action.payload }));
  },
});
