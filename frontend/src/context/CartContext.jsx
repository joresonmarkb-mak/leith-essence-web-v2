import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let ignore = false;
    api("/cart")
      .then((cart) => { if (!ignore) setCount(cart.count); })
      .catch(() => {});
    return () => { ignore = true; };
  }, [user]);

  const addItem = async (perfumeId, sizeMl, quantity = 1) => {
    const cart = await api("/cart", { method: "POST", body: { perfumeId, sizeMl, quantity } });
    setCount(cart.count);
    return cart;
  };

  return (
    <CartContext.Provider value={{ count: user ? count : 0, setCount, addItem }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);