import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  User,
  Delivery,
  Trip,
  Bid,
  ChatMessage,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  CreateDeliveryForm,
  CreateTripForm,
  BidForm,
  SenderDashboard,
  DriverDashboard,
  MatchingTrip,
  MatchingDelivery,
  RatingForm,
} from '../types';

const baseQuery = fetchBaseQuery({
    baseUrl: `https://cargobuddy-sails.onrender.com/api`,
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  });
  

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'User',
    'Delivery',
    'Trip',
    'Bid',
    'Chat',
    'Dashboard',
    'Notification',
  ],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User', 'Dashboard'],
    }),

    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),

    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User', 'Dashboard', 'Delivery', 'Trip'],
    }),

    checkAuth: builder.query<{
      authenticated: boolean;
      user: User | null;
      permissions: any;
    }, void>({
      query: () => '/auth/check',
      providesTags: ['User'],
    }),

    // User endpoints
    getProfile: builder.query<User, void>({
      query: () => '/users/profile',
      providesTags: ['User'],
    }),

    updateProfile: builder.mutation<User, Partial<User>>({
      query: (userData) => ({
        url: '/users/profile',
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),

    rateUser: builder.mutation<{ message: string }, RatingForm>({
      query: (ratingData) => ({
        url: '/users/rate',
        method: 'POST',
        body: ratingData,
      }),
      invalidatesTags: ['User', 'Delivery'],
    }),

    // Delivery endpoints
    getDeliveries: builder.query<Delivery[], void>({
      query: () => '/deliveries',
      providesTags: ['Delivery'],
    }),

    createDelivery: builder.mutation<{
      message: string;
      delivery: Delivery;
    }, CreateDeliveryForm>({
      query: (deliveryData) => ({
        url: '/deliveries',
        method: 'POST',
        body: deliveryData,
      }),
      invalidatesTags: ['Delivery', 'Dashboard'],
    }),

    getDelivery: builder.query<Delivery, number>({
      query: (id) => `/deliveries/${id}`,
      providesTags: (result, error, id) => [{ type: 'Delivery', id }],
    }),

    getDeliveryMatching: builder.query<{
      matchingTrips: MatchingTrip[];
    }, number>({
      query: (id) => `/deliveries/${id}/matching`,
    }),

    acceptBid: builder.mutation<{
      message: string;
      delivery: Delivery;
    }, { deliveryId: number; bidId: number }>({
      query: ({ deliveryId, bidId }) => ({
        url: `/deliveries/${deliveryId}/accept-bid/${bidId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Delivery', 'Bid', 'Dashboard'],
      // Optimistically update the bid status to accepted and delivery status to assigned
      async onQueryStarted({ deliveryId, bidId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          
          // Update delivery cache
          dispatch(
            api.util.updateQueryData('getDelivery', deliveryId, (draft) => {
              draft.status = 'assigned';
              draft.paymentStatus = 'paid';
            })
          );

          // Update bids cache to mark accepted bid
          dispatch(
            api.util.updateQueryData('getBids', { delivery: deliveryId }, (draft) => {
              const acceptedBid = draft.find(bid => bid.id === bidId);
              if (acceptedBid) {
                acceptedBid.status = 'accepted';
              }
              // Mark other bids as rejected
              draft.forEach(bid => {
                if (bid.id !== bidId && bid.status === 'pending') {
                  bid.status = 'rejected';
                }
              });
            })
          );
        } catch (error) {
          // Handle error - the cache updates will be reverted automatically
          console.error('Failed to accept bid:', error);
        }
      },
    }),

    markDelivered: builder.mutation<{
      message: string;
      delivery: Delivery;
    }, number>({
      query: (id) => ({
        url: `/deliveries/${id}/delivered`,
        method: 'PUT',
      }),
      invalidatesTags: ['Delivery', 'Dashboard'],
    }),

    // Invite driver to bid on delivery
    inviteDriverToBid: builder.mutation<{
      message: string;
      invitation: any;
    }, { deliveryId: number; driverId: number }>({
      query: ({ deliveryId, driverId }) => ({
        url: `/deliveries/${deliveryId}/invite-driver/${driverId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Delivery'],
    }),

    // Get invitations for a delivery
    getDeliveryInvitations: builder.query<any[], number>({
      query: (deliveryId) => `/deliveries/${deliveryId}/invitations`,
      providesTags: ['Delivery'],
    }),

    // Update invitation status (when driver views/responds)
    updateInvitationStatus: builder.mutation<{
      message: string;
    }, { invitationId: number; status: string }>({
      query: ({ invitationId, status }) => ({
        url: `/invitations/${invitationId}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['Delivery'],
    }),

    // Trip endpoints
    getTrips: builder.query<Trip[], void>({
      query: () => '/trips',
      providesTags: ['Trip'],
    }),

    createTrip: builder.mutation<{
      message: string;
      trip: Trip;
    }, CreateTripForm>({
      query: (tripData) => ({
        url: '/trips',
        method: 'POST',
        body: tripData,
      }),
      invalidatesTags: ['Trip', 'Dashboard'],
    }),

    getTrip: builder.query<Trip, number>({
      query: (id) => `/trips/${id}`,
      providesTags: (result, error, id) => [{ type: 'Trip', id }],
    }),

    getTripMatching: builder.query<{
      matchingDeliveries: MatchingDelivery[];
    }, number>({
      query: (id) => `/trips/${id}/matching`,
    }),

    updateTrip: builder.mutation<{
      message: string;
      trip: Trip;
    }, { id: number; data: Partial<Trip> }>({
      query: ({ id, data }) => ({
        url: `/trips/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Trip', 'Dashboard'],
    }),

    // Bid endpoints
    getBids: builder.query<Bid[], {
      delivery?: number;
      bidder?: number;
    }>({
      query: (params) => ({
        url: '/bids',
        params,
      }),
      providesTags: ['Bid'],
    }),

    createBid: builder.mutation<{
      message: string;
      bid: Bid;
    }, BidForm>({
      query: (bidData) => ({
        url: '/bids',
        method: 'POST',
        body: bidData,
      }),
      invalidatesTags: ['Bid', 'Delivery'],
    }),

    withdrawBid: builder.mutation<{
      message: string;
    }, number>({
      query: (id) => ({
        url: `/bids/${id}/withdraw`,
        method: 'PUT',
      }),
      invalidatesTags: ['Bid'],
    }),

    // Chat endpoints
    getChatMessages: builder.query<ChatMessage[], number>({
      query: (deliveryId) => `/chat/delivery/${deliveryId}`,
      providesTags: ['Chat'],
    }),

    sendMessage: builder.mutation<{
      message: string;
      chatMessage: ChatMessage;
    }, {
      delivery: number;
      receiver: number;
      message: string;
    }>({
      query: (messageData) => ({
        url: '/chat',
        method: 'POST',
        body: messageData,
      }),
      invalidatesTags: ['Chat'],
    }),

    // Dashboard endpoints
    getSenderDashboard: builder.query<SenderDashboard, void>({
      query: () => '/dashboard/sender',
      providesTags: ['Dashboard'],
    }),

    getDriverDashboard: builder.query<DriverDashboard, void>({
      query: () => '/dashboard/driver',
      providesTags: ['Dashboard'],
    }),
  }),
});

export const {
  // Auth hooks
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useCheckAuthQuery,

  // User hooks
  useGetProfileQuery,
  useUpdateProfileMutation,
  useRateUserMutation,

  // Delivery hooks
  useGetDeliveriesQuery,
  useCreateDeliveryMutation,
  useGetDeliveryQuery,
  useGetDeliveryMatchingQuery,
  useAcceptBidMutation,
  useMarkDeliveredMutation,

  // Trip hooks
  useGetTripsQuery,
  useCreateTripMutation,
  useGetTripQuery,
  useGetTripMatchingQuery,
  useUpdateTripMutation,

  // Bid hooks
  useGetBidsQuery,
  useCreateBidMutation,
  useWithdrawBidMutation,

  // Chat hooks
  useGetChatMessagesQuery,
  useSendMessageMutation,

  // Dashboard hooks
  useGetSenderDashboardQuery,
  useGetDriverDashboardQuery,

  // Invite hooks
  useInviteDriverToBidMutation,
  useGetDeliveryInvitationsQuery,
  useUpdateInvitationStatusMutation,
} = api;

/* import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
    User,
    Delivery,
    Trip,
    Bid,
    ChatMessage,
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    CreateDeliveryForm,
    CreateTripForm,
    BidForm,
    SenderDashboard,
    DriverDashboard,
    MatchingTrip,
    MatchingDelivery,
    RatingForm,
} from '../types';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'include',
  prepareHeaders: (headers) => {
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'User',
    'Delivery',
    'Trip',
    'Bid',
    'Chat',
    'Dashboard',
    'Notification',
  ],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User', 'Dashboard'],
    }),

    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),

    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User', 'Dashboard', 'Delivery', 'Trip'],
    }),

    checkAuth: builder.query<{
      authenticated: boolean;
      user: User | null;
      permissions: any;
    }, void>({
      query: () => '/auth/check',
      providesTags: ['User'],
    }),

    // User endpoints
    getProfile: builder.query<User, void>({
      query: () => '/users/profile',
      providesTags: ['User'],
    }),

    updateProfile: builder.mutation<User, Partial<User>>({
      query: (userData) => ({
        url: '/users/profile',
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),

    rateUser: builder.mutation<{ message: string }, RatingForm>({
      query: (ratingData) => ({
        url: '/users/rate',
        method: 'POST',
        body: ratingData,
      }),
      invalidatesTags: ['User', 'Delivery'],
    }),

    // Delivery endpoints
    getDeliveries: builder.query<Delivery[], void>({
      query: () => '/deliveries',
      providesTags: ['Delivery'],
    }),

    createDelivery: builder.mutation<{
      message: string;
      delivery: Delivery;
    }, CreateDeliveryForm>({
      query: (deliveryData) => ({
        url: '/deliveries',
        method: 'POST',
        body: deliveryData,
      }),
      invalidatesTags: ['Delivery', 'Dashboard'],
    }),

    getDelivery: builder.query<Delivery, number>({
      query: (id) => `/deliveries/${id}`,
      providesTags: (result, error, id) => [{ type: 'Delivery', id }],
    }),

    getDeliveryMatching: builder.query<{
      matchingTrips: MatchingTrip[];
    }, number>({
      query: (id) => `/deliveries/${id}/matching`,
    }),

    acceptBid: builder.mutation<{
      message: string;
      delivery: Delivery;
    }, { deliveryId: number; bidId: number }>({
      query: ({ deliveryId, bidId }) => ({
        url: `/deliveries/${deliveryId}/accept-bid/${bidId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Delivery', 'Bid', 'Dashboard'],
    }),

    markDelivered: builder.mutation<{
      message: string;
      delivery: Delivery;
    }, number>({
      query: (id) => ({
        url: `/deliveries/${id}/delivered`,
        method: 'PUT',
      }),
      invalidatesTags: ['Delivery', 'Dashboard'],
    }),

    // Trip endpoints
    getTrips: builder.query<Trip[], void>({
      query: () => '/trips',
      providesTags: ['Trip'],
    }),

    createTrip: builder.mutation<{
      message: string;
      trip: Trip;
    }, CreateTripForm>({
      query: (tripData) => ({
        url: '/trips',
        method: 'POST',
        body: tripData,
      }),
      invalidatesTags: ['Trip', 'Dashboard'],
    }),

    getTrip: builder.query<Trip, number>({
      query: (id) => `/trips/${id}`,
      providesTags: (result, error, id) => [{ type: 'Trip', id }],
    }),

    getTripMatching: builder.query<{
      matchingDeliveries: MatchingDelivery[];
    }, number>({
      query: (id) => `/trips/${id}/matching`,
    }),

    updateTrip: builder.mutation<{
      message: string;
      trip: Trip;
    }, { id: number; data: Partial<Trip> }>({
      query: ({ id, data }) => ({
        url: `/trips/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Trip', 'Dashboard'],
    }),

    // Bid endpoints
    getBids: builder.query<Bid[], {
      delivery?: number;
      bidder?: number;
    }>({
      query: (params) => ({
        url: '/bids',
        params,
      }),
      providesTags: ['Bid'],
    }),

    createBid: builder.mutation<{
      message: string;
      bid: Bid;
    }, BidForm>({
      query: (bidData) => ({
        url: '/bids',
        method: 'POST',
        body: bidData,
      }),
      invalidatesTags: ['Bid', 'Delivery'],
    }),

    withdrawBid: builder.mutation<{
      message: string;
    }, number>({
      query: (id) => ({
        url: `/bids/${id}/withdraw`,
        method: 'PUT',
      }),
      invalidatesTags: ['Bid'],
    }),

    // Chat endpoints
    getChatMessages: builder.query<ChatMessage[], number>({
      query: (deliveryId) => `/chat/delivery/${deliveryId}`,
      providesTags: ['Chat'],
    }),

    sendMessage: builder.mutation<{
      message: string;
      chatMessage: ChatMessage;
    }, {
      delivery: number;
      receiver: number;
      message: string;
    }>({
      query: (messageData) => ({
        url: '/chat',
        method: 'POST',
        body: messageData,
      }),
      invalidatesTags: ['Chat'],
    }),

    // Dashboard endpoints
    getSenderDashboard: builder.query<SenderDashboard, void>({
      query: () => '/dashboard/sender',
      providesTags: ['Dashboard'],
    }),

    getDriverDashboard: builder.query<DriverDashboard, void>({
      query: () => '/dashboard/driver',
      providesTags: ['Dashboard'],
    }),
  }),
});

export const {
  // Auth hooks
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useCheckAuthQuery,

  // User hooks
  useGetProfileQuery,
  useUpdateProfileMutation,
  useRateUserMutation,

  // Delivery hooks
  useGetDeliveriesQuery,
  useCreateDeliveryMutation,
  useGetDeliveryQuery,
  useGetDeliveryMatchingQuery,
  useAcceptBidMutation,
  useMarkDeliveredMutation,

  // Trip hooks
  useGetTripsQuery,
  useCreateTripMutation,
  useGetTripQuery,
  useGetTripMatchingQuery,
  useUpdateTripMutation,

  // Bid hooks
  useGetBidsQuery,
  useCreateBidMutation,
  useWithdrawBidMutation,

  // Chat hooks
  useGetChatMessagesQuery,
  useSendMessageMutation,

  // Dashboard hooks
  useGetSenderDashboardQuery,
  useGetDriverDashboardQuery,
} = api; */

/* 
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
    User,
    Delivery,
    Trip,
    Bid,
    ChatMessage,
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    CreateDeliveryForm,
    CreateTripForm,
    BidForm,
    SenderDashboard,
    DriverDashboard,
    MatchingTrip,
    MatchingDelivery,
    RatingForm,
} from '../types';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'include',
  prepareHeaders: (headers) => {
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'User',
    'Delivery',
    'Trip',
    'Bid',
    'Chat',
    'Dashboard',
    'Notification',
  ],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User', 'Dashboard'],
    }),

    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),

    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User', 'Dashboard', 'Delivery', 'Trip'],
    }),

    checkAuth: builder.query<{
      authenticated: boolean;
      user: User | null;
      permissions: any;
    }, void>({
      query: () => '/auth/check',
      providesTags: ['User'],
    }),

    // User endpoints
    getProfile: builder.query<User, void>({
      query: () => '/users/profile',
      providesTags: ['User'],
    }),

    updateProfile: builder.mutation<User, Partial<User>>({
      query: (userData) => ({
        url: '/users/profile',
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),

    rateUser: builder.mutation<{ message: string }, RatingForm>({
      query: (ratingData) => ({
        url: '/users/rate',
        method: 'POST',
        body: ratingData,
      }),
      invalidatesTags: ['User', 'Delivery'],
    }),

    // Delivery endpoints
    getDeliveries: builder.query<Delivery[], void>({
      query: () => '/deliveries',
      providesTags: ['Delivery'],
    }),

    createDelivery: builder.mutation<{
      message: string;
      delivery: Delivery;
    }, CreateDeliveryForm>({
      query: (deliveryData) => ({
        url: '/deliveries',
        method: 'POST',
        body: deliveryData,
      }),
      invalidatesTags: ['Delivery', 'Dashboard'],
    }),

    getDelivery: builder.query<Delivery, number>({
      query: (id) => `/deliveries/${id}`,
      providesTags: (result, error, id) => [{ type: 'Delivery', id }],
    }),

    getDeliveryMatching: builder.query<{
      matchingTrips: MatchingTrip[];
    }, number>({
      query: (id) => `/deliveries/${id}/matching`,
    }),

    acceptBid: builder.mutation<{
      message: string;
      delivery: Delivery;
    }, { deliveryId: number; bidId: number }>({
      query: ({ deliveryId, bidId }) => ({
        url: `/deliveries/${deliveryId}/accept-bid/${bidId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Delivery', 'Bid', 'Dashboard'],
      // Optimistically update the bid status to accepted and delivery status to assigned
      async onQueryStarted({ deliveryId, bidId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          
          // Update delivery cache
          dispatch(
            api.util.updateQueryData('getDelivery', deliveryId, (draft) => {
              draft.status = 'assigned';
              draft.paymentStatus = 'paid';
            })
          );

          // Update bids cache to mark accepted bid
          dispatch(
            api.util.updateQueryData('getBids', { delivery: deliveryId }, (draft) => {
              const acceptedBid = draft.find(bid => bid.id === bidId);
              if (acceptedBid) {
                acceptedBid.status = 'accepted';
              }
              // Mark other bids as rejected
              draft.forEach(bid => {
                if (bid.id !== bidId && bid.status === 'pending') {
                  bid.status = 'rejected';
                }
              });
            })
          );
        } catch (error) {
          // Handle error - the cache updates will be reverted automatically
          console.error('Failed to accept bid:', error);
        }
      },
    }),

    markDelivered: builder.mutation<{
      message: string;
      delivery: Delivery;
    }, number>({
      query: (id) => ({
        url: `/deliveries/${id}/delivered`,
        method: 'PUT',
      }),
      invalidatesTags: ['Delivery', 'Dashboard'],
    }),

    // Invite driver to bid on delivery
    inviteDriverToBid: builder.mutation<{
      message: string;
    }, { deliveryId: number; driverId: number }>({
      query: ({ deliveryId, driverId }) => ({
        url: `/deliveries/${deliveryId}/invite-driver/${driverId}`,
        method: 'POST',
      }),
    }),

    // Trip endpoints
    getTrips: builder.query<Trip[], void>({
      query: () => '/trips',
      providesTags: ['Trip'],
    }),

    createTrip: builder.mutation<{
      message: string;
      trip: Trip;
    }, CreateTripForm>({
      query: (tripData) => ({
        url: '/trips',
        method: 'POST',
        body: tripData,
      }),
      invalidatesTags: ['Trip', 'Dashboard'],
    }),

    getTrip: builder.query<Trip, number>({
      query: (id) => `/trips/${id}`,
      providesTags: (result, error, id) => [{ type: 'Trip', id }],
    }),

    getTripMatching: builder.query<{
      matchingDeliveries: MatchingDelivery[];
    }, number>({
      query: (id) => `/trips/${id}/matching`,
    }),

    updateTrip: builder.mutation<{
      message: string;
      trip: Trip;
    }, { id: number; data: Partial<Trip> }>({
      query: ({ id, data }) => ({
        url: `/trips/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Trip', 'Dashboard'],
    }),

    // Bid endpoints
    getBids: builder.query<Bid[], {
      delivery?: number;
      bidder?: number;
    }>({
      query: (params) => ({
        url: '/bids',
        params,
      }),
      providesTags: ['Bid'],
    }),

    createBid: builder.mutation<{
      message: string;
      bid: Bid;
    }, BidForm>({
      query: (bidData) => ({
        url: '/bids',
        method: 'POST',
        body: bidData,
      }),
      invalidatesTags: ['Bid', 'Delivery'],
    }),

    withdrawBid: builder.mutation<{
      message: string;
    }, number>({
      query: (id) => ({
        url: `/bids/${id}/withdraw`,
        method: 'PUT',
      }),
      invalidatesTags: ['Bid'],
    }),

    // Chat endpoints
    getChatMessages: builder.query<ChatMessage[], number>({
      query: (deliveryId) => `/chat/delivery/${deliveryId}`,
      providesTags: ['Chat'],
    }),

    sendMessage: builder.mutation<{
      message: string;
      chatMessage: ChatMessage;
    }, {
      delivery: number;
      receiver: number;
      message: string;
    }>({
      query: (messageData) => ({
        url: '/chat',
        method: 'POST',
        body: messageData,
      }),
      invalidatesTags: ['Chat'],
    }),

    // Dashboard endpoints
    getSenderDashboard: builder.query<SenderDashboard, void>({
      query: () => '/dashboard/sender',
      providesTags: ['Dashboard'],
    }),

    getDriverDashboard: builder.query<DriverDashboard, void>({
      query: () => '/dashboard/driver',
      providesTags: ['Dashboard'],
    }),
  }),
});

export const {
  // Auth hooks
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useCheckAuthQuery,

  // User hooks
  useGetProfileQuery,
  useUpdateProfileMutation,
  useRateUserMutation,

  // Delivery hooks
  useGetDeliveriesQuery,
  useCreateDeliveryMutation,
  useGetDeliveryQuery,
  useGetDeliveryMatchingQuery,
  useAcceptBidMutation,
  useMarkDeliveredMutation,

  // Trip hooks
  useGetTripsQuery,
  useCreateTripMutation,
  useGetTripQuery,
  useGetTripMatchingQuery,
  useUpdateTripMutation,

  // Bid hooks
  useGetBidsQuery,
  useCreateBidMutation,
  useWithdrawBidMutation,

  // Chat hooks
  useGetChatMessagesQuery,
  useSendMessageMutation,

  // Dashboard hooks
  useGetSenderDashboardQuery,
  useGetDriverDashboardQuery,

  // Invite hook
  useInviteDriverToBidMutation,
} = api; */

/* 

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  User,
  Delivery,
  Trip,
  Bid,
  ChatMessage,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  CreateDeliveryForm,
  CreateTripForm,
  BidForm,
  SenderDashboard,
  DriverDashboard,
  MatchingTrip,
  MatchingDelivery,
  RatingForm,
} from '../types';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'include',
  prepareHeaders: (headers) => {
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'User',
    'Delivery',
    'Trip',
    'Bid',
    'Chat',
    'Dashboard',
    'Notification',
  ],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User', 'Dashboard'],
    }),

    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),

    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User', 'Dashboard', 'Delivery', 'Trip'],
    }),

    checkAuth: builder.query<{
      authenticated: boolean;
      user: User | null;
      permissions: any;
    }, void>({
      query: () => '/auth/check',
      providesTags: ['User'],
    }),

    // User endpoints
    getProfile: builder.query<User, void>({
      query: () => '/users/profile',
      providesTags: ['User'],
    }),

    updateProfile: builder.mutation<User, Partial<User>>({
      query: (userData) => ({
        url: '/users/profile',
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),

    rateUser: builder.mutation<{ message: string }, RatingForm>({
      query: (ratingData) => ({
        url: '/users/rate',
        method: 'POST',
        body: ratingData,
      }),
      invalidatesTags: ['User', 'Delivery'],
    }),

    // Delivery endpoints
    getDeliveries: builder.query<Delivery[], void>({
      query: () => '/deliveries',
      providesTags: ['Delivery'],
    }),

    createDelivery: builder.mutation<{
      message: string;
      delivery: Delivery;
    }, CreateDeliveryForm>({
      query: (deliveryData) => ({
        url: '/deliveries',
        method: 'POST',
        body: deliveryData,
      }),
      invalidatesTags: ['Delivery', 'Dashboard'],
    }),

    getDelivery: builder.query<Delivery, number>({
      query: (id) => `/deliveries/${id}`,
      providesTags: (result, error, id) => [{ type: 'Delivery', id }],
    }),

    getDeliveryMatching: builder.query<{
      matchingTrips: MatchingTrip[];
    }, number>({
      query: (id) => `/deliveries/${id}/matching`,
    }),

    acceptBid: builder.mutation<{
      message: string;
      delivery: Delivery;
    }, { deliveryId: number; bidId: number }>({
      query: ({ deliveryId, bidId }) => ({
        url: `/deliveries/${deliveryId}/accept-bid/${bidId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Delivery', 'Bid', 'Dashboard'],
      // Optimistically update the bid status to accepted and delivery status to assigned
      async onQueryStarted({ deliveryId, bidId }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          
          // Update delivery cache
          dispatch(
            api.util.updateQueryData('getDelivery', deliveryId, (draft) => {
              draft.status = 'assigned';
              draft.paymentStatus = 'paid';
            })
          );

          // Update bids cache to mark accepted bid
          dispatch(
            api.util.updateQueryData('getBids', { delivery: deliveryId }, (draft) => {
              const acceptedBid = draft.find(bid => bid.id === bidId);
              if (acceptedBid) {
                acceptedBid.status = 'accepted';
              }
              // Mark other bids as rejected
              draft.forEach(bid => {
                if (bid.id !== bidId && bid.status === 'pending') {
                  bid.status = 'rejected';
                }
              });
            })
          );
        } catch (error) {
          // Handle error - the cache updates will be reverted automatically
          console.error('Failed to accept bid:', error);
        }
      },
    }),

    markDelivered: builder.mutation<{
      message: string;
      delivery: Delivery;
    }, number>({
      query: (id) => ({
        url: `/deliveries/${id}/delivered`,
        method: 'PUT',
      }),
      invalidatesTags: ['Delivery', 'Dashboard'],
    }),

    // Invite driver to bid on delivery
    inviteDriverToBid: builder.mutation<{
      message: string;
      invitation: any;
    }, { deliveryId: number; driverId: number }>({
      query: ({ deliveryId, driverId }) => ({
        url: `/deliveries/${deliveryId}/invite-driver/${driverId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Delivery'],
    }),

    // Get invitations for a delivery
    getDeliveryInvitations: builder.query<any[], number>({
      query: (deliveryId) => `/deliveries/${deliveryId}/invitations`,
      providesTags: ['Invitation'],
    }),

    // Update invitation status (when driver views/responds)
    updateInvitationStatus: builder.mutation<{
      message: string;
    }, { invitationId: number; status: string }>({
      query: ({ invitationId, status }) => ({
        url: `/invitations/${invitationId}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['Invitation', 'Delivery'],
    }),

    // Trip endpoints
    getTrips: builder.query<Trip[], void>({
      query: () => '/trips',
      providesTags: ['Trip'],
    }),

    createTrip: builder.mutation<{
      message: string;
      trip: Trip;
    }, CreateTripForm>({
      query: (tripData) => ({
        url: '/trips',
        method: 'POST',
        body: tripData,
      }),
      invalidatesTags: ['Trip', 'Dashboard'],
    }),

    getTrip: builder.query<Trip, number>({
      query: (id) => `/trips/${id}`,
      providesTags: (result, error, id) => [{ type: 'Trip', id }],
    }),

    getTripMatching: builder.query<{
      matchingDeliveries: MatchingDelivery[];
    }, number>({
      query: (id) => `/trips/${id}/matching`,
    }),

    updateTrip: builder.mutation<{
      message: string;
      trip: Trip;
    }, { id: number; data: Partial<Trip> }>({
      query: ({ id, data }) => ({
        url: `/trips/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Trip', 'Dashboard'],
    }),

    // Bid endpoints
    getBids: builder.query<Bid[], {
      delivery?: number;
      bidder?: number;
    }>({
      query: (params) => ({
        url: '/bids',
        params,
      }),
      providesTags: ['Bid'],
    }),

    createBid: builder.mutation<{
      message: string;
      bid: Bid;
    }, BidForm>({
      query: (bidData) => ({
        url: '/bids',
        method: 'POST',
        body: bidData,
      }),
      invalidatesTags: ['Bid', 'Delivery'],
    }),

    withdrawBid: builder.mutation<{
      message: string;
    }, number>({
      query: (id) => ({
        url: `/bids/${id}/withdraw`,
        method: 'PUT',
      }),
      invalidatesTags: ['Bid'],
    }),

    // Chat endpoints
    getChatMessages: builder.query<ChatMessage[], number>({
      query: (deliveryId) => `/chat/delivery/${deliveryId}`,
      providesTags: ['Chat'],
    }),

    sendMessage: builder.mutation<{
      message: string;
      chatMessage: ChatMessage;
    }, {
      delivery: number;
      receiver: number;
      message: string;
    }>({
      query: (messageData) => ({
        url: '/chat',
        method: 'POST',
        body: messageData,
      }),
      invalidatesTags: ['Chat'],
    }),

    // Dashboard endpoints
    getSenderDashboard: builder.query<SenderDashboard, void>({
      query: () => '/dashboard/sender',
      providesTags: ['Dashboard'],
    }),

    getDriverDashboard: builder.query<DriverDashboard, void>({
      query: () => '/dashboard/driver',
      providesTags: ['Dashboard'],
    }),
  }),
});

export const {
  // Auth hooks
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useCheckAuthQuery,

  // User hooks
  useGetProfileQuery,
  useUpdateProfileMutation,
  useRateUserMutation,

  // Delivery hooks
  useGetDeliveriesQuery,
  useCreateDeliveryMutation,
  useGetDeliveryQuery,
  useGetDeliveryMatchingQuery,
  useAcceptBidMutation,
  useMarkDeliveredMutation,

  // Trip hooks
  useGetTripsQuery,
  useCreateTripMutation,
  useGetTripQuery,
  useGetTripMatchingQuery,
  useUpdateTripMutation,

  // Bid hooks
  useGetBidsQuery,
  useCreateBidMutation,
  useWithdrawBidMutation,

  // Chat hooks
  useGetChatMessagesQuery,
  useSendMessageMutation,

  // Dashboard hooks
  useGetSenderDashboardQuery,
  useGetDriverDashboardQuery,

  // Invite hooks
  useInviteDriverToBidMutation,
  useGetDeliveryInvitationsQuery,
  useUpdateInvitationStatusMutation,
} = api; */