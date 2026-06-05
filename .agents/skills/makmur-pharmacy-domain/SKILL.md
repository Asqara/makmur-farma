---
name: makmur-pharmacy-domain
description: 'Enforce pharmacy domain rules: OTC vs prescription meds, prescriptions, pharmacist verification, batches, expiry, suppliers, customers, cashier, online/counter sales. Disallow invented drug composition/dosage/side effects, diagnosis, recommending prescription meds, bypassing verification, or altering original prescriptions.'
argument-hint: 'Feature or module to review (example: prescription approval flow)'
---

# Makmur Pharmacy Domain Guard

## When to Use
- Any feature touching medicines, prescriptions, or sales flows
- Domain logic or UI copy that might imply medical advice

## Domain Concepts
- OTC (obat bebas)
- Prescription medicines (obat resep)
- Doctor prescriptions
- Pharmacist verification
- Batches and expiry
- Suppliers
- Customers
- Cashier workflows
- Online vs counter sales

## Guardrails (Must Not)
- Invent drug composition
- Invent dosage or side effects
- Provide diagnosis
- Recommend prescription medicines
- Allow prescription medicines without verification
- Modify original prescription documents

## Procedure
1. Identify whether medicines are OTC or prescription.
2. Confirm prescription-only flows require verification.
3. Ensure pharmacist actions are logged and immutable.
4. Preserve original prescription files.
5. Validate stock by batch and expiry.
6. Verify role permissions for cashier, pharmacist, and customer actions.
7. Check UI copy avoids medical advice or unsupported claims.

## Output
- Domain compliance notes
- Any violations and required fixes

## Quality Checks
- Prescription gating enforced server-side
- No medical advice or invented drug details
- Prescription files remain immutable
