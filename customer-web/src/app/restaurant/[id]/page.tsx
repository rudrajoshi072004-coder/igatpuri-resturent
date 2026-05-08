"use client"
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Clock, ArrowLeft, ShoppingCart } from 'lucide-react';
import { apiFetch } from "../../../lib/api";
import { useCart } from "../../../context/CartContext";

export default function RestaurantDetail() {
  const params = useParams();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { items: cartItems, addItem, count } = useCart();

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<any>(`/restaurants/${params.id}/menu/`);
        setRestaurant(data.restaurant);
        setMenuItems(data.items || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load menu");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  const addToCart = (item: any) => {
    const result = addItem({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      is_veg: item.is_veg,
      restaurantId: restaurant.id,
    });
    if (result.replacedRestaurant) {
      // Keep UI simple: replacing cart if user switches restaurants.
      alert("Cart was cleared because you switched restaurants.");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (error) return <div className="p-10 text-center text-red-600">{error}</div>;
  if (!restaurant) return <div className="p-10 text-center">Restaurant not found.</div>;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-primary text-white p-6 rounded-b-3xl shadow-md">
        <button onClick={() => router.back()} className="flex items-center gap-2 mb-4">
          <ArrowLeft size={20} /> Back
        </button>
        <h1 className="text-3xl font-bold">{restaurant.name}</h1>
        <div className="flex gap-4 mt-2 opacity-90 text-sm">
          <span className="flex items-center gap-1"><Clock size={16} /> {restaurant.average_preparation_time} min</span>
          <span className="flex items-center gap-1"><MapPin size={16} /> {restaurant.address}</span>
        </div>
      </div>

      {/* Menu List */}
      <div className="container mx-auto px-4 mt-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Menu</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full border-2 p-0.5 flex items-center justify-center ${item.is_veg ? 'border-green-600' : 'border-red-600'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></span>
                  </span>
                  <h3 className="font-bold text-gray-800">{item.name}</h3>
                </div>
                <p className="font-bold text-gray-600 mt-1">₹{item.price}</p>
              </div>
              <button 
                onClick={() => addToCart(item)}
                disabled={!item.is_available}
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-red-600 transition"
              >
                {item.is_available ? "ADD" : "UNAVAILABLE"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Cart Button */}
      {count > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-50">
          <div className="container mx-auto">
            <button 
              onClick={() => router.push('/cart')}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold flex justify-between items-center px-6 shadow-lg"
            >
              <span>{count} Item(s)</span>
              <span className="flex items-center gap-2">View Cart <ShoppingCart size={20} /></span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
