import { describe, expect, it } from "vitest";

import { Auth } from ".";

describe("Auth schemas", () => {
  it("accepts valid customer registration input", () => {
    const result = Auth.register.safeParse({
      confirmPassword: "MakmurFarma123!",
      email: "pelanggan@example.test",
      fullName: "Budi Pelanggan",
      password: "MakmurFarma123!",
      phone: "081234567890",
      termsAccepted: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejects mismatched confirmation password", () => {
    const result = Auth.register.safeParse({
      confirmPassword: "MakmurFarma123?",
      email: "pelanggan@example.test",
      fullName: "Budi Pelanggan",
      password: "MakmurFarma123!",
      phone: "081234567890",
      termsAccepted: true,
    });

    expect(result.success).toBe(false);
  });

  it("does not allow role input on public registration", () => {
    const result = Auth.register.safeParse({
      confirmPassword: "MakmurFarma123!",
      email: "pelanggan@example.test",
      fullName: "Budi Pelanggan",
      password: "MakmurFarma123!",
      phone: "081234567890",
      role: "ADMIN",
      termsAccepted: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect("role" in result.data).toBe(false);
    }
  });
});
