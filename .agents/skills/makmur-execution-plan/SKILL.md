---
name: makmur-execution-plan
description: 'Break large Makmur Farma features into verifiable work: scope, assumptions, dependencies, risks, checklist, impacted files, database impact, security impact, test plan, and acceptance criteria. Use for auth, orders, prescriptions, payments, stock, import, and reports.'
argument-hint: 'Feature or module to plan (example: payment callback idempotency)'
---

# Makmur Execution Plan

## When to Use
- Large or multi-step feature work
- Cross-module changes
- High-risk domains: auth, orders, prescriptions, payments, stock, import, reports

## Output
Produce a short plan containing:
- Scope
- Assumptions
- Dependencies
- Risks
- Checklist
- Impacted files
- Database impact
- Security impact
- Test plan
- Acceptance criteria

## Procedure
1. Restate the requested feature in one sentence.
2. Define scope and explicit non-scope.
3. List assumptions and information gaps.
4. Identify dependencies (services, schemas, queues, configs, external APIs).
5. Note key risks (data integrity, concurrency, security, UX regressions).
6. Draft a checklist of small verifiable tasks.
7. List impacted files and modules.
8. Assess database impact (tables, migrations, data safety).
9. Assess security impact (authz, validation, sensitive data exposure).
10. Define a test plan (unit, integration, e2e) and data setup.
11. State acceptance criteria with measurable outcomes.

## Quality Checks
- Checklist items are small and testable
- Risks include data and security implications
- Acceptance criteria are specific and verifiable
