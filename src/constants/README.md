# Constants

Application-wide constants. Never hardcode values inline.

## 📂 Structure

- `app.ts` — App identity (name, URL).
- `config.ts` — Environment variables configurations and validations.
- `cookies.ts` — Cookie names.
- `routes.ts` — Centralized route paths for frontend navigation and direct API links.

## 📏 Naming Conventions

- Use **UPPER_SNAKE_CASE** for all constants, even if it is not an environment variable. 
  - *Example:* `export const API_URL = "https://api.example.com";`

---

## 🧭 Routing (`routes.ts`)

All routing paths must be imported from this file to ensure consistency and prevent typos. 

### 1. Frontend Routes (`ROUTES`)
Public-facing route paths used across the application components (e.g., `<Link>` components or router pushes).

**Usage Example:**
```typescript
import { ROUTES } from "@/constants/routes";

// Static routes
const productsPath = ROUTES.PRODUCTS.INDEX;          // "/products"
const stockInPath = ROUTES.STOCK.IN;                 // "/stock-in"

// Dynamic routes (invoke as a function)
const productDetail = ROUTES.PRODUCTS.DETAIL("123"); // "/products/123"

## ⚙️ Environment Configuration (`config.ts`)

All environment variables must be centralized and exported from this file. **Do not use `process.env` directly** in your application code; always import from the `ENV` constant to ensure type safety and consistency.

**Implementation Example (`config.ts`):**
```typescript
export const ENV = {
  databaseUrl: process.env.DATABASE_URL,
  nextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL,
  // ...other env variables
} as const;