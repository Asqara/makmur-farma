---
name: makmur-stock-batch
description: 'Handle stock with batch-based, concurrency-safe rules: received/expiry dates, available/reserved quantities, nearest-expiry-first allocation, stock movements, reservations, releases, cancellations, adjustments, returns, disposal, transactions, locking, and concurrency tests. Disallow direct stock edits, Redis as stock source, trusting client quantities, allocating expired batches, or reducing stock without movement history.'
argument-hint: 'Stock flow or feature (example: order reservation, return processing)'
---

# Makmur Stock Batch Workflow

## When to Use
- Any feature touching stock, orders, reservations, or returns
- Changes to allocation or batch logic

## Guardrails (Must Not)
- Edit stock directly without movements
- Use Redis as the stock source of truth
- Trust quantities from the client
- Allocate expired batches
- Reduce stock without movement history

## Required Concepts
- Batch number
- Received date
- Expiry date
- Available quantity
- Reserved quantity
- Allocation: nearest-expiry-first
- Stock movement records
- Reservation, release, cancellation, adjustment, return, disposal

## Procedure
1. Read existing stock and batch schema.
2. Confirm allocation order: earliest expiry, then earliest received, then stable ID.
3. Implement all stock changes as movements with context.
4. Use database transactions for reservation and fulfillment.
5. Apply locking or atomic updates to prevent double allocation.
6. Reject expired or blocked batches.
7. Recalculate authoritative quantities server-side.
8. Add concurrency-focused tests for reservation and release.

## Output
- Stock flow description
- Movement types used
- Concurrency strategy summary
- Tests covering allocation and reservation

## Quality Checks
- Allocation is expiry-aware and deterministic
- Movements are recorded for all stock changes
- Concurrency tests exist for critical flows
