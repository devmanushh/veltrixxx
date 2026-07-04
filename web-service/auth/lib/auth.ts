export const setAuthSession = async (token: string) => {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    throw new Error("Could not persist session");
  }
};

export const clearAuthSession = async () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user");
  }

  await fetch("/api/auth/session", {
    method: "DELETE",
    credentials: "include",
  }).catch(() => undefined);
};