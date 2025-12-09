import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { getApiUrl } from '@/lib/apiClient';

export default function OrdersPageNew() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const restaurantId = 'fd64a3b7-4c88-4a5d-b53f-a18ef35bcfe4';
      const response = await fetch(getApiUrl(`/api/orders?restaurantId=${restaurantId}`));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Orders data:', data);
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage and track customer orders</p>
        </div>

        <Card>
          <CardContent className="py-8">
            {isLoading && <div className="text-center">Loading orders...</div>}
            
            {error && (
              <div className="text-center text-destructive">
                Error: {error}
              </div>
            )}
            
            {!isLoading && !error && orders.length === 0 && (
              <div className="text-center text-muted-foreground">
                No orders found
              </div>
            )}
            
            {!isLoading && !error && orders.length > 0 && (
              <div className="space-y-4">
                <p className="text-center">Found {orders.length} orders</p>
                <pre className="text-xs overflow-auto max-h-96 bg-muted p-4 rounded">
                  {JSON.stringify(orders, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
