export const saveToken = (token: string) => {
  localStorage.setItem("tourvaa_token", token);
};

export const getToken = () => {
  return localStorage.getItem("tourvaa_token");
};

export const removeToken = () => {
  localStorage.removeItem("tourvaa_token");
};

export const saveUser = (user: unknown) => {
  localStorage.setItem("tourvaa_user", JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem("tourvaa_user");
  return user ? JSON.parse(user) : null;
};