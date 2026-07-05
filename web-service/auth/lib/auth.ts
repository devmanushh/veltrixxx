export const getSafeAuthRedirect = (value: string | null, fallback: string) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
};

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const waitForAuthSession = async () => {
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await fetch("/api/auth/session", {
      credentials: "include",
      cache: "no-store",
    }).catch(() => null);

    if (res?.ok) {
      const data = await res.json().catch(() => ({}));

      if (data.authenticated === true) {
        return;
      }
    }

    await sleep(75);
  }

  throw new Error("Could not verify session cookie");
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
