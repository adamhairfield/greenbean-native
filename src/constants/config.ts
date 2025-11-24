export const APP_CONFIG = {
  name: 'Greenbean',
  version: '1.0.0',
  
  // Delivery configuration
  delivery: {
    windows: {
      monday_wednesday: 'Monday - Wednesday',
      thursday_saturday: 'Thursday - Saturday',
    },
    fee: 5.00,
    freeDeliveryThreshold: 50.00,
  },
  
  // Order configuration
  order: {
    minAmount: 10.00,
    taxRate: 0.08, // 8% tax
  },
  
  // Pagination
  pagination: {
    productsPerPage: 20,
    ordersPerPage: 10,
  },
  
  // Image configuration
  images: {
    productPlaceholder: '🥬',
    maxUploadSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
  },
  
  // Contact information
  contact: {
    email: 'support@greenbean.app',
    phone: '(555) 123-4567',
  },
  
  // Social media
  social: {
    facebook: 'https://facebook.com/greenbean',
    instagram: 'https://instagram.com/greenbean',
    twitter: 'https://twitter.com/greenbean',
  },
};

export const USER_ROLES = {
  CUSTOMER: 'customer',
  DRIVER: 'driver',
  ADMIN: 'admin',
  MASTER: 'master',
} as const;

export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY_FOR_DELIVERY: 'ready_for_delivery',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;
