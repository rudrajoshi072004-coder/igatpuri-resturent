import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await api.get("/admin/customers/");
      setCustomers(r.data);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = customers.filter((c) =>
    `${c.name || c.username || ""} ${c.email || ""} ${c.phone || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          className="p-3 border rounded-xl w-full md:w-96"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={load} className="px-3 py-2 rounded-lg text-sm font-bold bg-white border border-gray-200">Refresh</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3">Call</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {filtered.map((c) => (
            <tr key={c.id}>
              <td className="px-4 py-3 font-bold">{c.name || c.username}</td>
              <td className="px-4 py-3">{c.email}</td>
              <td className="px-4 py-3">{c.phone}</td>
              <td className="px-4 py-3">{new Date(c.created_at).toLocaleString()}</td>
              <td className="px-4 py-3">
                {c.phone ? <a className="text-accent font-bold text-sm" href={`tel:${c.phone}`}>Call</a> : <span className="text-gray-400 text-sm">NA</span>}
              </td>
            </tr>
          ))}
          {!loading && filtered.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No customers found</td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}

