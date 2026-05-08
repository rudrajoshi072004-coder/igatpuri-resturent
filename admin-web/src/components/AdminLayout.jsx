import { Bell, Bike, IndianRupee, LayoutDashboard, Search, ShoppingBag, Store, Users } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { clearAdminToken } from "../auth/storage";
import { api } from "../api/client";

const NAV = [
  { to: "/admin-dashboard/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin-dashboard/orders", icon: ShoppingBag, label: "Live Orders" },
  { to: "/admin-dashboard/restaurants", icon: Store, label: "Restaurants" },
  { to: "/admin-dashboard/delivery-boys", icon: Bike, label: "Delivery Boys" },
  { to: "/admin-dashboard/customers", icon: Users, label: "Customers" },
  { to: "/admin-dashboard/pricing", icon: IndianRupee, label: "Pricing Config" },
];

export default function AdminLayout() {
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const active = (to) => (location.pathname === to || (to !== "/admin-dashboard/" && location.pathname.startsWith(to)));

  useEffect(() => {
    let timerId;
    const loadStats = async () => {
      try {
        const res = await api.get("/admin/dashboard-stats/");
        setPendingCount(Number(res.data?.pending_orders || 0));
      } catch {
        // Keep UI stable even if notification polling fails.
      }
    };
    loadStats();
    timerId = window.setInterval(loadStats, 10000);
    return () => window.clearInterval(timerId);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-primary text-white flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold text-accent">Admin Panel</h1>
          <p className="text-xs text-white/60 mt-1">Igatpuri Eats</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                active(item.to) ? "bg-accent text-white font-medium shadow-md" : "text-white/70 hover:bg-white/10"
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => {
              clearAdminToken();
              window.location.href = "/admin-dashboard/login";
            }}
            className="w-full px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 font-bold"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg w-96">
            <Search size={20} className="text-gray-400" />
            <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none w-full text-sm" />
          </div>
          <div className="flex items-center gap-6">
            <div className="relative cursor-pointer">
              <Bell size={24} className="text-gray-600" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold h-5 min-w-5 px-1 rounded-full flex items-center justify-center">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-secondary text-white flex items-center justify-center font-bold">
                AD
              </div>
              <div>
                <p className="text-sm font-medium">Admin</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

