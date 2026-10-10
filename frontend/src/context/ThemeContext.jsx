import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // index.html already picked the starting theme (saved choice, else the device setting)
  const [theme, setTheme] = useState(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light"
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try { localStorage.setItem("theme", next); } catch { /* ignore */ }
  };

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);