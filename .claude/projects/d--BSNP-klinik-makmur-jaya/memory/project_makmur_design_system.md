---
name: project-makmur-design-system
description: Design system foundation built for Makmur Farma — token locations, component map, patterns to follow
metadata:
  type: project
---

Design system foundation was completed in June 2026.

**Why:** Assessment requires a complete, demonstrable pharmacy e-commerce system; the design system foundation provides the token and component base for all subsequent modules.

**How to apply:** Always follow the patterns established here before creating any new UI. Check `src/constants/design.ts` first for tokens, then `src/components/ui/` for existing components.

## Token location

All design tokens are CSS variables in `src/app/globals.css` under `@theme`. The naming convention is `--color-*`. Tailwind v4 automatically makes `bg-primary-blue`, `text-primary-blue`, etc. available as utilities.

Key token values (per DESIGN.md):
- Primary blue: `#3366FF`
- App background: `#F4F5FA`
- White sidebar (not dark)
- Card surface: white, radius 10px, `shadow-card`

## Class name constants

All component-specific class strings are centralised in `src/constants/design.ts`:
- `BUTTON_VARIANT_CLASS_NAMES`, `BUTTON_SIZE_CLASS_NAMES`
- `STATUS_TONE_CLASS_NAMES`
- `CARD_CLASS_NAMES`, `FIELD_CLASS_NAMES`, `SELECT_CLASS_NAMES`, `DATE_INPUT_CLASS_NAMES`
- Copy strings: `DIALOG_COPY`, `EMPTY_STATE_COPY`, `ERROR_STATE_COPY`, `PAGINATION_COPY`, `TABS_COPY`, `ACTION_MENU_COPY`, `PROGRESS_COPY`, `QUEUE_STATUS_COPY`, `STEPPER_STATUS_LABELS`
- Status types/labels/tones for all Makmur Farma domains

## Status badge domains

All domain badge types live in `src/components/ui/status-badge.tsx`:
- `StockStatusBadge`, `ExpiryStatusBadge`, `MedicineStatusBadge`
- `PrescriptionStatusBadge`, `OrderStatusBadge`, `PaymentStatusBadge`
- `JobStatusBadge`, `HealthStatusBadge`, `TransferStatusBadge`

Status type/label/tone mappings are in `src/constants/design.ts`.

## Sidebar

The sidebar is WHITE (not dark navy). Use `bg-sidebar-surface` (`#FFFFFF`), border `border-sidebar-border` (`#E7E9F1`). Active nav item uses `bg-sidebar-active-bg` (`#EAF0FF`) + `text-sidebar-active-text` (`#3366FF`).

## Roles (Makmur Farma)

Roles: `admin`, `pharmacist`, `cashier`, `customer` (in `src/constants/auth.ts`).
`hasPermission()` in `src/utils/permissions.ts` takes `UserRole` and `Permission`.

## Routes

All routes in `src/constants/routes.ts`. Main Makmur Farma routes:
- `/dashboard`, `/orders`, `/cashier`, `/payments`
- `/medicines`, `/categories`, `/prescriptions`, `/suppliers`
- `/batches`, `/stock-movements`, `/stock-adjustments`, `/expiry`
- `/customers`, `/reports`, `/notifications`, `/audit-logs`, `/error-logs`, `/monitoring`, `/users`, `/settings`

## Pre-existing broken stubs (NOT caused by design system work)

These files are empty and cause tsc errors — they need business logic implementation:
- `src/api/index.ts` — Elysia backend routes
- `src/hooks/useAuth.ts` — session auth hook
- `src/drizzle-schema/index.ts` — Drizzle database schema

## Design system preview page

Route: `/design-system` — shows all tokens, components, states, and navigation patterns. Development tool only.
