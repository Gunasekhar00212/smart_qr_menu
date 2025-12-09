import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  UtensilsCrossed,
  Bell,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  RefreshCw,
  Eye,
  Plus,
  Trash2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { getApiUrl } from '@/lib/apiClient';

const RESTAURANT_ID = 'fd64a3b7-4c88-4a5d-b53f-a18ef35bcfe4';

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [stats, setStats] = useState([
    { title: 'Today\'s Revenue', value: '₹0', change: '0%', trend: 'neutral' as const, icon: DollarSign },
    { title: 'Total Orders', value: '0', change: '0%', trend: 'neutral' as const, icon: ShoppingBag },
    { title: 'Active Tables', value: '0/0', change: '0%', trend: 'neutral' as const, icon: UtensilsCrossed },
    { title: 'Avg Wait Time', value: '0 min', change: '0%', trend: 'neutral' as const, icon: Clock },
  ]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [popularItems, setPopularItems] = useState<any[]>([]);
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isClearing, setIsClearing] = useState(false);

  const fetchDashboardData = async (silent = false) => {
    try {
      console.log('🔄 fetchDashboardData called, silent:', silent);
      
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      console.log('📊 Loading states set - isLoading:', !silent, 'isRefreshing:', silent);
      console.log('Fetching dashboard data...');

      // Fetch all data in parallel
      const [ordersResponse, tablesResponse, menuResponse, serviceResponse] = await Promise.all([
        fetch(getApiUrl(`/api/orders?restaurantId=${RESTAURANT_ID}`)),
        fetch(getApiUrl(`/api/tables?restaurantId=${RESTAURANT_ID}`)),
        fetch(getApiUrl(`/api/menu?restaurantId=${RESTAURANT_ID}`)),
        fetch(getApiUrl(`/api/service-requests?restaurantId=${RESTAURANT_ID}`)),
      ]);

      console.log('Response status:', {
        orders: ordersResponse.ok,
        tables: tablesResponse.ok,
        menu: menuResponse.ok,
        service: serviceResponse.ok
      });

      const orders = await ordersResponse.json();
      const tables = await tablesResponse.json();
      const menuItems = await menuResponse.json();
      const serviceReqs = await serviceResponse.json();

      console.log('Fetched data:', {
        ordersCount: orders.length,
        tablesCount: tables.length,
        menuItemsCount: menuItems.length,
        serviceReqsCount: serviceReqs.length
      });

      // Calculate today's revenue and yesterday's for comparison - only from completed orders
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const todayOrders = orders.filter((o: any) => new Date(o.createdAt || o.created_at) >= today);
      const yesterdayOrders = orders.filter((o: any) => {
        const date = new Date(o.createdAt || o.created_at);
        return date >= yesterday && date < today;
      });

      // Only count revenue from completed orders
      const todayCompletedOrders = todayOrders.filter((o: any) => o.status?.toUpperCase() === 'COMPLETED');
      const yesterdayCompletedOrders = yesterdayOrders.filter((o: any) => o.status?.toUpperCase() === 'COMPLETED');
      
      const todayRevenue = todayCompletedOrders.reduce((sum: number, o: any) => sum + (o.totalCents || o.total_cents) / 100, 0);
      const yesterdayRevenue = yesterdayCompletedOrders.reduce((sum: number, o: any) => sum + (o.totalCents || o.total_cents) / 100, 0);
      const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1) : '0';
      const ordersChange = yesterdayOrders.length > 0 ? ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length * 100).toFixed(1) : '0';

      // Calculate active tables based on active orders (pending, confirmed, preparing, ready)
      const activeOrderStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'];
      const activeOrders = todayOrders.filter((o: any) => activeOrderStatuses.includes(o.status?.toUpperCase()));
      const activeTableNumbers = new Set(activeOrders.map((o: any) => o.tableNumber || o.table_number).filter(Boolean));
      const activeTables = activeTableNumbers.size;
      const tableOccupancy = tables.length > 0 ? Math.round(activeTables / tables.length * 100) : 0;

      // Calculate average wait time (time from order creation to ready status)
      const completedOrders = todayOrders.filter((o: any) => o.status === 'READY' || o.status === 'SERVED' || o.status === 'COMPLETED');
      const totalWaitTime = completedOrders.reduce((sum: number, o: any) => {
        const created = new Date(o.createdAt || o.created_at).getTime();
        const updated = new Date(o.updatedAt || o.updated_at).getTime();
        return sum + (updated - created) / 1000 / 60; // minutes
      }, 0);
      const avgWaitTime = completedOrders.length > 0 ? Math.round(totalWaitTime / completedOrders.length) : 0;

      console.log('Calculated stats:', {
        todayRevenue,
        todayOrdersCount: todayOrders.length,
        activeTables,
        avgWaitTime,
        revenueChange,
        ordersChange
      });

      // Update stats
      setStats([
        { 
          title: 'Today\'s Revenue', 
          value: `₹${todayRevenue.toFixed(2)}`, 
          change: `${parseFloat(revenueChange) >= 0 ? '+' : ''}${revenueChange}%`, 
          trend: parseFloat(revenueChange) >= 0 ? 'up' : 'down', 
          icon: DollarSign 
        },
        { 
          title: 'Total Orders', 
          value: `${todayOrders.length}`, 
          change: `${parseFloat(ordersChange) >= 0 ? '+' : ''}${ordersChange}%`, 
          trend: parseFloat(ordersChange) >= 0 ? 'up' : 'down', 
          icon: ShoppingBag 
        },
        { 
          title: 'Active Tables', 
          value: `${activeTables}/${tables.length}`, 
          change: `${tableOccupancy}% occupied`, 
          trend: 'neutral', 
          icon: UtensilsCrossed 
        },
        { 
          title: 'Avg Wait Time', 
          value: `${avgWaitTime} min`, 
          change: avgWaitTime < 15 ? 'Good' : 'High', 
          trend: avgWaitTime < 15 ? 'down' : 'up', 
          icon: Clock 
        },
      ]);

      // Transform recent orders - show only today's orders sorted by time
      const transformedOrders = todayOrders
        .sort((a: any, b: any) => new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime())
        .slice(0, 5)
        .map((order: any, index: number) => ({
          id: `ORD ${todayOrders.length - index}`,
          table: `Table ${order.tableNumber || order.table_number || 'N/A'}`,
          items: order.items?.length || 0,
          total: `₹${((order.totalCents || order.total_cents) / 100).toFixed(2)}`,
          status: (order.status || 'pending').toLowerCase(),
          time: formatTimeAgo(new Date(order.createdAt || order.created_at)),
        }));
      setRecentOrders(transformedOrders);

      // Calculate popular items from today's orders
      const itemCounts: Record<string, { count: number; revenue: number }> = {};
      todayOrders.forEach((order: any) => {
        order.items?.forEach((item: any) => {
          const name = item.name || item.itemName || item.item_name || item.menuItemName;
          if (!name || name === 'null') return; // Skip invalid items
          if (!itemCounts[name]) {
            itemCounts[name] = { count: 0, revenue: 0 };
          }
          itemCounts[name].count += item.quantity || 1;
          const price = item.unitPriceCents || item.unit_price_cents || item.priceCents || item.price_cents || 0;
          itemCounts[name].revenue += (price * (item.quantity || 1)) / 100;
        });
      });

      const sortedItems = Object.entries(itemCounts)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 5)
        .map(([name, data]) => ({
          name,
          orders: data.count,
          revenue: `₹${data.revenue.toFixed(2)}`,
        }));
      setPopularItems(sortedItems);

      // Get pending service requests
      const pendingRequests = serviceReqs
        .filter((req: any) => req.status === 'PENDING')
        .sort((a: any, b: any) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime())
        .slice(0, 5)
        .map((req: any) => ({
          id: req.id,
          type: req.request_type || req.requestType,
          table: `Table ${req.table_number || req.tableNumber || 'N/A'}`,
          time: formatTimeAgo(new Date(req.created_at || req.createdAt)),
        }));
      setServiceRequests(pendingRequests);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (!silent) {
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 5 seconds for real-time updates
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClearTodayData = async () => {
    try {
      setIsClearing(true);
      const response = await fetch(getApiUrl(`/api/orders/clear-today?restaurantId=${RESTAURANT_ID}`), {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Orders Cleared',
          description: `Successfully cleared ${data.deletedCount || 0} orders`,
        });
        fetchDashboardData(true);
      } else {
        throw new Error('Failed to clear data');
      }
    } catch (error) {
      console.error('Error clearing today\'s data:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear today\'s data',
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleResolveServiceRequest = async (id: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/service-requests/${id}/resolve`), {
        method: 'PUT',
      });

      if (response.ok) {
        toast({
          title: 'Request Resolved',
          description: 'Service request has been marked as resolved',
        });
        fetchDashboardData(true);
      }
    } catch (error) {
      console.error('Error resolving service request:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve service request',
        variant: 'destructive',
      });
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getServiceRequestIcon = (type: string) => {
    switch (type) {
      case 'WAITER': return '🙋';
      case 'WATER': return '💧';
      case 'BILL': return '💰';
      default: return '📝';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display">Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Welcome back! Here's what's happening today.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={isClearing}
                >
                  <Trash2 className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Clear Orders</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Orders?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete ALL orders from the database. This action cannot be undone.
                    <br /><br />
                    <strong>This will reset:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>All revenue to ₹0</li>
                      <li>Order count to 0</li>
                      <li>Recent orders list</li>
                      <li>Popular items statistics</li>
                      <li>All order history</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearTodayData}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Clear All Orders
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              size="sm"
              onClick={() => navigate('/dashboard/menus')}
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Menu Item</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-border hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                      <div className="flex items-center gap-1 mt-2">
                        {stat.trend === 'up' && (
                          <ArrowUpRight className="w-4 h-4 text-success" />
                        )}
                        {stat.trend === 'down' && (
                          <ArrowDownRight className="w-4 h-4 text-success" />
                        )}
                        <span className={`text-sm ${stat.trend === 'up' ? 'text-success' : stat.trend === 'down' ? 'text-success' : 'text-muted-foreground'}`}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <stat.icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Orders */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Button variant="ghost" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No recent orders</div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{order.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.table} • {order.items} items
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{order.total}</p>
                        <Badge 
                          variant={
                            order.status === 'pending' || order.status === 'confirmed' ? 'default' :
                            order.status === 'preparing' ? 'secondary' :
                            order.status === 'ready' ? 'outline' :
                            'secondary'
                          }
                          className="text-xs"
                        >
                          {order.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => navigate('/dashboard/orders')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View All Orders
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Popular Items */}
          <Card>
            <CardHeader>
              <CardTitle>Top Items Today</CardTitle>
              <CardDescription>Most ordered items</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : popularItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No orders yet today</div>
              ) : (
                <div className="space-y-4">
                  {popularItems.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.orders} orders</p>
                        </div>
                      </div>
                      <p className="font-bold text-primary whitespace-nowrap ml-2">{item.revenue}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Service Requests Section */}
        {serviceRequests.length > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-warning" />
                  <CardTitle>Pending Service Requests</CardTitle>
                </div>
                <Badge variant="destructive">{serviceRequests.length}</Badge>
              </div>
              <CardDescription>Customers waiting for assistance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {serviceRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-background border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {getServiceRequestIcon(request.type)}
                      </div>
                      <div>
                        <p className="font-medium">{request.table}</p>
                        <p className="text-sm text-muted-foreground">{request.time}</p>
                        <p className="text-xs text-warning">{request.type}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveServiceRequest(request.id)}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => navigate('/dashboard/orders')}
              >
                <ShoppingBag className="w-6 h-6" />
                <span>View Orders</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => navigate('/dashboard/menus')}
              >
                <UtensilsCrossed className="w-6 h-6" />
                <span>Manage Menu</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => navigate('/dashboard/tables')}
              >
                <Users className="w-6 h-6" />
                <span>Tables & QR</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => navigate('/dashboard/analytics')}
              >
                <TrendingUp className="w-6 h-6" />
                <span>Analytics</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
