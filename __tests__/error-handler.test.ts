import { describe, expect, it } from "vitest";
import { AxiosError } from "axios";
import { getApiErrorMessage, getValidationErrors, isForbidden, isUnauthorized } from "@/lib/error-handler";

function axiosError(status: number, data: unknown) {
  return new AxiosError("Request failed", undefined, undefined, undefined, {
    status,
    statusText: "Error",
    headers: {},
    config: {},
    data,
  });
}

describe("error-handler", () => {
  it("detects auth errors", () => {
    expect(isUnauthorized(axiosError(401, {}))).toBe(true);
    expect(isForbidden(axiosError(403, {}))).toBe(true);
  });

  it("formats validation errors", () => {
    const error = axiosError(422, {
      detail: [{ loc: ["body", "email"], msg: "Invalid email" }],
    });
    expect(getValidationErrors(error)).toEqual(["email: Invalid email"]);
    expect(getApiErrorMessage(error)).toBe("email: Invalid email");
  });
});
