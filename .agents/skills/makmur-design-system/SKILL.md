---
name: makmur-design-system
description: 'Ensure UI follows DESIGN.md: design tokens, typography, sidebar, topbar, cards, tables, badges, forms, status colors, responsive behavior, accessibility, and empty/error/loading states. Disallow topbar search, dark sidebar, random hex colors, duplicate components, one-off styling, and inconsistent status colors.'
argument-hint: 'Target page or component set (example: dashboard metrics, orders table)'
---

# Makmur Design System Guard

## When to Use
- Any UI work that must align with DESIGN.md
- New pages, components, or UI refactors

## Guardrails (Must Not)
- Add topbar search
- Use dark sidebar
- Introduce random hex colors outside tokens
- Create duplicate components when a shared component exists
- Add one-off styling that bypasses the design system
- Use inconsistent status colors

## Areas to Check
- Design tokens
- Typography
- Sidebar
- Topbar
- Cards
- Tables
- Badges
- Forms
- Status colors
- Responsive behavior
- Accessibility
- Empty states
- Error states
- Loading states

## Procedure
1. Read DESIGN.md and note relevant tokens and component patterns.
2. Identify existing components that match the target UI.
3. Map each UI element to a token or reusable component.
4. Check typography scale and spacing against design tokens.
5. Validate sidebar and topbar layout rules.
6. Verify cards, tables, badges, and forms use shared components or patterns.
7. Confirm status colors match established semantics.
8. Verify responsive behavior across breakpoints.
9. Ensure accessibility basics (labels, focus, contrast) are present.
10. Ensure empty, error, and loading states are covered.

## Output
- Short compliance summary
- Deviations with specific remediation steps

## Quality Checks
- No guardrail violations
- All UI elements mapped to tokens or shared components
- Responsive and state coverage confirmed
