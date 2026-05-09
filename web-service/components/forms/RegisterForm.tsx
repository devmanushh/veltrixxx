"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAuthSession, setAuthCookie } from "@/lib/auth";
import { registerUser } from "@/services/api";

export default function RegisterForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    clearAuthSession();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const data = await registerUser(email, password);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setAuthCookie(data.token);

      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");

      router.push(next && next.startsWith("/") ? next : "/spot");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleRegister}
      style={{
        width: "min(100%, 380px)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Register</h1>

      <input
        type="email"
        placeholder="Email"
        style={{ width: "100%", padding: 12, border: "1px solid #d1d5db", borderRadius: 6 }}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        style={{ width: "100%", padding: 12, border: "1px solid #d1d5db", borderRadius: 6 }}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 6,
          background: "#111827",
          color: "white",
          border: 0,
          cursor: loading ? "default" : "pointer",
        }}
      >
        {loading ? "Registering..." : "Register"}
      </button>

      {error && <p style={{ color: "#dc2626", marginTop: 0 }}>{error}</p>}

      <p style={{ fontSize: 14 }}>
        Already have an account?{" "}
        <a href="/login" style={{ color: "#2563eb" }}>
          Login
        </a>
      </p>
    </form>
  );
}
