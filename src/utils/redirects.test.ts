import { describe, expect, it } from "vitest";

import { getSafeRedirectPath } from "./redirects";

describe("getSafeRedirectPath", () => {
  it("uses role defaults when redirect is missing", () => {
    expect(getSafeRedirectPath(undefined, "ADMIN")).toBe("/dashboard");
    expect(getSafeRedirectPath(undefined, "CUSTOMER")).toBe("/account");
  });

  it("rejects external and protocol-like redirects", () => {
    expect(getSafeRedirectPath("https://example.com", "ADMIN")).toBe(
      "/dashboard",
    );
    expect(getSafeRedirectPath("//example.com", "CUSTOMER")).toBe("/account");
    expect(getSafeRedirectPath("javascript:alert(1)", "ADMIN")).toBe(
      "/dashboard",
    );
  });

  it("keeps users inside role-appropriate areas", () => {
    expect(getSafeRedirectPath("/dashboard", "CUSTOMER")).toBe("/account");
    expect(getSafeRedirectPath("/account", "ADMIN")).toBe("/dashboard");
    expect(getSafeRedirectPath("/orders", "CASHIER")).toBe("/orders");
  });
});
