---
name: makmur-page-builder
description: 'Build Makmur Farma pages using existing design system components. Find similar pages/components, read DESIGN.md, check permissions, compose header/toolbar/states, implement responsive layout, and verify with Playwright at 375/768/1024/1440.'
argument-hint: 'Target page and route (example: /dashboard/orders)'
---

# Makmur Page Builder

## When to Use
- Building a new page or refactoring an existing page
- UI work that must follow the existing design system

## Guardrails
- Do not create new UI primitives before searching existing components

## Procedure
1. Find similar pages and reusable components.
2. Read DESIGN.md for layout and token rules.
3. Check required permissions for the page and actions.
4. Compose the page header using existing components.
5. Compose the toolbar with established patterns.
6. Add loading, empty, error, and permission-denied states.
7. Implement responsive layout.
8. Verify layout at 375, 768, 1024, and 1440 px.
9. Use Playwright to validate the result visually.

## Output
- Page composed from existing components
- Visual verification notes with breakpoints

## Quality Checks
- No new primitives added without prior search
- States and permissions are handled
- Responsive layout verified at all breakpoints
