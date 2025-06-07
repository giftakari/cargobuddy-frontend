import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SocketState, Notification } from '../../types';

const initialState: SocketState = {
  connected: false,
  notifications: [],
  unreadCount: 0,
};

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    connect: (state) => {
      state.connected = true;
    },
    disconnect: (state) => {
      state.connected = false;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllNotificationsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
      state.unreadCount = 0;
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex(n => n.id === action.payload);
      if (index !== -1) {
        const notification = state.notifications[index];
        if (!notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(index, 1);
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
});

export const {
  connect,
  disconnect,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  clearNotifications,
} = socketSlice.actions;

// Selectors
export const selectSocket = (state: { socket: SocketState }) => state.socket;
export const selectConnected = (state: { socket: SocketState }) => state.socket.connected;
export const selectNotifications = (state: { socket: SocketState }) => state.socket.notifications;
export const selectUnreadCount = (state: { socket: SocketState }) => state.socket.unreadCount;

export default socketSlice.reducer;