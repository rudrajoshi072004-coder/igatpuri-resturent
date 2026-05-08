import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { setAdminToken } from "../auth/storage";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@igatpurieats.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/login/", { email, password });
      if (res.data?.user?.role !== "ADMIN") throw new Error("Not an admin account");
      setAdminToken(res.data.tokens.access);
      navigate("/admin-dashboard/", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="bg-white w-full max-w-md p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800">Admin Login</h1>
        <p className="text-sm text-gray-500 mt-1">Igatpuri Eats</p>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 space-y-3">
          <input className="w-full p-3 border rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input className="w-full p-3 border rounded-xl" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
          <button disabled={loading} className="w-full bg-primary text-white py-3 rounded-xl font-bold disabled:opacity-50">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </form>
    </div>
  );
}

