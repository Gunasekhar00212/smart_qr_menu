import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  UtensilsCrossed,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const API_BASE_URL = 'http://localhost:5000/api';
const RESTAURANT_ID = 'fd64a3b7-4c88-4a5d-b53f-a18ef35bcfe4';

const stats = [
  {
    title: 'Today\'s Revenue',
    value: '₹2,847',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
  },
  {
    title: 'Total Orders',
    value: '156',
    change: '+8.2%',
    trend: 'up',
    icon: ShoppingBag,
  },
  {
    title: 'Active Tables',
    value: '12/20',
    change: '60%',
    trend: 'neutral',
    icon: UtensilsCrossed,
  },
  {
    title: 'Avg Wait Time',
    value: '8 min',
    change: '-2.3%',
    trend: 'down',
    icon: Clock,
  },
];

const recentOrders = [
  { id: 'ORD-001', table: 'Table 5', items: 4, total: '₹45.99', status: 'preparing', time: '2 min ago' },
  { id: 'ORD-002', table: 'Table 12', items: 2, total: '₹28.50', status: 'ready', time: '5 min ago' },
  { id: 'ORD-003', table: 'Table 3', items: 6, total: '₹89.00', status: 'served', time: '12 min ago' },
  { id: 'ORD-004', table: 'Table 8', items: 3, total: '₹34.75', status: 'pending', time: '1 min ago' },
];

const popularItems = [
  { name: 'Margherita Pizza', orders: 42, revenue: '₹629.58' },
  { name: 'Grilled Salmon', orders: 38, revenue: '₹949.62' },
  { name: 'Caesar Salad', orders: 35, revenue: '₹454.65' },
  { name: 'Beef Burger', orders: 31, revenue: '₹464.69' },
];

const statusColors = {
  pending: 'bg-warning/20 text-warning',
  preparing: 'bg-info/20 text-info',
  ready: 'bg-success/20 text-success',
  served: 'bg-muted text-muted-foreground',
};

export default function Dashboard() {
  const [stats, setStats] = useState([
    { title: 'Today\'s Revenue', value: '₹0', change: '0%', trend: 'neutral' as const, icon: DollarSign },
    { title: 'Total Orders', value: '0', change: '0%', trend: 'neutral' as const, icon: ShoppingBag },
    { title: 'Active Tables', value: '0/0', change: '0%', trend: 'neutral' as const, icon: UtensilsCrossed },
    { title: 'Avg Wait Time', value: '0 min', change: '0%', trend: 'neutral' as const, icon: Clock },
  ]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [popularItems, setPopularItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch orders
      const ordersResponse = await fetch(`${API_BASE_URL}/orders`);
      const orders = await ordersResponse.json();

      // Fetch tables
      const tablesResponse = await fetch(`${API_BASE_URL}/tables?restaurantId=${RESTAURANT_ID}`);
      const tables = await tablesResponse.json();

      // Calculate today's revenue
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = orders.filter((o: any) => new Date(o.createdAt || o.created_at) >= today);
      const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + (o.totalCents || o.total_cents) / 100, 0);

      // Calculate active tables
      const activeTables = tables.filter((t: any) => t.active_sessions > 0).length;

      // Update stats
      setStats([
        { title: 'Today\'s Revenue', value: `₹${todayRevenue.toFixed(2)}`, change: '+0%', trend: 'up', icon: DollarSign },
        { title: 'Total Orders', value: `${orders.length}`, change: '+0%', trend: 'up', icon: ShoppingBag },
        { title: 'Active Tables', value: `${activeTables}/${tables.length}`, change: `${Math.round(activeTables / tables.length * 100)}%`, trend: 'neutral', icon: UtensilsCrossed },
        { title: 'Avg Wait Time', value: '~5 min', change: '0%', trend: 'neutral', icon: Clock },
      ]);

      // Transform recent orders
      const transformedOrders = orders.slice(0, 4).map((order: any) => ({
        id: order.id || order.order_id,
        table: `Table ${order.tableNumber || order.table_number}`,
        items: order.items?.length || 0,
        total: `₹${((order.totalCents || order.total_cents) / 100).toFixed(2)}`,
        status: order.status || 'pending',
        time: formatTimeAgo(new Date(order.createdAt || order.created_at)),
      }));
      setRecentOrders(transformedOrders);

      // Calculate popular items
      const itemCounts: Record<string, { count: number; revenue: number }> = {};
      orders.forEach((order: any) => {
        order.items?.forEach((item: any) => {
          const name = item.name || item.item_name;
          if (!itemCounts[name]) {
            itemCounts[name] = { count: 0, revenue: 0 };
          }
          itemCounts[name].count += item.quantity;
          itemCounts[name].revenue += (item.priceCents || item.price_cents) * item.quantity / 100;
        });
      });

      const sortedItems = Object.entries(itemCounts)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 4)
        .map(([name, data]) => ({
          name,
          orders: data.count,
          revenue: `₹${data.revenue.toFixed(2)}`,
        }));
      setPopularItems(sortedItems);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
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
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-display">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        <div className="grid lg:grid-cols-3 gap-6">
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
                        <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Popular Items */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Top Items</CardTitle>
              <Button variant="ghost" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : popularItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No popular items yet</div>
              ) : (
                <div className="space-y-4">
                  {popularItems.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.orders} orders</p>
                        </div>
                      </div>
                      <p className="font-bold text-primary">{item.revenue}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
