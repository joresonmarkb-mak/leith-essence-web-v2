import { Route, Routes } from "react-router-dom";
import RequireAuth from "./components/RequireAuth.jsx";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import AdminHome from "./pages/AdminHome.jsx";
import PerfumeDetail from "./pages/PerfumeDetail.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import OrderPlaced from "./pages/OrderPlaced.jsx";
import Account from "./pages/Account.jsx";
import Quiz from "./pages/Quiz.jsx";
import About from "./pages/About.jsx";

const NotFound = () => <p className="p-10 text-center text-muted">Page not found.</p>;

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin" element={<RequireAuth role="admin"><AdminHome /></RequireAuth>} />
      <Route path="/perfume/:id" element={<PerfumeDetail />} />
      <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
      <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
      <Route path="/order-placed" element={<RequireAuth><OrderPlaced /></RequireAuth>} />
      <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
      <Route path="/quiz" element={<RequireAuth><Quiz /></RequireAuth>} />
      <Route path="/about" element={<About />} />
    </Routes>
  );
}