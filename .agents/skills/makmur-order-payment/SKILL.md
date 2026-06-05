---
name: makmur-order-payment
description: 'Enforce order and payment workflow: valid status transitions, prescription gating, server-side totals, stock reservation, payment creation, callback verification and idempotency, paid state, cancellation, expiration, refunds, stock release, order timeline, audit logs, and notifications.'
argument-hint: 'Order/payment feature to handle (example: payment callback, cancel flow)'
---

# Makmur Order and Payment Workflow

## When to Use
- Any order or payment change
- Payment provider callbacks or status transitions

## Coverage
- Valid status transitions
- Prescription gating
- Server-side totals
- Stock reservation and release
- Payment creation
- Callback verification
- Callback idempotency
- Paid status handling
- Cancellation and expiration
- Refund handling
- Order timeline
- Audit logs
- Notifications

## Procedure
1. Identify current order status model and allowed transitions.
2. Enforce prescription gating before payment progression.
3. Recalculate totals server-side.
4. Reserve stock during order progression; release on cancel/expire/refund.
5. Create payment intent and store provider references.
6. Verify callback authenticity and make handlers idempotent.
7. Update order/payment status with audit logging.
8. Emit notifications for relevant status changes.
9. Record timeline events for user visibility.

## Output
- Order/payment flow description
- Status transition map
- Idempotency notes
- Audit and notification entries

## Quality Checks
- Invalid transitions are rejected server-side
- Payment callbacks are idempotent
- Stock reservations are released on terminal states
