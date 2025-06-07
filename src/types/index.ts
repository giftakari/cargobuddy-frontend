// User Types
export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    userType: 'sender' | 'driver' | 'both';
    vehicleType?: 'car' | 'van' | 'truck' | 'motorcycle';
    licenseNumber?: string;
    senderRating: number;
    driverRating: number;
    totalSenderRatings?: number;
    totalDriverRatings?: number;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
  }
  
  // Auth Types
  export interface Permissions {
    canCreateDeliveries: boolean;
    canCreateTrips: boolean;
    canBid: boolean;
    canSendPackages: boolean;
  }
  
  export interface AuthState {
    user: User | null;
    authenticated: boolean;
    permissions: Permissions | null;
    loading: boolean;
  }
  
  // Auth Request Types
  export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    userType: 'sender' | 'driver' | 'both';
    vehicleType?: string;
    licenseNumber?: string;
  }
  
  // Auth Response Types
  export interface AuthResponse {
    message: string;
    user: User;
    permissions: Permissions;
  }
  
  // Delivery Types
  export interface Delivery {
    id: number;
    sender: User;
    assignedDriver?: User;
    pickupAddress: string;
    pickupSuburb: string;
    pickupPostcode: string;
    pickupLat: number;
    pickupLng: number;
    dropoffAddress: string;
    dropoffSuburb: string;
    dropoffPostcode: string;
    dropoffLat: number;
    dropoffLng: number;
    itemSize: 'small' | 'medium' | 'large';
    description: string;
    photos: string[];
    preferredDeliveryDate?: string;
    budget: number;
    finalPrice?: number;
    status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled';
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
  }
  
  // Trip Types
  export interface Trip {
    id: number;
    driver: User;
    fromAddress: string;
    fromSuburb: string;
    fromPostcode: string;
    fromLat: number;
    fromLng: number;
    toAddress: string;
    toSuburb: string;
    toPostcode: string;
    toLat: number;
    toLng: number;
    departureDateTime: string;
    vehicleType: 'car' | 'van' | 'truck' | 'motorcycle';
    availableSpace: 'small' | 'medium' | 'large';
    maxDeliveries: number;
    currentDeliveries: number;
    status: 'active' | 'completed' | 'cancelled';
    routePath: { lat: number; lng: number }[];
    createdAt: string;
    updatedAt: string;
  }
  
  // Invitation Types
  export interface Invitation {
    id: number;
    delivery: number;
    driver: User;
    sender: User;
    status: 'sent' | 'viewed' | 'bid_placed' | 'accepted' | 'rejected';
    createdAt: string;
    updatedAt: string;
  }
  
  // Enhanced Bid Types
  export interface Bid {
    id: number;
    delivery: number;
    bidder: User;
    trip?: number;
    amount: number;
    message?: string;
    status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
    estimatedPickupTime?: string;
    estimatedDeliveryTime?: string;
    invitationId?: number; // Link to invitation if this bid came from an invitation
    createdAt: string;
    updatedAt: string;
  }
  
  // Chat Types
  export interface ChatMessage {
    id: number;
    delivery: number;
    sender: User;
    receiver: User;
    message: string;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
  }
  
  // Dashboard Types
  export interface SenderDashboardStats {
    totalDeliveries: number;
    pendingDeliveries: number;
    completedDeliveries: number;
    totalSpent: number;
    averageRating: number;
    totalRatings: number;
  }
  
  export interface DriverDashboardStats {
    totalTrips: number;
    activeTrips: number;
    totalDeliveries: number;
    totalEarned: number;
    totalBids: number;
    acceptedBids: number;
    bidSuccessRate: number;
    averageRating: number;
    totalRatings: number;
  }
  
  export interface SenderDashboard {
    stats: SenderDashboardStats;
    recentDeliveries: Delivery[];
  }
  
  export interface DriverDashboard {
    stats: DriverDashboardStats;
    recentTrips: Trip[];
  }
  
  // Form Types
  export interface CreateDeliveryForm {
    pickupAddress: string;
    pickupSuburb: string;
    pickupPostcode: string;
    dropoffAddress: string;
    dropoffSuburb: string;
    dropoffPostcode: string;
    itemSize: 'small' | 'medium' | 'large';
    description: string;
    preferredDeliveryDate?: string;
    budget: number;
    photos?: string[];
  }
  
  export interface CreateTripForm {
    fromAddress: string;
    fromSuburb: string;
    fromPostcode: string;
    toAddress: string;
    toSuburb: string;
    toPostcode: string;
    departureDateTime: string;
    vehicleType: 'car' | 'van' | 'truck' | 'motorcycle';
    availableSpace: 'small' | 'medium' | 'large';
    maxDeliveries: number;
  }
  
  export interface BidForm {
    deliveryId: number;
    amount: number;
    message?: string;
    tripId?: number;
    estimatedPickupTime?: string;
    estimatedDeliveryTime?: string;
  }
  
  // Enhanced Matching Types
  export interface MatchingTrip extends Trip {
    matchScore: number;
    estimatedDetour: number;
    invitationStatus?: 'none' | 'sent' | 'viewed' | 'bid_placed' | 'accepted' | 'rejected';
    invitationId?: number;
    bidStatus?: 'none' | 'pending' | 'accepted' | 'rejected';
    bidId?: number;
  }
  
  export interface MatchingDelivery extends Delivery {
    matchScore: number;
    estimatedDetour: number;
    invitationStatus?: 'none' | 'sent' | 'viewed' | 'bid_placed' | 'accepted' | 'rejected';
    invitationId?: number;
    bidStatus?: 'none' | 'pending' | 'accepted' | 'rejected';
    bidId?: number;
  }
  
  // Enhanced Notification Types
  export interface Notification {
    id: string;
    type: 'bid' | 'match' | 'message' | 'delivery_update' | 'trip_update' | 'invitation' | 'bid_accepted' | 'bid_rejected';
    title: string;
    message: string;
    data?: {
      deliveryId?: number;
      tripId?: number;
      bidId?: number;
      invitationId?: number;
      userId?: number;
      [key: string]: any;
    };
    read: boolean;
    createdAt: string;
    actionUrl?: string; // URL to navigate when notification is clicked
  }
  
  // Socket Types
  export interface SocketState {
    connected: boolean;
    notifications: Notification[];
    unreadCount: number;
  }
  
  // UI Types
  export interface UIState {
    sidebarOpen: boolean;
    loading: boolean;
    error: string | null;
    theme: 'light' | 'dark';
  }
  
  // Rating Types
  export interface RatingForm {
    rating: number;
    comment?: string;
    userId: number;
    deliveryId: number;
  }
  
  // Map Types
  export interface MapBounds {
    north: number;
    south: number;
    east: number;
    west: number;
  }
  
  export interface MapMarker {
    id: string;
    lat: number;
    lng: number;
    type: 'pickup' | 'dropoff' | 'driver' | 'trip_start' | 'trip_end';
    data?: any;
  }
  
  // Filter Types
  export interface DeliveryFilters {
    status?: string[];
    itemSize?: string[];
    minBudget?: number;
    maxBudget?: number;
    suburb?: string;
    dateFrom?: string;
    dateTo?: string;
  }
  
  export interface TripFilters {
    status?: string[];
    vehicleType?: string[];
    availableSpace?: string[];
    suburb?: string;
    dateFrom?: string;
    dateTo?: string;
  }
  
  // API Response Types
  export interface ApiResponse<T = any> {
    message: string;
    data?: T;
    error?: string;
  }
  
  export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }
  
  // Error Types
  export interface ApiError {
    status: number;
    data: {
      error: string;
      details?: any;
    };
  }
  
  // Search Types
  export interface SearchParams {
    query?: string;
    filters?: any;
    sort?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }
  
  // Geolocation Types
  export interface Coordinates {
    lat: number;
    lng: number;
  }
  
  export interface AddressGeocoding {
    address: string;
    suburb: string;
    postcode: string;
    coordinates: Coordinates;
  }