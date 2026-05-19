"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { removeAuthCookie } from "@/auth/lib/auth";
import Logo from "@/components/Logo";
import { primaryNavRoutes, routes } from "@/routes";
import { useWalletStore } from "@/wallet/stores/walletStore";

type Theme = "dark" | "light";

const formatUsd = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

const getDisplayName = () => {
  if (typeof window === "undefined") {
    return "User";
  }

  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return "User";
  }

  try {
    const user = JSON.parse(storedUser);
    const email = String(user.email || "");
    return user.username || email.split("@")[0] || "User";
  } catch {
    return "User";
  }
};

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState("User");
  const [theme, setTheme] = useState<Theme>("dark");
  const wallet = useWalletStore((state) => state.wallet);
  const walletLoading = useWalletStore((state) => state.loading);
  const loadWallet = useWalletStore((state) => state.loadWallet);
  const resetWallet = useWalletStore((state) => state.resetWallet);

  useEffect(() => {
    setDisplayName(getDisplayName());

    const storedTheme = localStorage.getItem("theme");
    const savedTheme: Theme = storedTheme === "light" ? "light" : "dark";
    setTheme(savedTheme);
    document.documentElement.dataset.theme = savedTheme;
    document.documentElement.style.colorScheme = savedTheme;

    const onWalletUpdated = () => {
      void loadWallet();
    };

    void loadWallet();
    window.addEventListener("veltrix:orders-updated", onWalletUpdated);
    window.addEventListener("veltrix:wallet-updated", onWalletUpdated);

    return () => {
      window.removeEventListener("veltrix:orders-updated", onWalletUpdated);
      window.removeEventListener("veltrix:wallet-updated", onWalletUpdated);
    };
  }, [loadWallet]);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    toast.message(`${nextTheme === "dark" ? "Dark" : "Light"} theme enabled`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    resetWallet();
    removeAuthCookie();
    toast.message("Signed out");
    router.push(routes.login);
    router.refresh();
  };

  const navLinkStyle = (href: string) => ({
    className: pathname.startsWith(href) ? "app-nav-link app-nav-link-active" : "app-nav-link",
  });

  return (
    <header className="app-header">
      <Logo />

      <nav className="app-nav">
        {primaryNavRoutes.map((route) => (
          <Link key={route.href} href={route.href} {...navLinkStyle(route.href)}>
            {route.label}
          </Link>
        ))}
      </nav>

      <div className="app-header-actions">
        <span className="app-header-balance">
          {walletLoading ? "Balance ..." : formatUsd(wallet?.balance || 0)}
        </span>
        <span className="app-header-user">{displayName}</span>
        <button
          type="button"
          aria-label="Toggle theme"
          aria-pressed={theme === "light"}
          title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          onClick={toggleTheme}
          className="icon-button"
        >
          {theme === "dark" ? (
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.99 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 20.99 12.79Z" />
            </svg>
          )}
        </button>
        <button
          type="button"
          aria-label="Notifications"
          title="Notifications"
          className="icon-button"
        >
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
        <button
          onClick={handleLogout}
          className="ghost-button"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
