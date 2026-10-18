import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import AuthShell, { fieldClass, primaryButton } from "../components/AuthShell.jsx";
import GoogleButton, { googleEnabled } from "../components/GoogleButton.jsx";
import Navbar from "../context/Navbar.jsx";
import Footer from "../components/Footer.jsx";

export default function Register() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null); // set after a successful sign-up

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await register(form);
      setDone({ email: res.email, emailSent: res.emailSent });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle(credential) {
    setError("");
    try {
      await loginWithGoogle(credential);
      navigate(location.state?.from?.pathname ?? "/", { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  async function resend() {
    setError("");
    setInfo("");
    try {
      const r = await api("/auth/resend-verification", { method: "POST", body: { email: done.email } });
      setInfo(r.message);
    } catch (err) {
      setError(err.message);
    }
  }

  const fields = [
    ["email", "Email", "email", "email"],
    ["firstName", "First Name", "text", "given-name"],
    ["lastName", "Last Name", "text", "family-name"],
    ["phone", "Phone number", "tel", "tel"],
    ["password", "Password", "password", "new-password"],
  ];

  if (done) {
    return (
      <>
        <Navbar />
        <AuthShell title="">
          <img src="/LE.png" alt="Leith Essence" className="mx-auto mb-6 h-16 w-16 object-contain sm:h-20 sm:w-20" />
          <h1 className="text-center text-lg font-semibold text-fg">Check your email</h1>
          <p className="mt-4 text-center text-sm">
            {done.emailSent ? (
              <>We sent a confirmation link to <strong className="break-all">{done.email}</strong>. Open it to finish creating your account. It works for 24 hours.</>
            ) : (
              <>Your account is created, but we couldn't send the email to <strong className="break-all">{done.email}</strong> just now. Press the button below to try again.</>
            )}
          </p>
          <p className="mt-3 text-center text-xs text-muted">Can't find it? Check your spam or Promotions folder.</p>
          {error && <p role="alert" className="mt-4 text-center text-sm text-danger">{error}</p>}
          {info && <p role="status" className="mt-4 text-center text-sm">{info}</p>}
          <button type="button" onClick={resend} className={`${primaryButton} mt-6`}>Resend email</button>
          <p className="mt-6 text-center text-xs text-muted">
            Already confirmed? <Link to="/login" className="font-semibold text-fg">Login</Link>
          </p>
        </AuthShell>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <AuthShell title="">
        <img src="/LE.png" alt="Leith Essence" className="mx-auto mb-6 h-16 w-16 object-contain sm:h-20 sm:w-20" />
        <h1 className="text-center text-lg font-semibold text-fg">Create Account</h1>

        {googleEnabled && (
          <div className="mt-6">
            <GoogleButton onCredential={onGoogle} text="signup_with" />
            <div className="my-5 flex items-center gap-3 text-[11px] uppercase text-muted">
              <span className="h-px flex-1 bg-line" />or use email<span className="h-px flex-1 bg-line" />
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className={googleEnabled ? "" : "mt-6"}>
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
      <Footer />
    </>
  );
}