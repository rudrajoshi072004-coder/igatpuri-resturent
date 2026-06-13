"use client"
import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Clock, ArrowLeft, ShoppingCart, Search, Phone, Plus, Minus, Star, UtensilsCrossed } from 'lucide-react';
import { apiFetch } from "../../../lib/api";
import { useCart } from "../../../context/CartContext";
import { resolveDishImage, getFallbackGradient } from "../../../lib/foodImages";

type MenuItem = {
  id: number;
  name: string;
  description?: string;
  price: string | number;
  is_veg: boolean;
  is_available: boolean;
  category?: number;
  image?: string | null;
};

type Category = { id: number; name: string; items: MenuItem[] };

type VegFilter = "all" | "veg" | "nonveg";

function DishImage({ name, image }: { name: string; image?: string | null }) {
  const src = useMemo(() => resolveDishImage(image), [image]);
  const gradient = useMemo(() => getFallbackGradient(name), [name]);
  const [failed, setFailed] = useState(false);

  const showImage = src && !failed;

  return (
    <div className="relative h-[100px] w-[100px] flex-shrink-0 rounded-2xl overflow-hidden shadow-sm ring-1 ring-black/5">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src as string}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className="h-full w-full flex flex-col items-center justify-center gap-1 text-white/90"
          style={{ background: gradient }}
        >
          <UtensilsCrossed size={26} strokeWidth={1.75} className="drop-shadow" />
          <span className="text-[9px] font-bold uppercase tracking-wide text-white/80">
            {name.split(" ")[0].slice(0, 10)}
          </span>
        </div>
      )}
    </div>
  );
}

function VegBadge({ isVeg }: { isVeg: boolean }) {
  const color = isVeg ? "border-green-600" : "border-red-600";
  const dot = isVeg ? "bg-green-600" : "bg-red-600";
  return (
    <span className={`h-4 w-4 rounded-sm border-2 ${color} flex items-center justify-center`}>
      <span className={`h-2 w-2 rounded-full ${dot}`}></span>
    </span>
  );
}

export default function RestaurantDetail() {
  const params = useParams();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [vegFilter, setVegFilter] = useState<VegFilter>("all");
  const [activeCat, setActiveCat] = useState<number | null>(null);

  const { items: cartItems, addItem, setQty, count } = useCart();
  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<any>(`/restaurants/${params.id}/menu/`);
        setRestaurant(data.restaurant);
        const cats: Category[] = (data.categories || []).filter((c: Category) => c.items?.length);
        setCategories(cats);
        if (cats.length) setActiveCat(cats[0].id);
      } catch (e: any) {
        setError(e?.message || "Failed to load menu");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  const qtyOf = (id: number) => cartItems.find((c) => c.id === id)?.quantity || 0;

  const addToCart = (item: MenuItem) => {
    const result = addItem({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      is_veg: item.is_veg,
      restaurantId: restaurant.id,
    });
    if (result.replacedRestaurant) {
      alert("Cart was cleared because you switched restaurants.");
    }
  };

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((it) => {
          if (vegFilter === "veg" && !it.is_veg) return false;
          if (vegFilter === "nonveg" && it.is_veg) return false;
          if (q && !it.name.toLowerCase().includes(q) && !(it.description || "").toLowerCase().includes(q)) return false;
          return true;
        }),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [categories, search, vegFilter]);

  const totalItems = useMemo(
    () => categories.reduce((s, c) => s + c.items.length, 0),
    [categories]
  );

  const scrollToCat = (id: number) => {
    setActiveCat(id);
    const el = sectionRefs.current[id];
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 140;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500 animate-pulse">Loading menu…</div>
    );
  }
  if (error) return <div className="p-10 text-center text-red-600">{error}</div>;
  if (!restaurant) return <div className="p-10 text-center">Restaurant not found.</div>;

  return (
    <div className="pb-28 bg-gray-50 min-h-screen">
      {/* Hero header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=70')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-br from-dark/90 via-dark/80 to-primary/80" />
        <div className="relative z-10 px-5 pt-5 pb-8 text-white">
          <button onClick={() => router.back()} className="flex items-center gap-2 mb-5 text-white/90 hover:text-white text-sm font-medium">
            <ArrowLeft size={18} /> Back
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-yellow-400 text-yellow-900 text-[11px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wide">Veg & Non-Veg</span>
            {restaurant.is_featured && (
              <span className="bg-white/20 backdrop-blur text-white text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <Star size={11} fill="currentColor" /> Featured
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold drop-shadow-sm">{restaurant.name}</h1>
          {restaurant.description && (
            <p className="mt-1 text-white/85 text-sm max-w-xl">{restaurant.description}</p>
          )}
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-white/85 text-sm">
            <span className="flex items-center gap-1.5"><Clock size={15} /> {restaurant.average_preparation_time} min</span>
            {restaurant.phone && <span className="flex items-center gap-1.5"><Phone size={15} /> {restaurant.phone}</span>}
            <span className="flex items-center gap-1.5"><MapPin size={15} /> {restaurant.address}</span>
          </div>
          <div className="mt-3 text-white/70 text-xs font-medium">{totalItems} dishes across {categories.length} categories</div>
        </div>
      </div>

      {/* Sticky controls: search + filters + category chips */}
      <div className="sticky top-[60px] z-40 bg-gray-50/95 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-white rounded-xl border border-gray-200 px-3 shadow-sm">
              <Search size={18} className="text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dishes…"
                className="flex-1 px-2 py-2.5 bg-transparent outline-none text-sm text-gray-800"
              />
            </div>
            <div className="flex bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
              {([
                ["all", "All"],
                ["veg", "Veg"],
                ["nonveg", "Non-Veg"],
              ] as [VegFilter, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setVegFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    vegFilter === key
                      ? key === "veg"
                        ? "bg-green-600 text-white"
                        : key === "nonveg"
                        ? "bg-red-600 text-white"
                        : "bg-dark text-white"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar -mx-1 px-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCat(cat.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
                  activeCat === cat.id
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-600 border-gray-200 hover:border-primary/40"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu sections */}
      <div className="max-w-3xl mx-auto px-4 mt-6 space-y-8">
        {filteredCategories.length === 0 ? (
          <p className="text-center text-gray-500 py-16">No dishes match your search.</p>
        ) : (
          filteredCategories.map((cat) => (
            <section
              key={cat.id}
              ref={(el) => { sectionRefs.current[cat.id] = el; }}
            >
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-extrabold text-gray-800">{cat.name}</h2>
                <span className="text-xs font-semibold text-gray-400">{cat.items.length}</span>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cat.items.map((item) => {
                  const qty = qtyOf(item.id);
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition flex items-stretch justify-between gap-4 p-4 h-full"
                    >
                      {/* Text column */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-start gap-2">
                          <span className="mt-1 shrink-0"><VegBadge isVeg={item.is_veg} /></span>
                          <h3 className="font-bold text-gray-800 text-[15px] leading-snug break-words">{item.name}</h3>
                        </div>
                        <p className="text-primary font-extrabold text-[15px] mt-1.5">₹{Number(item.price)}</p>
                        {item.description && (
                          <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">{item.description}</p>
                        )}
                      </div>

                      {/* Image with floating action badge centered on its bottom edge */}
                      <div className="shrink-0 self-center">
                        <div className="relative mb-4">
                          <DishImage name={item.name} image={item.image} />
                          <div className="absolute left-1/2 -bottom-4 -translate-x-1/2 z-10">
                            {qty === 0 ? (
                              <button
                                onClick={() => addToCart(item)}
                                disabled={!item.is_available}
                                className="bg-white border border-primary text-primary px-6 py-1.5 rounded-xl text-sm font-extrabold shadow-md hover:bg-primary hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                              >
                                {item.is_available ? "ADD" : "N/A"}
                              </button>
                            ) : (
                              <div className="flex items-center gap-3 bg-primary text-white rounded-xl px-3 py-1.5 shadow-md">
                                <button onClick={() => setQty(item.id, qty - 1)} aria-label="Decrease" className="p-0.5"><Minus size={16} /></button>
                                <span className="text-sm font-extrabold w-4 text-center tabular-nums">{qty}</span>
                                <button onClick={() => addToCart(item)} aria-label="Increase" className="p-0.5"><Plus size={16} /></button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Floating cart bar */}
      {count > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => router.push('/cart')}
              className="w-full bg-green-600 text-white py-3.5 rounded-2xl font-bold flex justify-between items-center px-6 shadow-xl shadow-green-600/30 hover:bg-green-700 transition"
            >
              <span>{count} item{count > 1 ? "s" : ""} added</span>
              <span className="flex items-center gap-2">View Cart <ShoppingCart size={20} /></span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
