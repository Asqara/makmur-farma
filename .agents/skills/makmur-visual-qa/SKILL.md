---
name: makmur-visual-qa
description: 'Visual QA using browser and screenshots: alignment, overflow, card height, sidebar expanded/collapsed, mobile drawer, topbar, form errors, tables, dialogs, responsive behavior, loading, empty, and permission states. Output must include pages, viewports, issues, changes, and after-fix evidence.'
argument-hint: 'Pages to validate and target breakpoints (example: /login, /dashboard; 375/768/1024/1440)'
---

# Makmur Visual QA

## When to Use
- Visual validation before demos or reports
- After UI changes that may impact layout or states

## Coverage Checklist
- Alignment and spacing
- Overflow and clipping
- Card height consistency
- Sidebar expanded and collapsed
- Mobile drawer behavior
- Topbar layout
- Form error states
- Tables and column alignment
- Dialog layout
- Responsive behavior
- Loading state
- Empty state
- Permission-denied state

## Procedure
1. Open target pages in the browser.
2. Test each required viewport and capture screenshots.
3. Toggle sidebar expanded and collapsed if applicable.
4. Open mobile drawer on small viewports if applicable.
5. Trigger loading, empty, error, and permission states where possible.
6. Inspect for alignment, overflow, and card height issues.
7. Note any defects and adjust UI if needed.
8. Capture after-fix screenshots for each corrected issue.

## Required Output
- Pages tested
- Viewports tested
- Issues found
- Changes applied
- After-fix evidence (screenshots)

## Quality Checks
- All listed states were reviewed or explicitly noted as not applicable
- After-fix evidence exists for any changes
