"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, LocateFixed } from 'lucide-react';
import { apiFetch } from "../../lib/api";
import { useCart } from "../../context/CartContext";

export default function Checkout() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '', phone: '', address: '', landmark: ''
  });
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'UPI_ON_DELIVERY'>('COD');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { items: cart, clear } = useCart();

  useEffect(() => {
    // cart is loaded from localStorage via CartProvider
  }, []);

  const foodTotal = cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError(null);
    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setError("Name, phone and address are required.");
      return;
    }
    if (cart.length === 0) {
      setError("Cart cannot be empty.");
      return;
    }
    setLoading(true);

    const orderData = {
      customer_name: formData.name,
      customer_phone: formData.phone,
      customer_address: formData.address,
      customer_landmark: formData.landmark,
      customer_latitude: coords.lat,
      customer_longitude: coords.lng,
      restaurant: cart[0]?.restaurantId,
      payment_method: paymentMethod,
      items: cart.map(item => ({ menu_item: item.id, quantity: item.quantity }))
    };

    try {
      const placed = await apiFetch<any>("/orders/", { method: "POST", body: JSON.stringify(orderData) });
      clear();
      router.push(`/order-success?order=${encodeURIComponent(placed.order_number)}`);
    } catch (err: any) {
      setError(err?.message || "Error placing order.");
    }
    setLoading(false);
  };

  const useMyLocation = () => {
    setLocating(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device.");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("Could not fetch your location. Please enter address manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (cart.length === 0) return <div className="p-10 text-center">Cart is empty!</div>;

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="bg-white p-4 flex items-center gap-4 shadow-sm">
        <button onClick={() => router.back()}><ArrowLeft /></button>
        <h1 className="text-xl font-bold">Checkout</h1>
      </div>

      <div className="container mx-auto px-4 mt-6 max-w-lg">
        {/* Bill Summary */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h2 className="font-bold text-gray-800 mb-4 border-b pb-2">Bill Summary</h2>
          {cart.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{item.quantity}x {item.name}</span>
              <span>₹{Number(item.price) * Number(item.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-dashed mt-4 pt-4 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between"><span>Food Total</span><span>₹{foodTotal}</span></div>
            <p className="text-xs text-gray-500">Final charges (delivery/platform/rain/distance) are calculated by backend after you place the order.</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-bold text-gray-800 mb-2 border-b pb-2">Delivery Details</h2>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <input required type="text" placeholder="Full Name" className="w-full p-3 border rounded-xl"
            onChange={e => setFormData({...formData, name: e.target.value})} />
          <input required type="tel" placeholder="Phone Number" className="w-full p-3 border rounded-xl"
            onChange={e => setFormData({...formData, phone: e.target.value})} />
          <textarea required placeholder="Complete Address" className="w-full p-3 border rounded-xl"
            onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
          <input type="text" placeholder="Landmark" className="w-full p-3 border rounded-xl"
            onChange={e => setFormData({...formData, landmark: e.target.value})} />

          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="w-full border border-gray-200 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <LocateFixed size={18} />
            {locating ? "Getting Location..." : "Use My Current Location"}
          </button>
          {(coords.lat && coords.lng) && (
            <p className="text-xs text-gray-600 flex items-center gap-1"><MapPin size={14} /> Location saved</p>
          )}

          <div className="space-y-2">
            <p className="text-sm font-bold text-gray-800">Payment Method</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("COD")}
                className={`flex-1 py-3 rounded-xl border font-bold ${paymentMethod === "COD" ? "bg-primary text-white border-primary" : "bg-white border-gray-200 text-gray-800"}`}
              >
                Cash on Delivery
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("UPI_ON_DELIVERY")}
                className={`flex-1 py-3 rounded-xl border font-bold ${paymentMethod === "UPI_ON_DELIVERY" ? "bg-primary text-white border-primary" : "bg-white border-gray-200 text-gray-800"}`}
              >
                UPI on Delivery
              </button>
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg mt-4 disabled:opacity-50">
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>
        </form>
      </div>
    </div>
  );
}
