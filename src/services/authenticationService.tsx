import { getToken, removeToken } from "./localStorageService";

export const logOut = async () => {

  const accessToken = getToken();
  await fetch(
    "http://localhost:8080/datn/auth/logout",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        body: JSON.stringify(accessToken),
      },
    }
  );
  removeToken();
};

export { getToken };
