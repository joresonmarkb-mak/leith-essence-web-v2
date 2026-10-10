import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AuthShell, { fieldClass, primaryButton } from "../components/AuthShell.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(form);
      navigate(location.state?.from?.pathname ?? "/", { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const fields = [
    ["email", "Email", "email", "email"],
    ["firstName", "First Name", "text", "given-name"],
    ["lastName", "Last Name", "text", "family-name"],
    ["phone", "Phone number", "tel", "tel"],
    ["password", "Password", "password", "new-password"],
  ];

  return (
    <AuthShell title="Create Account">
      <form onSubmit={onSubmit}>
        {fields.map(([key, label, type, autoComplete], i) => (
          <label key={key} className={`block text-xs text-muted ${i ? "mt-4" : ""}`}>{label}
            <input type={type} required autoComplete={autoComplete} minLength={key === "password" ? 8 : undefined}
              value={form[key]} onChange={set(key)} className={fieldClass} />
          </label>
        ))}
        <p className="mt-2 text-[11px] text-muted">Password needs at least 8 characters.</p>
        {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
        <button disabled={busy} className={`${primaryButton} mt-6`}>{busy ? "Creating account..." : "Sign up"}</button>
      </form>
      <div className="my-6 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
      <p className="text-center text-xs text-muted">
        Already have an account? <Link to="/login" state={location.state} className="font-semibold text-fg">Login</Link>
      </p>
    </AuthShell>
  );
}