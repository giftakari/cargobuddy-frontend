import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import {
  connect,
  disconnect,
  addNotification,
} from '../store/slices/socketSlice';
import { api } from '../store/api';
import type { Notification } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:1337', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      store.dispatch(connect());
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      store.dispatch(disconnect());
      
      // Auto-reconnect if not intentional disconnect
      if (reason === 'io server disconnect') {
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.handleReconnect();
    });

    // Listen for notification events
    this.socket.on('notification', (data: any) => {
      console.log('Received notification:', data);
      
      const notification: Notification = {
        id: Date.now().toString() + Math.random(),
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        read: false,
        createdAt: new Date().toISOString(),
        actionUrl: data.actionUrl,
      };

      store.dispatch(addNotification(notification));

      // Show browser notification if permitted
      this.showBrowserNotification(notification);

      // Invalidate relevant cache based on notification type
      this.invalidateCache(data.type);
    });

    // Listen for invitation notifications
    this.socket.on('invitation_received', (data: any) => {
      console.log('Invitation received:', data);
      
      const notification: Notification = {
        id: Date.now().toString() + Math.random(),
        type: 'invitation',
        title: 'Delivery Invitation',
        message: `You've been invited to bid on a delivery: ${data.delivery?.description || 'New delivery'}`,
        data: {
          deliveryId: data.deliveryId,
          invitationId: data.invitationId,
        },
        read: false,
        createdAt: new Date().toISOString(),
        actionUrl: `/deliveries/${data.deliveryId}`,
      };

      store.dispatch(addNotification(notification));
      this.showBrowserNotification(notification);
      
      // Invalidate delivery and trip cache to show updated matching
      store.dispatch(api.util.invalidateTags(['Delivery', 'Trip']));
    });

    // Listen for invitation status updates
    this.socket.on('invitation_status_updated', (data: any) => {
      console.log('Invitation status updated:', data);
      
      // Invalidate invitations cache
      store.dispatch(api.util.invalidateTags(['Delivery']));
    });

    // Listen for new messages
    this.socket.on('newMessage', (data: any) => {
      console.log('New message received:', data);
      
      const notification: Notification = {
        id: Date.now().toString() + Math.random(),
        type: 'message',
        title: 'New Message',
        message: `${data.sender.firstName}: ${data.message.substring(0, 50)}...`,
        data: {
          deliveryId: data.delivery,
          userId: data.sender.id,
        },
        read: false,
        createdAt: new Date().toISOString(),
        actionUrl: `/chat/${data.delivery}`,
      };

      store.dispatch(addNotification(notification));
      
      // Invalidate chat cache
      store.dispatch(api.util.invalidateTags(['Chat']));
    });

    // Listen for delivery updates
    this.socket.on('delivery_completed', (data: any) => {
      console.log('Delivery completed:', data);
      
      const notification: Notification = {
        id: Date.now().toString() + Math.random(),
        type: 'delivery_update',
        title: 'Delivery Completed',
        message: `Delivery #${data.deliveryId} has been completed!`,
        data: {
          deliveryId: data.deliveryId,
        },
        read: false,
        createdAt: new Date().toISOString(),
        actionUrl: `/deliveries/${data.deliveryId}`,
      };

      store.dispatch(addNotification(notification));
      
      // Invalidate delivery and dashboard cache
      store.dispatch(api.util.invalidateTags(['Delivery', 'Dashboard']));
    });

    // Listen for bid updates
    this.socket.on('bid_accepted', (data: any) => {
      console.log('Bid accepted:', data);
      
      const notification: Notification = {
        id: Date.now().toString() + Math.random(),
        type: 'bid_accepted',
        title: 'Bid Accepted',
        message: `Your bid for delivery #${data.deliveryId} has been accepted!`,
        data: {
          deliveryId: data.deliveryId,
          bidId: data.bidId,
        },
        read: false,
        createdAt: new Date().toISOString(),
        actionUrl: `/deliveries/${data.deliveryId}`,
      };

      store.dispatch(addNotification(notification));
      
      // Invalidate relevant cache
      store.dispatch(api.util.invalidateTags(['Bid', 'Delivery', 'Dashboard']));
    });

    // Listen for bid rejections
    this.socket.on('bid_rejected', (data: any) => {
      console.log('Bid rejected:', data);
      
      const notification: Notification = {
        id: Date.now().toString() + Math.random(),
        type: 'bid_rejected',
        title: 'Bid Not Accepted',
        message: `Your bid for delivery #${data.deliveryId} was not accepted.`,
        data: {
          deliveryId: data.deliveryId,
          bidId: data.bidId,
        },
        read: false,
        createdAt: new Date().toISOString(),
        actionUrl: `/deliveries/${data.deliveryId}`,
      };

      store.dispatch(addNotification(notification));
      
      // Invalidate bid cache
      store.dispatch(api.util.invalidateTags(['Bid']));
    });

    // Listen for new bids
    this.socket.on('new_bid', (data: any) => {
      console.log('New bid received:', data);
      
      const notification: Notification = {
        id: Date.now().toString() + Math.random(),
        type: 'bid',
        title: 'New Bid Received',
        message: `You received a new bid of $${data.amount} for your delivery`,
        data: {
          deliveryId: data.deliveryId,
          bidId: data.bidId,
          bidderId: data.bidderId,
        },
        read: false,
        createdAt: new Date().toISOString(),
        actionUrl: `/deliveries/${data.deliveryId}`,
      };

      store.dispatch(addNotification(notification));
      
      // Invalidate bid cache
      store.dispatch(api.util.invalidateTags(['Bid']));
    });

    // Listen for matching updates
    this.socket.on('matching_trip_found', (data: any) => {
      console.log('Matching trip found:', data);
      
      const notification: Notification = {
        id: Date.now().toString() + Math.random(),
        type: 'match',
        title: 'Matching Trip Found',
        message: `We found a driver traveling your route!`,
        data: {
          deliveryId: data.deliveryId,
          tripId: data.tripId,
        },
        read: false,
        createdAt: new Date().toISOString(),
        actionUrl: `/deliveries/${data.deliveryId}`,
      };

      store.dispatch(addNotification(notification));
    });

    this.socket.on('matching_delivery_found', (data: any) => {
      console.log('Matching delivery found:', data);
      
      const notification: Notification = {
        id: Date.now().toString() + Math.random(),
        type: 'match',
        title: 'Matching Delivery Found',
        message: `We found a delivery on your route!`,
        data: {
          tripId: data.tripId,
          deliveryId: data.deliveryId,
        },
        read: false,
        createdAt: new Date().toISOString(),
        actionUrl: `/trips/${data.tripId}`,
      };

      store.dispatch(addNotification(notification));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      store.dispatch(disconnect());
    }
  }

  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.socket?.connect();
      }, delay);
    }
  }

  private showBrowserNotification(notification: Notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.type,
      });
    }
  }

  private invalidateCache(notificationType: string) {
    switch (notificationType) {
      case 'bid':
        store.dispatch(api.util.invalidateTags(['Bid', 'Delivery']));
        break;
      case 'delivery_update':
        store.dispatch(api.util.invalidateTags(['Delivery', 'Dashboard']));
        break;
      case 'trip_update':
        store.dispatch(api.util.invalidateTags(['Trip', 'Dashboard']));
        break;
      case 'match':
        // No specific invalidation needed for matches
        break;
      default:
        break;
    }
  }

  // Request notification permission
  static async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }

  // Check if connected
  isConnected() {
    return this.socket?.connected || false;
  }

  // Join specific rooms (if needed)
  joinRoom(room: string) {
    if (this.socket?.connected) {
      this.socket.emit('join', room);
    }
  }

  leaveRoom(room: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave', room);
    }
  }
}

export const socketService = new SocketService();