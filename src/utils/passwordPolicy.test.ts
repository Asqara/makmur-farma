import { describe, expect, it } from "vitest";

import { validatePasswordStrength } from "./passwordPolicy";

describe("validatePasswordStrength", () => {
  it("accepts passwords with at least 10 characters and three character groups", () => {
    expect(validatePasswordStrength("Makmur1234").isValid).toBe(true);
    expect(validatePasswordStrength("makmur-1234").isValid).toBe(true);
  });

  it("rejects short passwords", () => {
    const result = validatePasswordStrength("Abc123!");

    expect(result.isValid).toBe(false);
    expect(result.messages).toContain(
      "Password harus terdiri dari minimal 10 karakter.",
    );
  });

  it("rejects passwords with fewer than three character groups", () => {
    const result = validatePasswordStrength("makmurfarmaku");

    expect(result.isValid).toBe(false);
    expect(result.messages).toContain(
      "Password harus menggunakan minimal tiga jenis karakter.",
    );
  });
});
