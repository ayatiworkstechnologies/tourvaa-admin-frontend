import {
  clearSession,
  getStoredTokenSafe,
  getToken,
  setToken,
} from "@/lib/session";

export const saveToken = (token: string) => {
  setToken(token);
};

export const removeToken = () => {
  clearSession();
};

export const saveUser = (user: unknown) => {
  void user;
};

export const getUser = () => {
  return null;
};

export { clearSession, getStoredTokenSafe, getToken, setToken };
