"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { apiFetch } from "../../lib/api";

type PricingConfig = {
  base_delivery_charge: number;
  platform_charge: number;
  rain_rush_charge: number;
  peak_hour_charge: number;
  is_rain_mode_enabled: boolean;
  is_peak_mode_enabled: boolean;
};

const toNum = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export default function CartPage() {
  const { items, setQty, removeItem, count } = useCart();
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);

  const foodTotal = useMemo(
    () => items.reduce((s, it) => s + Number(it.price) * it.quantity, 0),
    [items]
  );

  async function loadPricing() {
    try {
      setPricingError(null);
      const cfg = await apiFetch<PricingConfig>("/orders/pricing-config/");
      setPricing(cfg);
    } catch (e: any) {
      setPricingError(e?.message || "Failed to load pricing");
      setPricing(null);
    }
  }

  useEffect(() => {
    loadPricing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deliveryCharge = toNum(pricing?.base_delivery_charge, 50);
  const platformCharge = toNum(pricing?.platform_charge, 10);
  const rainRushCharge = pricing?.is_rain_mode_enabled ? toNum(pricing?.rain_rush_charge, 30) : 0;
  const peakCharge = pricing?.is_peak_mode_enabled ? toNum(pricing?.peak_hour_charge, 20) : 0;
  const distanceCharge = 0;
  const finalTotal = toNum(foodTotal) + deliveryCharge + platformCharge + rainRushCharge + peakCharge + distanceCharge;

  if (items.length === 0) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h1>
        <p className="text-gray-600 mb-6">Add some items from a dhaba to place an order.</p>
        <Link href="/" className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow">
          Browse Restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 mt-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Cart</h1>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {items.map((it) => (
              <div key={it.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-gray-800 truncate">{it.name}</p>
                  <p className="text-sm text-gray-500">₹{it.price} each</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQty(it.id, it.quantity - 1)}
                    className="h-9 w-9 rounded-lg border border-gray-200 flex items-center justify-center"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="w-6 text-center font-bold">{it.quantity}</span>
                  <button
                    onClick={() => setQty(it.id, it.quantity + 1)}
                    className="h-9 w-9 rounded-lg border border-gray-200 flex items-center justify-center"
                    aria-label="Increase quantity"
                  >
                    <Plus size={18} />
                  </button>
                  <button
                    onClick={() => removeItem(it.id)}
                    className="h-9 w-9 rounded-lg border border-gray-200 flex items-center justify-center text-red-600"
                    aria-label="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-6">
          <h2 className="font-bold text-gray-800 mb-4 border-b pb-2">Price Breakdown</h2>
          {pricingError && <p className="text-sm text-orange-600 mb-2">{pricingError}</p>}
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between"><span>Food Total</span><span>₹{foodTotal.toFixed(0)}</span></div>
            <div className="flex justify-between"><span>Delivery Charge</span><span>₹{deliveryCharge.toFixed(0)}</span></div>
            <div className="flex justify-between"><span>Platform Charge</span><span>₹{platformCharge.toFixed(0)}</span></div>
            <div className="flex justify-between"><span>Rain Rush Charge</span><span>₹{rainRushCharge.toFixed(0)}</span></div>
            <div className="flex justify-between"><span>Peak Hour Charge</span><span>₹{peakCharge.toFixed(0)}</span></div>
            <div className="flex justify-between"><span>Distance Charge</span><span>₹{distanceCharge.toFixed(0)}</span></div>
          </div>
          <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t text-gray-800">
            <span>To Pay</span>
            <span>₹{finalTotal.toFixed(0)}</span>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-50">
          <div className="container mx-auto max-w-2xl">
            <Link
              href="/checkout"
              className="w-full block bg-green-600 text-white py-3 rounded-xl font-bold text-center shadow-lg"
            >
              Continue to Checkout ({count} items)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

