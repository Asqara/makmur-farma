# Lib

Infrastructure utilities. Not business logic.

## Rules

- Each file is server-only OR client-only, never both.
- Server-only files: first line is `import "server-only"`.
- Client-only files: first line is `"use client"`.
