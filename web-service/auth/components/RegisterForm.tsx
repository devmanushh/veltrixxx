"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { clearAuthSession, setAuthCookie } from "@/auth/lib/auth";
import { registerUser } from "@/lib/api";
import { routes } from "@/routes";

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
      toast.success("Account created");

      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");

      router.push(next && next.startsWith("/") ? next : routes.spot);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
      toast.error("Registration failed", { description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleRegister}
      className="glass-panel auth-card"
    >
      <h1 className="auth-title">Register</h1>
      <p>&ldquo;Don&apos;t watch the market. Own it.&rdquo;</p>

      <input
        type="email"
        placeholder="Email"
        className="form-input auth-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="form-input auth-input"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        type="submit"
        disabled={loading}
        className="primary-button"
      >
        {loading ? "Registering..." : "Register"}
      </button>

      {error && <p className="text-danger">{error}</p>}

      <p className="text-muted">
        Already have an account?{" "}
        <a href="/login" className="text-success">
          Login
        </a>
      </p>
    </form>
  );
}
