import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import AuthShell, { primaryButton } from "../components/AuthShell.jsx";
import Navbar from "../context/Navbar.jsx";
import Footer from "../components/Footer.jsx";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const { acceptSession } = useAuth();
  const navigate = useNavigate();
  const started = useRef(false); // the token works once, so only run one time
  const [state, setState] = useState({ status: "working", message: "" });

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    api("/auth/verify-email", { method: "POST", body: { token: params.get("token") || "" } })
      .then((res) => {
        const user = acceptSession(res);
        setState({ status: "ok", message: "" });
        setTimeout(() => navigate(user.role === "admin" ? "/admin" : "/", { replace: true }), 1500);
      })
      .catch((err) => setState({ status: "error", message: err.message }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Navbar />
      <AuthShell title="">
        <img src="/LE.png" alt="Leith Essence" className="mx-auto mb-6 h-16 w-16 object-contain sm:h-20 sm:w-20" />
        {state.status === "working" && (
          <p role="status" className="text-center text-sm">Confirming your email…</p>
        )}
        {state.status === "ok" && (
          <>
            <h1 className="text-center text-lg font-semibold text-fg">Email confirmed</h1>
            <p role="status" className="mt-3 text-center text-sm">You're signed in. Taking you to the shop…</p>
            <Link to="/" className={`${primaryButton} mt-6 block text-center leading-[2.75rem]`}>Continue</Link>
          </>
        )}
        {state.status === "error" && (
          <>
            <h1 className="text-center text-lg font-semibold text-fg">We couldn't confirm your email</h1>
            <p role="alert" className="mt-3 text-center text-sm text-danger">{state.message}</p>
            <Link to="/login" className={`${primaryButton} mt-6 block text-center leading-[2.75rem]`}>Go to login</Link>
          </>
        )}
      </AuthShell>
      <Footer />
    </>
  );
}