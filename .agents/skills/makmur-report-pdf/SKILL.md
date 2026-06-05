---
name: makmur-report-pdf
description: 'Generate reports with date range queries, total validation, PDF output with logo, charts, tables, page numbers, background generation, empty result handling, and download history.'
argument-hint: 'Report type and range (example: sales summary, last 30 days)'
---

# Makmur Report PDF

## When to Use
- Building or updating PDF reports
- Adding report generation jobs

## Coverage
- Report queries with date range
- Total validation
- PDF formatting
- Logo, charts, tables
- Page numbering
- Background generation
- Empty result handling
- Download history

## Procedure
1. Define report query and date range inputs.
2. Validate totals against source data.
3. Generate PDF layout with logo, chart, and tables.
4. Include page numbers and generation timestamp.
5. Handle empty results with clear messaging.
6. Run generation in background jobs for large reports.
7. Record download history and metadata.

## Output
- Report spec summary
- PDF layout checklist
- Background job and history plan

## Quality Checks
- Totals match authoritative data
- Empty state is explicit in PDF
- Report generation is repeatable and auditable
