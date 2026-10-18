import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import AuthShell, { fieldClass, primaryButton } from "../components/AuthShell.jsx";
import GoogleButton, { googleEnabled } from "../components/GoogleButton.jsx";
import Navbar from "../context/Navbar.jsx";
import Footer from "../components/Footer.jsx";

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [needsVerify, setNeedsVerify] = useState(false);
  const [busy, setBusy] = useState(false);

  const goNext = (user) =>
    navigate(location.state?.from?.pathname ?? (user.role === "admin" ? "/admin" : "/"), { replace: true });

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setNeedsVerify(false);
    setBusy(true);
    try {
      goNext(await login(email, password));
    } catch (err) {
      setError(err.message);
      setNeedsVerify(err.code === "EMAIL_NOT_VERIFIED");
      setBusy(false);
    }
  }

  async function onGoogle(credential) {
    setError("");
    setInfo("");
    try {
      goNext(await loginWithGoogle(credential));
    } catch (err) {
      setError(err.message);
    }
  }

  async function resend() {
    setError("");
    setInfo("");
    try {
      const r = await api("/auth/resend-verification", { method: "POST", body: { email } });
      setInfo(r.message);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <Navbar />
      <AuthShell>
        <img
          src="/LE.png"
          alt="Leith Essence"
          className="mx-auto mb-6 h-16 w-16 object-contain sm:h-20 sm:w-20"
        />
        <h1 className="text-center text-lg font-semibold text-fg">Sign in</h1>



        <form onSubmit={onSubmit} className={googleEnabled ? "" : "mt-6"}>
          <label className="block text-xs text-muted">Email
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
          </label>
          <label className="mt-4 block text-xs text-muted">Password
            <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={fieldClass} />
          </label>
          {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
          {needsVerify && (
            <button type="button" onClick={resend} className="mt-2 min-h-11 text-sm font-semibold text-fg underline">
              Resend confirmation email
            </button>
          )}
          {info && <p role="status" className="mt-4 text-sm">{info}</p>}
          <button disabled={busy} className={`${primaryButton} mt-8`}>{busy ? "Signing in..." : "Sign in"}</button>
        </form>
        {googleEnabled && (
          <div className="mt-6">
            <GoogleButton onCredential={onGoogle} />

          </div>
        )}
        <p className="mt-6 text-center text-xs text-muted">
          No account? <Link to="/register" state={location.state} className="font-semibold text-fg">Register</Link>
        </p>
        <Link to="/" className="mt-6 block h-11 w-full bg-muted text-center text-sm font-semibold uppercase leading-[2.75rem] tracking-wide text-bg transition hover:opacity-85">
          Continue as guest
        </Link>
        <p className="mt-6 text-center text-[11px] leading-relaxed text-muted">
          By continuing, you agree to our{" "}
          <Link to="/terms" className="underline hover:text-fg">Terms of Service</Link>
          {" "}and{" "}
          <Link to="/privacy" className="underline hover:text-fg">Privacy Policy</Link>.
        </p>
      </AuthShell>
      <Footer />
    </>
  );
}