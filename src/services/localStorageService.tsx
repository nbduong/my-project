export const KEY_TOKEN = "accessToken";

export const setToken = (token: string) => {
  localStorage.setItem(KEY_TOKEN, token);
};

export const getToken = () => {
  return localStorage.getItem(KEY_TOKEN);
};

export const removeToken = () => {
  console.log("remove")
  return localStorage.removeItem(KEY_TOKEN);
};
