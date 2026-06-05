---
name: makmur-project-reader
description: 'Ensure agents read project context before making changes: AGENTS.md, DESIGN.md, nearest README, related docs, package/scripts, similar code, existing patterns, and impacted files. Use for larger tasks, cross-module changes, or first-time work in a folder.'
argument-hint: 'Target area or feature to review (example: orders API, dashboard UI)'
---

# Makmur Project Reader

## When to Use
- New tasks that are non-trivial
- Cross-module changes
- Work in folders not previously reviewed

## Outcome
- Context is gathered before any edits
- A clear list of impacted files and patterns to follow
- Reduced risk of blind changes

## Procedure
1. Read AGENTS.md to confirm project rules and priorities.
2. Read DESIGN.md for UI/UX work, if present.
3. Find and read the nearest README.md to the target area.
4. Read related docs under docs/ that match the target area.
5. Inspect package.json scripts and tooling expectations.
6. Search for similar modules, pages, services, schemas, or tests.
7. Identify existing patterns and conventions to follow.
8. Draft a list of impacted files and data flows.
9. Only after steps 1-8, proceed with any edits.

## Quality Checks
- All required docs were reviewed before editing
- Similar code was located and patterns noted
- Impacted files list is explicit and scoped

## Notes
- This is an explicit skill; do not auto-run for one-line changes.
