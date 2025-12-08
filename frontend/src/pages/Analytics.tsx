import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';

const API_BASE_URL = 'http://localhost:5000/api';
const RESTAURANT_ID = 'fd64a3b7-4c88-4a5d-b53f-a18ef35bcfe4';

export default function Analytics() {
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);
  const [activeTables, setActiveTables] = useState(0);
  const [topItems, setTopItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);

      // Fetch orders
      const ordersResponse = await fetch(`${API_BASE_URL}/orders`);
      const orders = await ordersResponse.json();

      // Fetch tables
      const tablesResponse = await fetch(`${API_BASE_URL}/tables?restaurantId=${RESTAURANT_ID}`);
      const tables = await tablesResponse.json();

      // Calculate today's data
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrdersData = orders.filter((o: any) => new Date(o.createdAt || o.created_at) >= today);
      const revenue = todayOrdersData.reduce((sum: number, o: any) => sum + (o.totalCents || o.total_cents) / 100, 0);

      setTodayRevenue(revenue);
      setTodayOrders(todayOrdersData.length);
      setActiveTables(tables.filter((t: any) => t.active_sessions > 0).length);

      // Calculate top selling items
      const itemCounts: Record<string, number> = {};
      orders.forEach((order: any) => {
        order.items?.forEach((item: any) => {
          const name = item.name || item.item_name;
          itemCounts[name] = (itemCounts[name] || 0) + item.quantity;
        });
      });

      const sortedItems = Object.entries(itemCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      setTopItems(sortedItems);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-semibold mb-4">Analytics & Insights</h1>

      {isLoading ? (
        <div className="text-center py-8">Loading analytics...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Today's Revenue</p>
              <p className="text-xl font-bold mt-2">₹{todayRevenue.toFixed(2)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Orders (Today)</p>
              <p className="text-xl font-bold mt-2">{todayOrders}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Active Tables</p>
              <p className="text-xl font-bold mt-2">{activeTables}</p>
            </Card>
          </div>

          <section>
            <h2 className="text-lg font-medium mb-2">Top Selling Items</h2>
            {topItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales yet — items will appear here once orders come in.</p>
            ) : (
              <div className="space-y-2">
                {topItems.map((item) => (
                  <Card key={item.name} className="p-4">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.count} orders</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </DashboardLayout>
  );
}
