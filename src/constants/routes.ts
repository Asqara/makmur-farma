/**
 * Public-facing route paths used across the app.
 */
export const ROUTES = {
  
  IMPORTS: {
    
    DETAIL: (id: string) => `/imports/${id}`,
  },
  PRODUCTS: {
    INDEX: "/products",
    GALLERY: "/products/gallery",
    DETAIL: (id: string) => `/products/${id}`,
  },
  REPORTS: {
    INDEX: "/reports",
    DETAIL: (id: string) => `/reports/${id}`,
    CREATE: "/reports/generate",
  },
  STOCK: {
    IN: "/stock-in",
    OUT: "/stock-out",
    MOVEMENTS: "/stock-movements",
  },
  SUPPLIERS: "/suppliers",
  TRANSFERS: {
    INDEX: "/transfers",
    CREATE: "/transfers/create",
    DETAIL: (id: string) => `/transfers/${id}`,
  },
  USERS: "/users",
  WAREHOUSES: {
    INDEX: "/warehouses",
    MAP: "/warehouses/map",
    DETAIL: (id: string) => `/warehouses/${id}`,
  },
} as const;

/**
 * Backend API route paths. Use for direct browser hrefs (file downloads, templates).
 * Eden client uses Elysia type system directly — these are for <a href> only.
 */
export const API_ROUTES = {
  AUDIT_LOGS: "/v1/audit-logs",
  AUTH: "/v1/auth",
  CATEGORIES: "/v1/categories",
  DASHBOARD: "/v1/dashboard",
  ERROR_LOGS: "/v1/error-logs",
  IMPORTS: "/v1/imports",
  IMPORTS_TEMPLATE: "/api/v1/imports/template",
  INTERNAL_USERS_TEMPLATE: "/api/__internal__/users/template",
  JOBS: "/v1/jobs",
  LOGIN: "/v1/login",
  LOGOUT: "/v1/logout",
  MONITORING: "/v1/monitoring",
  NOTIFICATIONS: "/v1/notifications",
  PRODUCTS: "/v1/products",
  PROFILE: "/v1/profile",
  REPORTS: "/v1/reports",
  REPORTS_DOWNLOAD: (id: string) => `/api/v1/reports/${id}/download`,
  STOCK: "/v1/stock",
  SUPPLIERS: "/v1/suppliers",
  SYNC: "/v1/sync",
  TRANSFERS: "/v1/transfers",
  USERS: "/v1/users",
  WAREHOUSES: "/v1/warehouses",
} as const;
