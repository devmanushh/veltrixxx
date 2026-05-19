// lib/auth.ts

export const setAuthCookie = (token: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;
};

export const removeAuthCookie = () => {
  if (typeof document === "undefined") return;
  document.cookie = "token=; path=/; max-age=0";
};

export const clearAuthSession = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  removeAuthCookie();
};
