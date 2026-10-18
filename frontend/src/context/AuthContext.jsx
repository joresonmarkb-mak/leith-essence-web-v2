import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  // On page load, ask the server who the saved token belongs to
  useEffect(() => {
    if (!getToken()) return;
    api("/auth/me")
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  const startSession = ({ token, user }) => {
    setToken(token);
    setUser(user);
    return user;
  };

  const login = async (email, password) =>
    startSession(await api("/auth/login", { method: "POST", body: { email, password } }));

  // Registering no longer logs you in; the email must be confirmed first
  const register = (fields) => api("/auth/register", { method: "POST", body: fields });

  const loginWithGoogle = async (credential) =>
    startSession(await api("/auth/google", { method: "POST", body: { credential } }));

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => setUser(await api("/auth/me"));

  return (
   <AuthContext.Provider
      value={{ user, loading, login, register, loginWithGoogle, acceptSession: startSession, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);