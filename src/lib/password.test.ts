import { describe, expect, it } from "vitest";

import {
  hashPassword,
  needsPasswordRehash,
  verifyPassword,
} from "./password";

describe("password hashing", () => {
  it("hashes with Argon2id and never returns plaintext", async () => {
    const password = "MakmurFarma123!";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash).toContain("$argon2id$");
    expect(needsPasswordRehash(hash)).toBe(false);
  });

  it("verifies the correct password and rejects the wrong password", async () => {
    const hash = await hashPassword("MakmurFarma123!");

    await expect(verifyPassword(hash, "MakmurFarma123!")).resolves.toBe(true);
    await expect(verifyPassword(hash, "MakmurFarma123?")).resolves.toBe(false);
  });
});
