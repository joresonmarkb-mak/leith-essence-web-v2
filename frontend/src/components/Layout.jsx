import { Outlet } from "react-router-dom";
import Navbar from "../context/Navbar.jsx";
import Footer from "../context/Footer.jsx";

export default function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}