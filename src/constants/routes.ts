/**
 * Public-facing route paths used across the Makmur Farma app.
 */
export const ROUTES = {
  // Authentication
  ACCESS_DENIED: "/access-denied",
  CHECK_EMAIL: "/check-email",
  LOGIN: "/login",
  LOGOUT: "/logout",
  REGISTER: "/register",
  VERIFY_EMAIL: "/verify-email",
  PROFILE: "/profile",

  // Dashboard
  DASHBOARD: "/dashboard",

  // Sales
  ORDERS: {
    INDEX: "/orders",
    DETAIL: (id: string) => `/orders/${id}`,
  },
  CASHIER: "/cashier",
  PAYMENTS: {
    INDEX: "/payments",
    DETAIL: (id: string) => `/payments/${id}`,
  },

  // Pharmacy
  MEDICINES: {
    INDEX: "/medicines",
    DETAIL: (id: string) => `/medicines/${id}`,
  },
  CATEGORIES: "/categories",
  PRESCRIPTIONS: {
    INDEX: "/prescriptions",
    DETAIL: (id: string) => `/prescriptions/${id}`,
  },
  SUPPLIERS: "/suppliers",

  // Inventory
  BATCHES: {
    INDEX: "/batches",
    DETAIL: (id: string) => `/batches/${id}`,
  },
  STOCK_MOVEMENTS: "/stock-movements",
  STOCK_ADJUSTMENTS: "/stock-adjustments",
  EXPIRY: "/batches/expiry",

  // Customer
  ACCOUNT: "/account",
  CART: "/cart",
  CATALOG: {
    DETAIL: (slug: string) => `/catalog/${slug}`,
    INDEX: "/catalog",
  },
  CUSTOMERS: "/customers",

  // Reports
  REPORTS: {
    INDEX: "/reports",
    CREATE: "/reports/generate",
    DETAIL: (id: string) => `/reports/${id}`,
    HISTORY: "/reports/history",
  },

  // System
  NOTIFICATIONS: "/notifications",
  AUDIT_LOGS: "/audit-logs",
  ERROR_LOGS: "/error-logs",
  JOBS: "/jobs",
  MONITORING: "/monitoring",
  USERS: "/users",
  SETTINGS: "/settings",

  // Design system preview (development only)
  DESIGN_SYSTEM: "/design-system",

  // ---------------------------------------------------------------------------
  // Backward-compat aliases kept for existing SmartStock Pro code
  // ---------------------------------------------------------------------------

  /** @deprecated Use ROUTES.MEDICINES */
  PRODUCTS: {
    INDEX: "/medicines",
    GALLERY: "/medicines",
    DETAIL: (id: string) => `/medicines/${id}`,
  },

  /** @deprecated Use ROUTES.BATCHES */
  WAREHOUSES: {
    INDEX: "/batches",
    MAP: "/batches",
    DETAIL: (id: string) => `/batches/${id}`,
  },

  /** @deprecated Use ROUTES.STOCK_MOVEMENTS or ROUTES.BATCHES */
  STOCK: {
    IN: "/batches",
    OUT: "/stock-movements",
    MOVEMENTS: "/stock-movements",
  },

  TRANSFERS: {
    INDEX: "/transfers",
    CREATE: "/transfers/create",
    DETAIL: (id: string) => `/transfers/${id}`,
  },

  IMPORTS: {
    INDEX: "/imports",
    DETAIL: (id: string) => `/imports/${id}`,
  },
} as const;

/**
 * Backend API route paths. Use for direct browser hrefs (file downloads, templates).
 * Eden client uses Elysia type system directly — these are for <a href> only.
 */
export const API_ROUTES = {
  AUDIT_LOGS: "/v1/audit-logs",
  AUTH: "/v1/auth",
  BATCHES: "/v1/batches",
  CATEGORIES: "/v1/categories",
  CUSTOMERS: "/v1/customers",
  DASHBOARD: "/v1/dashboard",
  ERROR_LOGS: "/v1/error-logs",
  IMPORTS: "/v1/imports",
  IMPORTS_TEMPLATE: "/api/v1/imports/template",
  INTERNAL_USERS_TEMPLATE: "/api/__internal__/users/template",
  JOBS: "/v1/jobs",
  LOGIN: "/v1/login",
  LOGOUT: "/v1/logout",
  MEDICINES: "/v1/medicines",
  MONITORING: "/v1/monitoring",
  NOTIFICATIONS: "/v1/notifications",
  ORDERS: "/v1/orders",
  PAYMENTS: "/v1/payments",
  PRESCRIPTIONS: "/v1/prescriptions",
  PROFILE: "/v1/profile",
  REPORTS: "/v1/reports",
  REPORTS_DOWNLOAD: (id: string) => `/api/v1/reports/${id}/download`,
  STOCK_MOVEMENTS: "/v1/stock-movements",
  SUPPLIERS: "/v1/suppliers",
  USERS: "/v1/users",
  // Backward compat
  PRODUCTS: "/v1/medicines",
  STOCK: "/v1/stock",
  SYNC: "/v1/sync",
  TRANSFERS: "/v1/transfers",
  WAREHOUSES: "/v1/warehouses",
} as const;
