import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function Pricing() {
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setError(null);
    try {
      const res = await api.get("/admin/pricing-config/");
      setForm(res.data);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);

  if (!form) return <p className="text-gray-500">Loading pricing...</p>;

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.patch("/admin/pricing-config/", form);
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setSaving(false);
    }
  }

  function resetDefaults() {
    setForm({
      ...form,
      base_delivery_charge: 50,
      platform_charge: 10,
      rain_rush_charge: 30,
      peak_hour_charge: 20,
      min_order_amount: 0,
      free_delivery_above: 0,
      is_rain_mode_enabled: false,
      is_peak_mode_enabled: false,
    });
  }

  return (
    <form onSubmit={save} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm grid md:grid-cols-2 gap-4">
      {error && <p className="md:col-span-2 text-sm text-red-600">{error}</p>}
      {["base_delivery_charge", "platform_charge", "rain_rush_charge", "peak_hour_charge", "min_order_amount", "free_delivery_above"].map((k) => (
        <div key={k}>
          <p className="text-xs text-gray-500 mb-1">{k.replaceAll("_", " ")}</p>
          <input className="w-full p-3 border rounded-xl" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
        </div>
      ))}
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={form.is_rain_mode_enabled} onChange={(e) => setForm({ ...form, is_rain_mode_enabled: e.target.checked })} />
        Rain mode enabled
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={form.is_peak_mode_enabled} onChange={(e) => setForm({ ...form, is_peak_mode_enabled: e.target.checked })} />
        Peak mode enabled
      </label>
      <div className="md:col-span-2 flex gap-3">
        <button type="submit" disabled={saving} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold disabled:opacity-50">
          {saving ? "Saving..." : saved ? "Saved" : "Save Pricing"}
        </button>
        <button type="button" onClick={resetDefaults} className="px-4 py-3 rounded-xl border border-gray-200 font-bold">
          Reset Defaults
        </button>
        <button type="button" onClick={load} className="px-4 py-3 rounded-xl border border-gray-200 font-bold">
          Reload
        </button>
      </div>
    </form>
  );
}

