import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle.jsx";

export default function AdminHome() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <ThemeToggle />
      </div>
      <p className="mt-4 text-muted">The dashboard gets built here later.</p>
      <Link to="/" className="mt-6 inline-block text-accent">Back to the shop</Link>
    </main>
  );
}