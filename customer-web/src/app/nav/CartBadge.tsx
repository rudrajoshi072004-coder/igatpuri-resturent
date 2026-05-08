"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "../../context/CartContext";

export default function CartBadge() {
  const { count } = useCart();
  return (
    <span className="flex items-center gap-2">
      <ShoppingCart size={18} />
      <span>Cart</span>
      <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">{count}</span>
    </span>
  );
}

