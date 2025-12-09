import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Clock,
  Check,
  ChefHat,
  Truck,
  XCircle,
  MoreVertical,
  AlertCircle,
  RefreshCw,
  Trash2,
} from 'lucide-react';
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

interface Order {
  id: string;
  orderNumber: string;
  table: string | number;
  items: { name: string; quantity: number; price: number }[];
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  total: number;
  createdAt: string;
  notes?: string;
}

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-warning/20 text-warning' },
  confirmed: { label: 'Confirmed', icon: Check, color: 'bg-info/20 text-info' },
  preparing: { label: 'Preparing', icon: ChefHat, color: 'bg-info/20 text-info' },
  ready: { label: 'Ready', icon: Check, color: 'bg-success/20 text-success' },
  served: { label: 'Served', icon: Truck, color: 'bg-muted text-muted-foreground' },
  completed: { label: 'Completed', icon: Check, color: 'bg-muted text-muted-foreground' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-destructive/20 text-destructive' },
};

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
    // Poll for new orders every 5 seconds for real-time updates
    const interval = setInterval(() => fetchOrders(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      setIsRefreshing(true);
      
      // Get restaurantId - hardcoded for now
      const restaurantId = 'fd64a3b7-4c88-4a5d-b53f-a18ef35bcfe4';
      
      const response = await fetch(getApiUrl(`/api/orders?restaurantId=${restaurantId}`));
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      
      console.log('Raw order data:', data);
      
      // Handle empty data
      if (!data || !Array.isArray(data)) {
        setOrders([]);
        return;
      }
      
      // Transform backend data to frontend format
      const transformedOrders = data.map((order: any, index: number) => {
        try {
          return {
            id: order.id || 'unknown',
            orderNumber: `ORD ${data.length - index}`,
            table: order.tableNumber || order.tableLabel || 'No Table',
            items: (order.items || [])
              .filter((item: any) => item && item.id)
              .map((item: any) => ({
                name: item.itemName || 'Unknown Item',
                quantity: item.quantity || 1,
                price: (item.unitPriceCents || 0) / 100,
              })),
            status: (order.status?.toLowerCase() || 'pending') as 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled',
            total: (order.totalCents || 0) / 100,
            createdAt: order.createdAt ? formatTimeAgo(new Date(order.createdAt)) : 'Unknown',
            notes: order.notes || '',
          };
        } catch (err) {
          console.error('Error transforming order:', order, err);
          return null;
        }
      }).filter(Boolean) as Order[];
      
      console.log('Transformed orders:', transformedOrders);
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load orders',
        variant: 'destructive',
      });
      setOrders([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/orders/${orderId}/status`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus.toUpperCase() }),
      });
      
      if (!response.ok) throw new Error('Failed to update order status');
      
      const updatedOrder = await response.json();
      
      // Update the order in the local state without refreshing the whole page
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus as any }
            : order
        )
      );
      
      toast({
        title: '✅ Order Updated',
        description: `Order status changed to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
      });
      
      // Don't refresh the entire page - just update the local state above
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to update order status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const filterOrders = (status?: string) => {
    if (!status || status === 'all') return orders;
    return orders.filter((order) => order.status === status);
  };

  const handleClearTodayData = async () => {
    try {
      setIsClearing(true);
      const restaurantId = 'fd64a3b7-4c88-4a5d-b53f-a18ef35bcfe4';
      const response = await fetch(getApiUrl(`/api/orders/clear-today?restaurantId=${restaurantId}`), {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Orders Cleared',
          description: `Successfully cleared ${data.deletedCount || 0} orders`,
        });
        // Use silent refresh to avoid showing loading spinner
        await fetchOrders(true);
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

  const OrderCard = ({ order }: { order: Order }) => {
    const config = statusConfig[order.status];
    const Icon = config.icon;

    return (
      <motion.div
        layout
        className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold">
                {order.items.length > 0 ? order.items[0].name : 'Order'} 
                {order.items.length > 1 && ` +${order.items.length - 1} more`}
              </h3>
              <Badge className={config.color}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {order.orderNumber} • Table {order.table} • {order.createdAt}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2 mb-4">
              {order.items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {item.quantity}x {item.name}
              </span>
              <span className="font-medium">₹{(item.quantity * item.price).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-warning/10 text-warning text-sm mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{order.notes}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
          <span className="text-lg font-bold">₹{order.total.toFixed(2)}</span>
          <div className="flex gap-2">
            {(order.status === 'cancelled' || order.status === 'completed') ? (
              <span className="text-sm text-muted-foreground">Order {order.status}</span>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => updateOrderStatus(order.id, 'cancelled')}
                  className="flex-1 sm:flex-none"
                >
                  <XCircle className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Cancel</span>
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => updateOrderStatus(order.id, 'completed')}
                  className="flex-1 sm:flex-none"
                >
                  <Check className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Complete</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display">Orders</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage and track customer orders</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchOrders(true)}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 sm:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
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
                    <strong>This will clear:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>All orders (pending, completed, etc.)</li>
                      <li>Order items and details</li>
                      <li>Complete order history</li>
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
          </div>
        </div>

        {/* Loading/Error State */}
        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">Loading orders...</div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Order Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {Object.entries(statusConfig).map(([key, config]) => {
                const count = orders.filter((o) => o.status === key).length;
                return (
                  <Card key={key} className={`${activeTab === key ? 'border-primary' : ''}`}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center`}>
                          <config.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{count}</p>
                          <p className="text-xs text-muted-foreground">{config.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Orders */}
            <Card>
              <CardHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full overflow-x-auto flex-nowrap justify-start">
                    <TabsTrigger value="all" className="whitespace-nowrap">All Orders</TabsTrigger>
                    <TabsTrigger value="pending" className="whitespace-nowrap">Pending</TabsTrigger>
                    <TabsTrigger value="confirmed" className="whitespace-nowrap">Confirmed</TabsTrigger>
                    <TabsTrigger value="preparing" className="whitespace-nowrap">Preparing</TabsTrigger>
                    <TabsTrigger value="ready" className="whitespace-nowrap">Ready</TabsTrigger>
                    <TabsTrigger value="served" className="whitespace-nowrap">Served</TabsTrigger>
                    <TabsTrigger value="completed" className="whitespace-nowrap">Completed</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No orders yet</div>
                ) : filterOrders(activeTab).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No orders in this category</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                    {filterOrders(activeTab).map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
