import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AuthShell, { fieldClass, primaryButton } from "../components/AuthShell.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await login(email, password);
      navigate(location.state?.from?.pathname ?? (user.role === "admin" ? "/admin" : "/"), { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Sign in with email">
      <form onSubmit={onSubmit}>
        <label className="block text-xs text-muted">Email
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
        </label>
        <label className="mt-4 block text-xs text-muted">Password
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={fieldClass} />
        </label>
        {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
        <button disabled={busy} className={`${primaryButton} mt-8`}>{busy ? "Signing in..." : "Sign in"}</button>
      </form>

      <p className="mt-6 text-center text-xs text-muted">
        No account? <Link to="/register" state={location.state} className="font-semibold text-fg">Register</Link>
      </p>
      <Link to="/" className="mt-6 block h-11 w-full bg-muted text-center text-sm font-semibold uppercase leading-[2.75rem] tracking-wide text-bg transition hover:opacity-85">
        Continue as guest
      </Link>
    </AuthShell>
  );
}