"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem } from "../lib/cart";
import { loadCart, saveCart } from "../lib/cart";

type CartContextValue = {
  items: CartItem[];
  count: number;
  restaurantId: number | null;
  addItem: (item: Omit<CartItem, "quantity">) => { replacedRestaurant: boolean };
  setQty: (itemId: number, qty: number) => void;
  removeItem: (itemId: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(loadCart());
  }, []);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, it) => s + it.quantity, 0);
    const restaurantId = items.length ? items[0].restaurantId : null;

    return {
      items,
      count,
      restaurantId,
      addItem: (item) => {
        const incomingRestaurant = item.restaurantId;
        const currentRestaurant = restaurantId;
        let replacedRestaurant = false;

        setItems((prev) => {
          let base = prev;
          if (currentRestaurant && currentRestaurant !== incomingRestaurant) {
            replacedRestaurant = true;
            base = [];
          }
          const existing = base.find((x) => x.id === item.id);
          if (existing) {
            return base.map((x) => (x.id === item.id ? { ...x, quantity: x.quantity + 1 } : x));
          }
          return [...base, { ...item, quantity: 1 }];
        });

        return { replacedRestaurant };
      },
      setQty: (itemId, qty) => {
        setItems((prev) =>
          prev
            .map((x) => (x.id === itemId ? { ...x, quantity: Math.max(1, qty) } : x))
            .filter((x) => x.quantity > 0)
        );
      },
      removeItem: (itemId) => setItems((prev) => prev.filter((x) => x.id !== itemId)),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

