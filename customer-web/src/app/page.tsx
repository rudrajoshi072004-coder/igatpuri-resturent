"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Clock, MapPin, Search } from "lucide-react";
import { apiFetch } from "../lib/api";

type Restaurant = {
  id: number;
  name: string;
  address?: string;
  is_featured?: boolean;
  average_preparation_time?: number;
};

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(q?: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Restaurant[]>(`/restaurants/${q ? `?search=${encodeURIComponent(q)}` : ""}`);
      setRestaurants(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load restaurants");
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const canSearch = search.trim().length > 0;

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="bg-primary text-white py-12 px-4 rounded-b-3xl shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000')] bg-cover bg-center"></div>
        <div className="relative z-10 container mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-md">Hungry in Igatpuri?</h2>
          <p className="text-lg md:text-xl mb-6 opacity-90">Order from the best local dhabas without stepping out in the rain.</p>
          
          <div className="bg-white rounded-full flex items-center p-2 max-w-md mx-auto shadow-xl">
            <Search className="text-gray-400 ml-2" />
            <input 
              type="text" 
              placeholder="Search for restaurants or dishes..." 
              className="flex-1 bg-transparent border-none outline-none px-4 text-gray-800"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              onClick={() => load(search.trim())}
              className="bg-primary text-white rounded-full px-6 py-2 font-medium disabled:opacity-50"
              disabled={!canSearch}
            >
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="container mx-auto px-4 mt-10">
        <div className="flex justify-between items-end mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Popular Dhabas</h3>
          <a href="#" className="text-primary font-medium">View All</a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <p className="text-gray-500 col-span-4 text-center py-10">Loading restaurants...</p>
          ) : error ? (
            <p className="text-red-600 col-span-4 text-center py-10">{error}</p>
          ) : restaurants.length > 0 ? restaurants.map((r: any) => (
            <Link href={`/restaurant/${r.id}`} key={r.id}>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition cursor-pointer">
                <div className="h-40 bg-gray-200 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=500')] bg-cover bg-center"></div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h4 className="text-lg font-bold text-gray-800">{r.name}</h4>
                    {r.is_featured && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-bold">Featured</span>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-2 gap-4">
                    <span className="flex items-center gap-1"><Clock size={14} /> {r.average_preparation_time} min</span>
                    <span className="flex items-center gap-1"><MapPin size={14} /> {r.address || 'Igatpuri'}</span>
                  </div>
                </div>
              </div>
            </Link>
          )) : (
            <p className="text-gray-500 col-span-4 text-center py-10">No restaurants found. Please seed the database!</p>
          )}
        </div>
      </section>

      {/* Rainy Season Banner */}
      <section className="container mx-auto px-4 mt-10">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">Rainy Season Special! 🌧️</h3>
            <p className="opacity-90 max-w-md">Craving hot Pakodas and cutting Chai? We deliver right to your hotel or homestay.</p>
          </div>
          <button className="mt-4 md:mt-0 bg-white text-indigo-600 font-bold py-3 px-6 rounded-xl shadow-md hover:bg-gray-50 transition">
            Order Hot Snacks Now
          </button>
        </div>
      </section>
    </div>
  )
}
