import { BrowserRouter, Routes, Route } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";
import AdminLayout from "./components/AdminLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LiveOrders from "./pages/LiveOrders";
import Restaurants from "./pages/Restaurants";
import DeliveryBoys from "./pages/DeliveryBoys";
import Customers from "./pages/Customers";
import Pricing from "./pages/Pricing";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin-dashboard/login" element={<Login />} />
        <Route
          path="/admin-dashboard/*"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<LiveOrders />} />
          <Route path="restaurants" element={<Restaurants />} />
          <Route path="delivery-boys" element={<DeliveryBoys />} />
          <Route path="customers" element={<Customers />} />
          <Route path="pricing" element={<Pricing />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
