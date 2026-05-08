"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

type DeliveryOrder = any;

export default function DeliveryPanel() {
  const [token, setToken] = useState<string>("");
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [email, setEmail] = useState("boy1@igatpurieats.com");
  const [password, setPassword] = useState("boy123");
  const [error, setError] = useState<string | null>(null);

  async function login(e: any) {
    e.preventDefault();
    setError(null);
    try {
      const res = await apiFetch<any>("/auth/login/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (res.user?.role !== "DELIVERY_BOY") throw new Error("Not a delivery account");
      setToken(res.tokens.access);
      localStorage.setItem("igatpuri_delivery_token", res.tokens.access);
    } catch (e: any) {
      setError(e?.message || "Login failed");
    }
  }

  async function loadOrders(tok: string) {
    try {
      const data = await apiFetch<any[]>("/delivery/orders/", { authToken: tok });
      setOrders(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load orders");
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem("igatpuri_delivery_token") || "";
    if (saved) {
      setToken(saved);
      loadOrders(saved);
    }
  }, []);

  useEffect(() => {
    if (token) loadOrders(token);
  }, [token]);

  async function patch(id: number, action: "status" | "payment-collected", payload: any) {
    const data = await apiFetch<any>(`/delivery/orders/${id}/${action}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      authToken: token,
    });
    setOrders((prev) => prev.map((o) => (o.id === id ? data : o)));
  }

  if (!token) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <form onSubmit={login} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">Delivery Login</h1>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          <div className="space-y-3 mt-4">
            <input className="w-full p-3 border rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input className="w-full p-3 border rounded-xl" value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" />
            <button className="w-full bg-primary text-white py-3 rounded-xl font-bold">Login</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Assigned Orders</h1>
          <button
            onClick={() => {
              localStorage.removeItem("igatpuri_delivery_token");
              setToken("");
              setOrders([]);
            }}
            className="text-sm font-bold text-red-600"
          >
            Logout
          </button>
        </div>

        {orders.map((o) => (
          <div key={o.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="font-bold text-gray-800">{o.order_number}</p>
            <p className="text-sm text-gray-600">{o.restaurant_name}</p>
            <p className="text-sm text-gray-600 mt-2">{o.customer_name} • <a href={`tel:${o.customer_phone}`} className="text-primary font-bold">{o.customer_phone}</a></p>
            <p className="text-sm text-gray-600">{o.customer_address}</p>
            {o.customer_latitude && o.customer_longitude && (
              <a
                className="text-primary text-sm font-bold"
                target="_blank"
                rel="noreferrer"
                href={`https://www.google.com/maps?q=${o.customer_latitude},${o.customer_longitude}`}
              >
                Open Maps
              </a>
            )}
            <p className="text-xs text-gray-500 mt-2">Status: {o.order_status}</p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {["REACHED_RESTAURANT", "PICKED_UP", "ON_THE_WAY", "DELIVERED"].map((st) => (
                <button key={st} onClick={() => patch(o.id, "status", { order_status: st })} className="py-2 rounded-lg border border-gray-200 text-xs font-bold">
                  {st.replaceAll("_", " ")}
                </button>
              ))}
            </div>
            {(o.payment_method === "COD" || o.payment_method === "UPI_ON_DELIVERY") && (
              <button
                onClick={() => patch(o.id, "payment-collected", {})}
                className="w-full mt-3 bg-green-600 text-white py-2 rounded-lg font-bold"
              >
                Mark Payment Collected
              </button>
            )}
          </div>
        ))}

        {orders.length === 0 && <p className="text-center text-gray-500 py-10">No assigned orders</p>}
      </div>
    </div>
  );
}

