"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { removeAuthCookie } from "@/lib/auth";
import Logo from "@/components/ui/logo";

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
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    setDisplayName(getDisplayName());

    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (nextTheme: string) => {
    const root = document.documentElement;
    root.dataset.theme = nextTheme;
    root.style.setProperty("--app-bg", nextTheme === "dark" ? "#0b0e11" : "#eef2f7");
    root.style.setProperty("--app-fg", nextTheme === "dark" ? "#f4f4f5" : "#111827");
    root.style.setProperty("--app-panel", nextTheme === "dark" ? "#11141c" : "#ffffff");
    root.style.setProperty("--app-border", nextTheme === "dark" ? "#20242d" : "#d1d5db");
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    applyTheme(nextTheme);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    removeAuthCookie();
    router.push("/login");
    router.refresh();
  };

  const navLinkStyle = (href: string) => ({
    color: pathname.startsWith(href) ? "#ffffff" : "#a1a1aa",
    fontWeight: pathname.startsWith(href) ? 700 : 500,
    textDecoration: "none",
  });

  return (
    <header
      style={{
        height: 64,
        flex: "0 0 64px",
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "0 22px",
        background: "#0b0e11",
        borderBottom: "1px solid var(--app-border, #20242d)",
        color: "#f4f4f5",
      }}
    >
      <Logo />

      <nav style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 15, color: "#a1a1aa" }}>
        <Link href="/spot" style={navLinkStyle("/spot")}>Spot</Link>
        <Link href="/future" style={navLinkStyle("/future")}>Futures</Link>
        <Link href="/balance" style={navLinkStyle("/balance")}>Balance</Link>
        <Link href="/portfolio" style={navLinkStyle("/portfolio")}>Portfolio</Link>
        <Link href="/vault" style={navLinkStyle("/vault")}>Vault</Link>
      </nav>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ color: "#d4d4d8", fontSize: 14 }}>{displayName}</span>
        <button
          type="button"
          onClick={toggleTheme}
          style={{
            height: 36,
            padding: "0 12px",
            borderRadius: 8,
            border: "1px solid #272b35",
            background: "#171a22",
            color: "#f4f4f5",
          }}
        >
          {theme === "dark" ? "Light" : "Dark"}
        </button>
        <button
          type="button"
          aria-label="Notifications"
          title="Notifications"
          style={{
            width: 36,
            height: 36,
            display: "grid",
            placeItems: "center",
            borderRadius: 8,
            border: "1px solid #272b35",
            background: "#171a22",
            color: "#f4f4f5",
          }}
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
      </div>

      <button
        onClick={handleLogout}
        style={{
          height: 36,
          padding: "0 14px",
          borderRadius: 8,
          border: "1px solid #272b35",
          background: "#171a22",
          color: "#f4f4f5",
        }}
      >
        Logout
      </button>
    </header>
  );
}
