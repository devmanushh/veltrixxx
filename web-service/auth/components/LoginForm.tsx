"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { clearAuthSession, setAuthSession } from "@/auth/lib/auth";
import { loginUser } from "@/lib/api";
import { routes } from "@/routes";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void clearAuthSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const data = await loginUser(email, password);

      localStorage.setItem("user", JSON.stringify(data.user));
      await setAuthSession(data.token);
      toast.success("Signed in");

      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");

      router.push(next && next.startsWith("/") ? next : routes.spot);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      toast.error("Login failed", { description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel auth-card"
    >
      <h1 className="auth-title">Login</h1>

      <p className="section-copy">&ldquo;Markets move fast. So should you.&rdquo;</p>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="form-input auth-input"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="form-input auth-input"
      />

      <button
        type="submit"
        disabled={loading}
        className="primary-button"
      >
        {loading ? "Logging in..." : "Login"}
      </button>

      {error && <p className="text-danger">{error}</p>}

      <p className="text-muted">
        Don&apos;t have an account?{" "}
        <a href="/register" className="text-success">
          Register
        </a>
      </p>
    </form>
  );
}
