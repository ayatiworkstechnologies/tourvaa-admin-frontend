import axios from "axios";

type ApiValidationDetail = {
  loc?: (string | number)[];
  msg?: string;
};

export function isUnauthorized(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

export function isForbidden(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 403;
}

export function getValidationErrors(error: unknown) {
  if (!axios.isAxiosError(error) || error.response?.status !== 422) return [];

  const detail = error.response.data?.detail;

  if (!Array.isArray(detail)) {
    return typeof detail === "string" ? [detail] : [];
  }

  return detail.map((item: ApiValidationDetail) => {
    const field = item.loc?.filter((part) => part !== "body").join(".");
    return field ? `${field}: ${item.msg || "Invalid value"}` : item.msg || "Invalid value";
  });
}

/**
 * Maps a 422 validation error to { fieldName: message } so forms can show
 * the error inline under the specific input instead of only in a toast/banner.
 */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError(error) || error.response?.status !== 422) return {};

  const detail = error.response.data?.detail;
  if (!Array.isArray(detail)) return {};

  const fields: Record<string, string> = {};
  for (const item of detail as ApiValidationDetail[]) {
    const field = item.loc?.filter((part) => part !== "body").join(".");
    if (field) fields[field] = item.msg || "Invalid value";
  }
  return fields;
}

export function getApiErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error)) return "Something went wrong. Please try again.";

  const responseData = error.response?.data;
  const detail = responseData?.detail;
  const serverMessage =
    (typeof responseData?.message === "string" && responseData.message) ||
    (typeof detail === "string" && detail) ||
    (typeof detail?.message === "string" && detail.message) ||
    "";

  if (error.response?.status === 401) return "Your session has expired. Please log in again.";
  if (error.response?.status === 403) {
    return serverMessage || "Access denied. You do not have permission for this action.";
  }
  if (error.response?.status === 422) {
    const validationErrors = getValidationErrors(error);
    return validationErrors[0] || "Please check the submitted fields.";
  }
  if (error.response?.status && error.response.status >= 500) {
    return "The server could not complete the request. Please try again later.";
  }

  return (
    serverMessage ||
    error.message ||
    "Something went wrong. Please try again."
  );
}
