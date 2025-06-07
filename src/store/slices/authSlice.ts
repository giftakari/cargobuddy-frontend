import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User, Permissions } from '../../types';
import { api } from '../api';

const initialState: AuthState = {
  user: null,
  authenticated: false,
  permissions: null,
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.authenticated = false;
      state.permissions = null;
      state.loading = false;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addMatcher(
      api.endpoints.login.matchPending,
      (state) => {
        state.loading = true;
      }
    );
    builder.addMatcher(
      api.endpoints.login.matchFulfilled,
      (state, action) => {
        state.loading = false;
        state.authenticated = true;
        state.user = action.payload.user;
        state.permissions = action.payload.permissions;
      }
    );
    builder.addMatcher(
      api.endpoints.login.matchRejected,
      (state) => {
        state.loading = false;
        state.authenticated = false;
        state.user = null;
        state.permissions = null;
      }
    );

    // Register
    builder.addMatcher(
      api.endpoints.register.matchPending,
      (state) => {
        state.loading = true;
      }
    );
    builder.addMatcher(
      api.endpoints.register.matchFulfilled,
      (state, action) => {
        state.loading = false;
        state.authenticated = true;
        state.user = action.payload.user;
        state.permissions = action.payload.permissions;
      }
    );
    builder.addMatcher(
      api.endpoints.register.matchRejected,
      (state) => {
        state.loading = false;
      }
    );

    // Check Auth
    builder.addMatcher(
      api.endpoints.checkAuth.matchFulfilled,
      (state, action) => {
        state.authenticated = action.payload.authenticated;
        state.user = action.payload.user;
        state.permissions = action.payload.permissions;
        state.loading = false;
      }
    );
    builder.addMatcher(
      api.endpoints.checkAuth.matchRejected,
      (state) => {
        state.authenticated = false;
        state.user = null;
        state.permissions = null;
        state.loading = false;
      }
    );

    // Logout
    builder.addMatcher(
      api.endpoints.logout.matchFulfilled,
      (state) => {
        state.authenticated = false;
        state.user = null;
        state.permissions = null;
        state.loading = false;
      }
    );

    // Update Profile
    builder.addMatcher(
      api.endpoints.updateProfile.matchFulfilled,
      (state, action) => {
        if (state.user) {
          state.user = { ...state.user, ...action.payload };
        }
      }
    );
  },
});

export const { setLoading, clearAuth, updateUser } = authSlice.actions;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.authenticated;
export const selectPermissions = (state: { auth: AuthState }) => state.auth.permissions;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;

export default authSlice.reducer;