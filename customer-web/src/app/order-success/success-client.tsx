"use client";

import Link from "next/link";
import { Smartphone, CheckCircle2 } from "lucide-react";
import { buildRazorpayLink } from "../../lib/payment";

export default function OrderSuccessClient({ order, payAmount }: { order: string; payAmount?: string }) {
  if (!order) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Order not found</h1>
        <Link href="/" className="text-primary font-bold">Go home</Link>
      </div>
    );
  }

  const amount = Number(payAmount);
  const needsPayment = Number.isFinite(amount) && amount > 0;
  const payLink = buildRazorpayLink(amount);

  return (
    <div className="p-6 sm:p-10 text-center">
      <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <CheckCircle2 className="mx-auto text-green-600 mb-3" size={48} />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Order placed!</h1>
        <p className="text-gray-600 mb-2">Your order number is:</p>
        <p className="text-2xl font-black text-primary mb-6">{order}</p>

        {needsPayment && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-left">
            <p className="text-sm text-gray-700">Amount to pay</p>
            <p className="text-3xl font-black text-gray-900">₹{amount}</p>
            <p className="text-xs text-amber-700 bg-amber-100 rounded-lg px-2 py-1.5 my-3">
              On the Razorpay page, enter <span className="font-extrabold">₹{amount}</span> as the amount to pay.
            </p>
            <a
              href={payLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-green-600 hover:bg-green-700 transition text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-600/30"
            >
              <Smartphone size={20} /> Pay via UPI
            </a>
            <p className="text-[11px] text-gray-500 mt-2 text-center">
              Opens the secure Razorpay UPI page. After paying, your payment will be confirmed by our team.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Link href={`/track?order=${encodeURIComponent(order)}`} className="block bg-primary text-white py-3 rounded-xl font-bold">
            Track Order
          </Link>
          <Link href="/" className="block border border-gray-200 py-3 rounded-xl font-bold text-gray-800">
            Order More
          </Link>
        </div>
      </div>
    </div>
  );
}
