"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

export default function TrackClient({ initialOrder }: { initialOrder: string }) {
  const [orderNumber, setOrderNumber] = useState(initialOrder);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function track(ord: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiFetch<any>(`/orders/${encodeURIComponent(ord)}/track/`);
      setResult(data);
    } catch (e: any) {
      setError(e?.message || "Unable to track order");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialOrder) track(initialOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 mt-6 max-w-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Track Order</h1>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-3">
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="Enter order number (e.g. IE-2026...)"
            className="w-full p-3 border rounded-xl"
          />
          <button
            onClick={() => track(orderNumber.trim())}
            disabled={loading || !orderNumber.trim()}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold disabled:opacity-50"
          >
            {loading ? "Tracking..." : "Track"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {result && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-6">
            <h2 className="font-bold text-gray-800 mb-2">{result.order_number}</h2>
            <p className="text-sm text-gray-600 mb-4">{result.restaurant?.name}</p>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between"><span>Status</span><span className="font-bold">{result.order_status}</span></div>
              <div className="flex justify-between"><span>Payment</span><span className="font-bold">{result.payment_status}</span></div>
              <div className="flex justify-between"><span>Total</span><span className="font-bold">₹{result.final_total}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

