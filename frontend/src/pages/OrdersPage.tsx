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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = 'http://localhost:5000/api';

interface Order {
  id: string;
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
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      
      // Get restaurantId - hardcoded for now
      const restaurantId = 'fd64a3b7-4c88-4a5d-b53f-a18ef35bcfe4';
      
      const response = await fetch(`${API_BASE_URL}/orders?restaurantId=${restaurantId}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      
      console.log('Raw order data:', data);
      
      // Handle empty data
      if (!data || !Array.isArray(data)) {
        setOrders([]);
        return;
      }
      
      // Transform backend data to frontend format
      const transformedOrders = data.map((order: any) => {
        try {
          return {
            id: order.id || 'unknown',
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
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) throw new Error('Failed to update order status');
      
      toast({
        title: 'Success',
        description: `Order updated to ${newStatus}`,
      });
      
      fetchOrders(); // Refresh orders
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    }
  };

  const filterOrders = (status?: string) => {
    if (!status || status === 'all') return orders;
    return orders.filter((order) => order.status === status);
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const config = statusConfig[order.status];
    const Icon = config.icon;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold">{order.id}</h3>
              <Badge className={config.color}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Table {order.table} • {order.createdAt}
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

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-lg font-bold">₹{order.total.toFixed(2)}</span>
          <div className="flex gap-2">
            {order.status === 'pending' && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => updateOrderStatus(order.id, 'cancelled')}
                >
                  <XCircle className="w-4 h-4" />
                  Cancel
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => updateOrderStatus(order.id, 'preparing')}
                >
                  <ChefHat className="w-4 h-4" />
                  Start Preparing
                </Button>
              </>
            )}
            {order.status === 'preparing' && (
              <Button 
                variant="success" 
                size="sm"
                onClick={() => updateOrderStatus(order.id, 'ready')}
              >
                <Check className="w-4 h-4" />
                Mark Ready
              </Button>
            )}
            {order.status === 'ready' && (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => updateOrderStatus(order.id, 'served')}
              >
                <Truck className="w-4 h-4" />
                Mark Served
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-display">Orders</h1>
          <p className="text-muted-foreground">Manage and track customer orders</p>
        </div>

        {/* Loading/Error State */}
        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">Loading orders...</div>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">No orders found</div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Order Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                  <TabsList>
                    <TabsTrigger value="all">All Orders</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="preparing">Preparing</TabsTrigger>
                    <TabsTrigger value="ready">Ready</TabsTrigger>
                    <TabsTrigger value="served">Served</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                {filterOrders(activeTab).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No orders in this category</div>
                ) : (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
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
