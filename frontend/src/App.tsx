import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import "@/lib/i18n";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import MenuManagement from "./pages/MenuManagement.jsx";
import TableManagement from "./pages/TableManagement";
import OrdersPage from "./pages/OrdersPage";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import CustomerMenu from "./pages/CustomerMenu.jsx";
import QRGenerator from "./pages/QRGenerator.jsx";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Customer Routes */}
              <Route path="/menu/:tableId" element={<CustomerMenu />} />
              <Route path="/demo" element={<CustomerMenu />} />
              
              {/* Dashboard Routes */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/menus" element={<MenuManagement />} />
              <Route path="/dashboard/tables" element={<TableManagement />} />
              <Route path="/dashboard/orders" element={<OrdersPage />} />
              <Route path="/dashboard/analytics" element={<Analytics />} />
              <Route path="/dashboard/settings" element={<Settings />} />
              <Route path="/dashboard/qr" element={<QRGenerator />} />
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
