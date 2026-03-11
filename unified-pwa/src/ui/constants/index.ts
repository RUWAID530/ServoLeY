// UI Constants and Design Tokens

export const ROUTES = {
  PUBLIC: {
    LANDING: '/',
    LOGIN: '/auth',
    SIGNUP: '/role',
    ABOUT: '/about',
    CONTACT: '/contact',
  },
  CUSTOMER: {
    DASHBOARD: '/customer/home',
    SERVICES: '/customer/services',
    BOOKINGS: '/customer/bookings',
    PROFILE: '/customer/profile',
    WALLET: '/customer/wallet',
    NOTIFICATIONS: '/customer/notifications',
    SUPPORT: '/customer/support',
    CHAT: '/customer/chat',
    AVAILABILITY: '/customer/check-availability',
  },
  PROVIDER: {
    DASHBOARD: '/provider/dashboard',
    SERVICES: '/provider/services',
    BOOKINGS: '/provider/bookings',
    PROFILE: '/provider/profile',
    WALLET: '/provider/wallet',
    NOTIFICATIONS: '/provider/notifications',
    CHAT: '/provider/chat',
    CALENDAR: '/provider/calendar',
    CUSTOMERS: '/provider/customers',
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    PROVIDERS: '/admin/providers',
    SERVICES: '/admin/services',
    BOOKINGS: '/admin/bookings',
    PAYMENTS: '/admin/payments',
    SUPPORT: '/admin/support',
    SETTINGS: '/admin/settings',
  },
};

export const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  PROVIDER: 'PROVIDER',
  ADMIN: 'ADMIN',
};

export const SERVICE_CATEGORIES = [
  { id: 'home-cleaning', name: 'Home Cleaning', icon: '🧹' },
  { id: 'repairs', name: 'Repairs & Installation', icon: '🔧' },
  { id: 'devices', name: 'Devices & Tech', icon: '💻' },
  { id: 'auto-care', name: 'Auto & Bike Care', icon: '🚗' },
  { id: 'electrical', name: 'Electrical & Plumbing', icon: '⚡' },
  { id: 'moving', name: 'Moving & Setup', icon: '📦' },
  { id: 'styling', name: 'Home Styling', icon: '🎨' },
  { id: 'business', name: 'Business Services', icon: '💼' },
];

export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  DISPUTED: 'DISPUTED',
};

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
};

export const NOTIFICATION_TYPES = {
  BOOKING_REQUEST: 'BOOKING_REQUEST',
  BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
  REVIEW_RECEIVED: 'REVIEW_RECEIVED',
  SYSTEM_UPDATE: 'SYSTEM_UPDATE',
};

export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};

export const DEBOUNCE_DELAY = 300;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
  },
  USER: {
    PROFILE: '/api/user/profile',
    SETTINGS: '/api/user/settings',
    AVATAR: '/api/user/avatar',
  },
  SERVICES: {
    LIST: '/api/services',
    DETAIL: '/api/services/:id',
    CREATE: '/api/services',
    UPDATE: '/api/services/:id',
    DELETE: '/api/services/:id',
  },
  BOOKINGS: {
    LIST: '/api/bookings',
    CREATE: '/api/bookings',
    DETAIL: '/api/bookings/:id',
    UPDATE: '/api/bookings/:id',
    CANCEL: '/api/bookings/:id/cancel',
  },
  PAYMENTS: {
    PROCESS: '/api/payments/process',
    HISTORY: '/api/payments/history',
    WALLET: '/api/payments/wallet',
  },
  CHAT: {
    ROOMS: '/api/chat/rooms',
    MESSAGES: '/api/chat/rooms/:id/messages',
    SEND: '/api/chat/send',
  },
};

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 60,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 15,
  DESCRIPTION_MAX_LENGTH: 500,
  FILE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

export const LOCAL_STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PROFILE: 'user_profile',
  THEME_PREFERENCE: 'theme_preference',
  LANGUAGE_PREFERENCE: 'language_preference',
};

export const CHAT_CONFIG = {
  MESSAGES_PER_PAGE: 50,
  TYPING_INDICATOR_DURATION: 3000,
  MESSAGE_CHARACTER_LIMIT: 1000,
};

export const MAP_CONFIG = {
  DEFAULT_CENTER: { lat: 8.7139, lng: 77.7567 }, // Tirunelveli
  DEFAULT_ZOOM: 12,
  SEARCH_RADIUS: 50, // km
};

export const NOTIFICATION_CONFIG = {
  TOAST_DURATION: 5000,
  MAX_VISIBLE_TOASTS: 3,
  POSITION: 'top-right',
};
