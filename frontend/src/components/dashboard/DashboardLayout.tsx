import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChefHat,
  LayoutDashboard,
  UtensilsCrossed,
  QrCode,
  ClipboardList,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  Check,
  Clock,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Menu Lists', href: '/dashboard/menus', icon: UtensilsCrossed },
  { name: 'Tables & QR', href: '/dashboard/tables', icon: QrCode },
  { name: 'QR Generator', href: '/dashboard/qr', icon: QrCode },
  { name: 'Orders', href: '/dashboard/orders', icon: ClipboardList },
  { name: 'Analytics & Insights', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Business Settings', href: '/dashboard/settings', icon: Settings },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 5 seconds for real-time updates
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchNotifications() {
    try {
      const restaurantId = 'fd64a3b7-4c88-4a5d-b53f-a18ef35bcfe4';
      
      // Fetch both orders and service requests
      const [ordersRes, serviceRes] = await Promise.all([
        fetch(getApiUrl(`/api/orders?restaurantId=${restaurantId}`)),
        fetch(getApiUrl(`/api/service-requests?restaurantId=${restaurantId}`))
      ]);
      
      const allNotifications = [];
      
      // Add order notifications
      if (ordersRes.ok) {
        const orders = await ordersRes.json();
        const orderNotifs = orders
          .filter((o: any) => o.status === 'PENDING' || o.status === 'CONFIRMED')
          .slice(0, 3)
          .map((o: any) => ({
            id: o.id,
            type: 'order',
            message: `New order from Table ${o.tableNumber || 'Unknown'}`,
            status: o.status,
            time: new Date(o.createdAt),
          }));
        allNotifications.push(...orderNotifs);
      }
      
      // Add service request notifications
      if (serviceRes.ok) {
        const serviceRequests = await serviceRes.json();
        const serviceNotifs = serviceRequests
          .filter((sr: any) => sr.status === 'PENDING')
          .slice(0, 5)
          .map((sr: any) => ({
            id: sr.id,
            type: 'service',
            message: `${sr.requestType === 'WAITER' ? '🙋 Waiter' : sr.requestType === 'WATER' ? '💧 Water' : sr.requestType === 'BILL' ? '💰 Bill' : '📝 Service'} request from Table ${sr.tableNumber || 'Unknown'}`,
            status: sr.status,
            requestType: sr.requestType,
            time: new Date(sr.createdAt),
          }));
        allNotifications.push(...serviceNotifs);
      }
      
      // Sort by time, most recent first
      allNotifications.sort((a, b) => b.time.getTime() - a.time.getTime());
      
      setNotifications(allNotifications.slice(0, 8));
      setUnreadCount(allNotifications.length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }

  function handleSignOut() {
    try {
      logout();
    } catch (e) {
      // ignore
    }
    // ensure user is redirected to login after sign out
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-64 bg-card border-r border-border flex flex-col fixed h-screen z-50 transition-transform duration-300",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display">MenuAI</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || 'admin@menu.ai'}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 w-full">
        {/* Header */}
        <header className="h-16 border-b border-border bg-white flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>

          <div className="relative w-full max-w-md hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search orders, items, tables..."
              className="pl-10 bg-secondary/50"
            />
          </div>
          
          {/* Mobile: Show only search icon */}
          <Button variant="ghost" size="icon" className="sm:hidden">
            <Search className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No new notifications
                  </div>
                ) : (
                  <>
                    {notifications.map((notif) => (
                      <DropdownMenuItem
                        key={notif.id}
                        className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                        onClick={() => {
                          if (notif.type === 'order') {
                            navigate('/dashboard/orders');
                          } else if (notif.type === 'service') {
                            // Resolve service request
                            fetch(getApiUrl(`/api/service-requests/${notif.id}/resolve`), {
                              method: 'PUT'
                            }).then(() => fetchNotifications());
                          }
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium text-sm">{notif.message}</span>
                          {notif.type === 'order' && (
                            <Badge 
                              variant={notif.status === 'PENDING' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {notif.status}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {notif.time.toLocaleTimeString()}
                        </span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="justify-center text-primary cursor-pointer"
                      onClick={() => navigate('/dashboard/orders')}
                    >
                      View all orders
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 sm:p-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
