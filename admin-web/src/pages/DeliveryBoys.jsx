import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function DeliveryBoys() {
  const [boys, setBoys] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "boy123", vehicle_number: "MH-00-NEW" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/delivery-boys/");
      setBoys(res.data);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function add(e) {
    e.preventDefault();
    await api.post("/admin/delivery-boys/", form);
    setForm({ name: "", email: "", phone: "", password: "boy123", vehicle_number: "MH-00-NEW" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span />}
        <button onClick={load} className="px-3 py-2 rounded-lg text-sm font-bold bg-white border border-gray-200">Refresh</button>
      </div>
      <form onSubmit={add} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm grid md:grid-cols-5 gap-3">
        <input className="p-3 border rounded-xl" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="p-3 border rounded-xl" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="p-3 border rounded-xl" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="p-3 border rounded-xl" placeholder="Vehicle" value={form.vehicle_number} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} />
        <button className="bg-primary text-white rounded-xl font-bold">Add Boy</button>
      </form>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Call</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {boys.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3 font-bold">{b.name || b.username}</td>
                <td className="px-4 py-3">{b.email}</td>
                <td className="px-4 py-3">{b.phone}</td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={b.is_active}
                    onChange={async (e) => {
                      await api.patch(`/admin/delivery-boys/${b.id}/`, { is_active: e.target.checked });
                      load();
                    }}
                  />
                </td>
                <td className="px-4 py-3">
                  {b.phone ? (
                    <a className="text-accent font-bold text-sm" href={`tel:${b.phone}`}>Call</a>
                  ) : (
                    <span className="text-gray-400 text-sm">NA</span>
                  )}
                </td>
              </tr>
            ))}
            {!loading && boys.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No delivery boys</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

