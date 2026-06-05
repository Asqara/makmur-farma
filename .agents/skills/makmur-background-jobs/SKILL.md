---
name: makmur-background-jobs
description: 'Design and review background job workflows: Redis queues, workers, retries, backoff, idempotency, dead-letter/final failure handling, and jobs for reports, email, imports, expiry scans, and low-stock scans.'
argument-hint: 'Job type or queue to implement (example: expiry scan, report generation)'
---

# Makmur Background Jobs

## When to Use
- Adding or changing background jobs
- Reviewing queue reliability and safety

## Coverage
- Redis and queue setup
- Worker behavior
- Retries and backoff
- Idempotency and deduping
- Dead-letter or final failure handling
- Report generation
- Email
- Import processing
- Expiry scans
- Low-stock scans

## Procedure
1. Identify job inputs and outputs.
2. Define idempotency keys and dedupe strategy.
3. Configure retries and backoff.
4. Specify failure handling and final failure records.
5. Ensure payloads avoid sensitive data.
6. Persist business status in PostgreSQL when user-visible.
7. Add monitoring and audit events where required.
8. Add tests for retry and idempotency behavior.

## Output
- Job definition summary
- Idempotency and retry configuration
- Failure handling plan
- Tests or checks added

## Quality Checks
- Jobs are idempotent under retries
- Final failures are recorded and visible
- Sensitive data stays out of Redis payloads
