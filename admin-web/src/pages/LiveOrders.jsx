import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "preparing", label: "Preparing" },
  { id: "assigned", label: "Assigned" },
  { id: "on_the_way", label: "On the way" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

function matchesFilter(order, filter) {
  if (filter === "all") return true;
  const st = order.order_status;
  if (filter === "new") return ["PLACED", "ADMIN_REVIEWING"].includes(st);
  if (filter === "preparing") return ["CONFIRMED_WITH_RESTAURANT", "PREPARING"].includes(st);
  if (filter === "assigned") return ["DELIVERY_ASSIGNED", "REACHED_RESTAURANT", "PICKED_UP"].includes(st);
  if (filter === "on_the_way") return ["ON_THE_WAY"].includes(st);
  if (filter === "delivered") return ["DELIVERED"].includes(st);
  if (filter === "cancelled") return ["CANCELLED"].includes(st);
  return true;
}

export default function LiveOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [popup, setPopup] = useState(null);

  function playNewOrderSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.26);
    } catch {
      // Avoid blocking UI if sound API is unavailable.
    }
  }

  async function load(showLoader = true) {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const [o, boys] = await Promise.all([api.get("/admin/orders/"), api.get("/admin/delivery-boys/")]);
      const prevTopId = orders[0]?.id;
      const nextTopId = o.data?.[0]?.id;
      if (!showLoader && prevTopId && nextTopId && prevTopId !== nextTopId) {
        const prevIds = new Set(orders.map((x) => x.id));
        const added = o.data.filter((x) => !prevIds.has(x.id)).length;
        if (added > 0) {
          setNewOrdersCount((c) => c + added);
          setPopup(`${added} new order${added > 1 ? "s" : ""} received`);
          playNewOrderSound();
          window.setTimeout(() => setPopup(null), 4500);
        }
      }
      setOrders(o.data);
      setDeliveryBoys(boys.data);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message);
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(() => load(false), 7000);
    return () => window.clearInterval(timer);
  }, []);

  const filtered = useMemo(() => orders.filter((o) => matchesFilter(o, filter)), [orders, filter]);

  async function patch(id, url, payload) {
    const res = await api.patch(`/admin/orders/${id}/${url}/`, payload);
    setOrders((prev) => prev.map((o) => (o.id === id ? res.data : o)));
    setSelected(res.data);
  }

  return (
    <div>
      {popup && (
        <div className="fixed top-6 right-6 z-[60] bg-red-600 text-white px-4 py-3 rounded-xl shadow-xl font-bold text-sm">
          {popup}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-2 rounded-lg text-sm font-bold border ${
              filter === f.id ? "bg-accent text-white border-accent" : "bg-white border-gray-200 text-gray-700"
            }`}
          >
            {f.label}
          </button>
        ))}
        <button onClick={load} className="ml-auto px-3 py-2 rounded-lg text-sm font-bold bg-white border border-gray-200">
          Refresh
        </button>
      </div>

      {newOrdersCount > 0 && (
        <div className="mb-4 bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm font-bold flex items-center justify-between">
          <span>{newOrdersCount} new order{newOrdersCount > 1 ? "s" : ""} received.</span>
          <button onClick={() => setNewOrdersCount(0)} className="text-red-700 underline">Mark seen</button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading orders...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Restaurant</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">{o.order_number || o.id}</td>
                    <td className="px-6 py-4 text-gray-600">{o.customer_name}</td>
                    <td className="px-6 py-4 text-gray-600">{o.restaurant_name || o.restaurant}</td>
                    <td className="px-6 py-4 font-medium">₹{o.final_total}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(o.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-bold">{o.order_status}</td>
                    <td className="px-6 py-4 text-sm font-bold">{o.payment_status}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => setSelected(o)} className="text-accent hover:text-red-700 font-medium text-sm">
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No orders
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Order</p>
                <p className="text-lg font-bold">{selected.order_number}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-600 font-bold">
                Close
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 text-sm">
                <p className="font-bold text-gray-800">Customer</p>
                <a className="text-accent font-bold" href={`tel:${selected.customer_phone}`}>{selected.customer_phone}</a>
                <p className="text-gray-600">{selected.customer_name}</p>
                <p className="text-gray-600">{selected.customer_address}</p>
                {selected.customer_landmark && <p className="text-gray-600">Landmark: {selected.customer_landmark}</p>}
                {selected.customer_latitude && selected.customer_longitude && (
                  <a
                    className="text-primary font-bold"
                    target="_blank"
                    rel="noreferrer"
                    href={`https://www.google.com/maps?q=${selected.customer_latitude},${selected.customer_longitude}`}
                  >
                    Open in Google Maps
                  </a>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-bold text-gray-800">Payment + Status</p>
                <p className="text-gray-700"><span className="font-semibold">Method:</span> {selected.payment_method}</p>
                <p className="text-gray-700"><span className="font-semibold">Payment:</span> {selected.payment_status}</p>
                <p className="text-gray-700"><span className="font-semibold">Order:</span> {selected.order_status}</p>
                <p className="text-gray-700"><span className="font-semibold">Created:</span> {new Date(selected.created_at).toLocaleString()}</p>
                <p className="text-gray-700"><span className="font-semibold">Updated:</span> {new Date(selected.updated_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="px-6 pb-2">
              <p className="font-bold text-gray-800 mb-2">Ordered Items</p>
              <div className="bg-gray-50 border border-gray-100 rounded-xl divide-y divide-gray-100">
                {(selected.items || []).map((it) => (
                  <div key={it.id} className="px-4 py-3 flex justify-between text-sm">
                    <span className="text-gray-700">{it.item_name_snapshot} x {it.quantity}</span>
                    <span className="font-bold text-gray-800">₹{it.total_price}</span>
                  </div>
                ))}
                {(selected.items || []).length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-500">No items available</div>
                )}
              </div>
            </div>

            <div className="px-6 pb-4">
              <div className="space-y-2 text-sm">
                <p className="font-bold text-gray-800">Charges</p>
                <div className="grid grid-cols-2 gap-2">
                  {["delivery_charge", "platform_charge", "rain_rush_charge", "peak_hour_charge", "distance_charge"].map((f) => (
                    <div key={f} className="text-gray-700">
                      <p className="text-xs text-gray-500">{f.replaceAll("_", " ")}</p>
                      <input
                        className="w-full p-2 border rounded-lg"
                        defaultValue={selected[f]}
                        onBlur={(e) => patch(selected.id, "charges", { [f]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-gray-700"><span className="font-semibold">Food Total:</span> ₹{selected.food_total}</p>
                <p className="font-bold text-gray-800 mt-2">Final: ₹{selected.final_total}</p>
              </div>
            </div>
            <div className="p-6 border-t flex flex-col md:flex-row gap-3">
              <select
                className="p-3 border rounded-xl flex-1"
                defaultValue={selected.assigned_delivery_boy || ""}
                onChange={(e) => patch(selected.id, "assign-delivery-boy", { delivery_boy_id: e.target.value })}
              >
                <option value="">Assign delivery boy</option>
                {deliveryBoys.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name || b.username} ({b.phone || "no phone"})
                  </option>
                ))}
              </select>
              <select
                className="p-3 border rounded-xl flex-1"
                defaultValue={selected.order_status}
                onChange={(e) => patch(selected.id, "status", { order_status: e.target.value })}
              >
                {[
                  "PLACED",
                  "ADMIN_REVIEWING",
                  "CONFIRMED_WITH_RESTAURANT",
                  "PREPARING",
                  "DELIVERY_ASSIGNED",
                  "REACHED_RESTAURANT",
                  "PICKED_UP",
                  "ON_THE_WAY",
                  "DELIVERED",
                  "CANCELLED",
                ].map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

