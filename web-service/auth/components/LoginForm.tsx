type LoginFormProps = {
  nextPath: string;
  error?: string;
};

export default function LoginForm({ nextPath, error = "" }: LoginFormProps) {
  return (
    <form
      action="/api/auth/login"
      method="post"
      className="glass-panel auth-card"
    >
      <h1 className="auth-title">Login</h1>

      <p className="section-copy">&ldquo;Markets move fast. So should you.&rdquo;</p>

      <input type="hidden" name="next" value={nextPath} />

      <input
        type="email"
        name="email"
        placeholder="Email"
        required
        autoComplete="email"
        className="form-input auth-input"
      />

      <input
        type="password"
        name="password"
        placeholder="Password"
        required
        autoComplete="current-password"
        className="form-input auth-input"
      />

      <button
        type="submit"
        className="primary-button"
      >
        Login
      </button>

      {error && <p className="text-danger">{error}</p>}

      <p className="text-muted">
        Don&apos;t have an account?{" "}
        <a href={`/register?next=${encodeURIComponent(nextPath)}`} className="text-success">
          Register
        </a>
      </p>
    </form>
  );
}
