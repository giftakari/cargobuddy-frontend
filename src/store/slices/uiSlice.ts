import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UIState } from '../../types';

const initialState: UIState = {
  sidebarOpen: false,
  loading: false,
  error: null,
  theme: 'light',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setLoading,
  setError,
  clearError,
  setTheme,
} = uiSlice.actions;

// Selectors
export const selectUI = (state: { ui: UIState }) => state.ui;
export const selectSidebarOpen = (state: { ui: UIState }) => state.ui.sidebarOpen;
export const selectLoading = (state: { ui: UIState }) => state.ui.loading;
export const selectError = (state: { ui: UIState }) => state.ui.error;
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;

export default uiSlice.reducer;