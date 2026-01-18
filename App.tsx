
import React from 'react';
import { HashRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import AdminSidebar from './components/AdminSidebar';
import ClientNavbar from './components/ClientNavbar';
import NotificationToast from './components/NotificationToast';

// Admin Pages
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import POS from './pages/admin/POS';
import MenuManager from './pages/admin/MenuManager';
import OrderManager from './pages/admin/OrderManager';
import BookingManager from './pages/admin/BookingManager';
import TableManager from './pages/admin/TableManager';
import ZoneManager from './pages/admin/ZoneManager';
import CategoryManager from './pages/admin/CategoryManager';
import CustomerManager from './pages/admin/CustomerManager';
import InventoryManager from './pages/admin/InventoryManager';
import EmployeeManager from './pages/admin/EmployeeManager';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';
import PromotionManager from './pages/admin/PromotionManager';
import BarDisplay from './pages/admin/BarDisplay';
import OrderHistory from './pages/admin/OrderHistory';

// Client Pages
import Home from './pages/client/Home';
import ClientBooking from './pages/client/ClientBooking';
import Menu from './pages/client/Menu';
import Contact from './pages/client/Contact';
import SelfOrder from './pages/client/SelfOrder';

// Layouts
const AdminLayout = () => {
  const { currentUser } = useStore();

  // Protect Admin Routes
  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      <AdminSidebar />
      <main className="flex-1 ml-64 overflow-x-hidden relative">
        <Outlet />
        <NotificationToast />
      </main>
    </div>
  );
};

const ClientLayout = () => (
  <div className="min-h-screen font-sans text-slate-800">
    <ClientNavbar />
    <main>
      <Outlet />
    </main>
    <footer className="bg-slate-900 text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">SiamSavory</h2>
        <p className="mb-6">Authentic Thai Cuisine • Est. 1995</p>
        <p className="text-sm">© {new Date().getFullYear()} SiamSavory. All rights reserved.</p>
      </div>
    </footer>
  </div>
);

const App: React.FC = () => {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          {/* Client Routes - Standard Website */}
          <Route path="/" element={<ClientLayout />}>
            <Route index element={<Home />} />
            <Route path="menu" element={<Menu />} />
            <Route path="booking" element={<ClientBooking />} />
            <Route path="contact" element={<Contact />} />
          </Route>

          {/* Client Route - Self Order (Standalone Layout) */}
          <Route path="/customer/table/:tableId" element={<SelfOrder />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<Login />} />
          
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="pos" element={<POS />} />
            <Route path="orders" element={<OrderManager />} />
            <Route path="bar" element={<BarDisplay />} />
            <Route path="history" element={<OrderHistory />} />
            <Route path="tables" element={<TableManager />} />
            <Route path="tables/zones" element={<ZoneManager />} />
            <Route path="menu" element={<MenuManager />} />
            <Route path="menu/categories" element={<CategoryManager />} />
            <Route path="inventory" element={<InventoryManager />} />
            <Route path="promotions" element={<PromotionManager />} />
            <Route path="bookings" element={<BookingManager />} />
            <Route path="customers" element={<CustomerManager />} />
            <Route path="employees" element={<EmployeeManager />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </StoreProvider>
  );
};

export default App;
