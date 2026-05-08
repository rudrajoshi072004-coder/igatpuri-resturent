import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [menuForm, setMenuForm] = useState({ restaurant: "", name: "", price: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const [res, items] = await Promise.all([api.get("/admin/restaurants/"), api.get("/admin/menu-items/")]);
      setRestaurants(res.data);
      setMenuItems(items.data);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addRestaurant(e) {
    e.preventDefault();
    await api.post("/admin/restaurants/", { name, address, phone: "9000000000", is_active: true });
    setName("");
    setAddress("");
    load();
  }

  async function deleteRestaurant(id) {
    await api.delete(`/admin/restaurants/${id}/`);
    load();
  }

  async function addMenuItem(e) {
    e.preventDefault();
    await api.post("/admin/menu-items/", {
      restaurant: Number(menuForm.restaurant),
      name: menuForm.name,
      price: menuForm.price,
      is_available: true,
      is_veg: true,
    });
    setMenuForm({ restaurant: "", name: "", price: "" });
    load();
  }

  async function deleteMenuItem(id) {
    await api.delete(`/admin/menu-items/${id}/`);
    load();
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <form onSubmit={addRestaurant} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm grid md:grid-cols-3 gap-3">
        <input className="p-3 border rounded-xl" placeholder="Restaurant name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="p-3 border rounded-xl" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} required />
        <button className="bg-primary text-white rounded-xl font-bold">Add Restaurant</button>
      </form>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {restaurants.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-bold">{r.name}</td>
                <td className="px-4 py-3">{r.address}</td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={r.is_active}
                    onChange={async (e) => {
                      await api.patch(`/admin/restaurants/${r.id}/`, { is_active: e.target.checked });
                      load();
                    }}
                  />
                </td>
                <td className="px-4 py-3">
                  <button className="text-red-600 font-bold text-sm" onClick={() => deleteRestaurant(r.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!loading && restaurants.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No restaurants</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={addMenuItem} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm grid md:grid-cols-4 gap-3">
        <select className="p-3 border rounded-xl" value={menuForm.restaurant} onChange={(e) => setMenuForm({ ...menuForm, restaurant: e.target.value })} required>
          <option value="">Select restaurant</option>
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <input className="p-3 border rounded-xl" placeholder="Item name" value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} required />
        <input className="p-3 border rounded-xl" placeholder="Price" value={menuForm.price} onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })} required />
        <button className="bg-primary text-white rounded-xl font-bold">Add Menu Item</button>
      </form>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Restaurant</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {menuItems.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 font-bold">{m.name}</td>
                <td className="px-4 py-3">{restaurants.find((r) => r.id === m.restaurant)?.name || m.restaurant}</td>
                <td className="px-4 py-3">₹{m.price}</td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={m.is_available}
                    onChange={async (e) => {
                      await api.patch(`/admin/menu-items/${m.id}/`, { is_available: e.target.checked });
                      load();
                    }}
                  />
                </td>
                <td className="px-4 py-3">
                  <button className="text-red-600 font-bold text-sm" onClick={() => deleteMenuItem(m.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!loading && menuItems.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No menu items</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

