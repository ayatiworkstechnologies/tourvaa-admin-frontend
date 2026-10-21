import { describe, expect, it } from "vitest";

import { registrationEmailValidationError, validateEmail } from "@/lib/utils/validators";

describe("registration email validation", () => {
  it.each(["xyz@gmail.com", "test@example.com", "dummy@mailinator.com", "user+name@test.com"])(
    "rejects placeholder or disposable address %s",
    (email) => {
      expect(registrationEmailValidationError(email)).toContain("real email address");
    },
  );

  it("accepts a normal registration email", () => {
    expect(registrationEmailValidationError("alex.smith@gmail.com")).toBeNull();
  });

  it("does not alter general email syntax validation used by login", () => {
    expect(validateEmail("xyz@gmail.com")).toBe(true);
  });
});
