"use client";

import Link from "next/link";

export default function OrderSuccessClient({ order }: { order: string }) {
  if (!order) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Order not found</h1>
        <Link href="/" className="text-primary font-bold">Go home</Link>
      </div>
    );
  }

  return (
    <div className="p-10 text-center">
      <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Order placed!</h1>
        <p className="text-gray-600 mb-6">Your order number is:</p>
        <p className="text-2xl font-black text-primary mb-6">{order}</p>
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

