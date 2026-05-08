import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadStats() {
    setLoading(true);
    setError(null);
    try {
      const r = await api.get("/admin/dashboard-stats/");
      setStats(r.data);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
    const timer = window.setInterval(loadStats, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const cards = [
    { label: "Today's Orders", value: stats?.today_orders ?? "-", color: "bg-blue-500", onClick: () => navigate("/admin-dashboard/orders") },
    { label: "Today's Revenue", value: stats ? `₹${stats.today_revenue}` : "-", color: "bg-green-500", onClick: () => navigate("/admin-dashboard/orders?filter=delivered") },
    { label: "Pending", value: stats?.pending_orders ?? "-", color: "bg-orange-500", onClick: () => navigate("/admin-dashboard/orders?filter=new") },
    { label: "Active Delivery", value: stats?.active_delivery_boys ?? "-", color: "bg-purple-500", onClick: () => navigate("/admin-dashboard/delivery-boys") },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-600 text-sm">Live stats from database. Cards are clickable.</p>
        <button onClick={loadStats} className="px-3 py-2 rounded-lg text-sm font-bold bg-white border border-gray-200">
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {cards.map((stat, i) => (
          <button
            key={i}
            onClick={stat.onClick}
            className="text-left bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition"
          >
            <div className={`h-12 w-12 rounded-xl ${stat.color} text-white flex items-center justify-center shadow-lg`}>
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

