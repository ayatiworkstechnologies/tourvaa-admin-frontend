import { describe, expect, it } from "vitest";
import { AxiosError } from "axios";
import { getApiErrorMessage } from "@/lib/utils/errorHandler";

describe("network error feedback", () => {
  it("does not encourage blindly resubmitting a timed-out mutation", () => {
    expect(getApiErrorMessage(new AxiosError("timeout", "ECONNABORTED"))).toContain("Check whether your changes were saved");
  });
  it("explains connection failures", () => {
    expect(getApiErrorMessage(new AxiosError("Network Error", "ERR_NETWORK"))).toContain("internet connection");
  });
});
