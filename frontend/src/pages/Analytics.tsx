import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Clock,
  Star,
  ArrowUp,
  ArrowDown,
  Calendar,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getApiUrl } from '@/lib/apiClient';

const RESTAURANT_ID = 'fd64a3b7-4c88-4a5d-b53f-a18ef35bcfe4';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  completedOrders: number;
  cancelledOrders: number;
  topItems: Array<{ name: string; count: number; revenue: number }>;
  revenueByDay: Array<{ date: string; amount: number }>;
  ordersByStatus: Record<string, number>;
  peakHours: Array<{ hour: number; orders: number }>;
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    topItems: [],
    revenueByDay: [],
    ordersByStatus: {},
    peakHours: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    if (timeRange === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (timeRange === 'week') {
      start.setDate(start.getDate() - 7);
    } else if (timeRange === 'month') {
      start.setDate(start.getDate() - 30);
    }
    
    return { start, end };
  };

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const { start, end } = getDateRange();

      // Fetch orders
      const ordersResponse = await fetch(getApiUrl(`/api/orders?restaurantId=${RESTAURANT_ID}`));
      if (!ordersResponse.ok) throw new Error('Failed to fetch orders');
      const allOrders = await ordersResponse.json();

      // Filter orders by date range
      const orders = allOrders.filter((o: any) => {
        const orderDate = new Date(o.createdAt || o.created_at);
        return orderDate >= start && orderDate <= end;
      });

      // Calculate metrics
      const totalRevenue = orders.reduce((sum: number, o: any) => 
        sum + (o.totalCents || o.total_cents || 0) / 100, 0
      );
      const totalOrders = orders.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      const completedOrders = orders.filter((o: any) => 
        ['COMPLETED', 'SERVED'].includes(o.status)
      ).length;
      
      const cancelledOrders = orders.filter((o: any) => 
        o.status === 'CANCELLED'
      ).length;

      // Orders by status
      const ordersByStatus: Record<string, number> = {};
      orders.forEach((o: any) => {
        const status = o.status || 'UNKNOWN';
        ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
      });

      // Top selling items
      const itemStats: Record<string, { count: number; revenue: number }> = {};
      orders.forEach((order: any) => {
        (order.items || []).forEach((item: any) => {
          const name = item.itemName || item.name || 'Unknown';
          if (!itemStats[name]) {
            itemStats[name] = { count: 0, revenue: 0 };
          }
          itemStats[name].count += item.quantity || 0;
          itemStats[name].revenue += ((item.unitPriceCents || 0) * (item.quantity || 0)) / 100;
        });
      });

      const topItems = Object.entries(itemStats)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 10)
        .map(([name, stats]) => ({ name, ...stats }));

      // Revenue by day
      const revenueByDay: Record<string, number> = {};
      orders.forEach((o: any) => {
        const date = new Date(o.createdAt || o.created_at).toLocaleDateString();
        const amount = (o.totalCents || o.total_cents || 0) / 100;
        revenueByDay[date] = (revenueByDay[date] || 0) + amount;
      });

      const revenueByDayArray = Object.entries(revenueByDay)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Peak hours
      const ordersByHour: Record<number, number> = {};
      orders.forEach((o: any) => {
        const hour = new Date(o.createdAt || o.created_at).getHours();
        ordersByHour[hour] = (ordersByHour[hour] || 0) + 1;
      });

      const peakHours = Object.entries(ordersByHour)
        .map(([hour, orders]) => ({ hour: parseInt(hour), orders }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 5);

      setAnalytics({
        totalRevenue,
        totalOrders,
        avgOrderValue,
        completedOrders,
        cancelledOrders,
        topItems,
        revenueByDay: revenueByDayArray,
        ordersByStatus,
        peakHours,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display">Analytics & Insights</h1>
            <p className="text-muted-foreground">Track your restaurant's performance</p>
          </div>
          
          {/* Time Range Selector */}
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">7 Days</TabsTrigger>
              <TabsTrigger value="month">30 Days</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{analytics.totalRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Avg: ₹{analytics.avgOrderValue.toFixed(2)} per order
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalOrders}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="success" className="text-xs">
                      {analytics.completedOrders} completed
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{analytics.avgOrderValue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Per customer transaction
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.totalOrders > 0 
                      ? ((analytics.completedOrders / analytics.totalOrders) * 100).toFixed(1)
                      : 0}%
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="destructive" className="text-xs">
                      {analytics.cancelledOrders} cancelled
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Selling Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.topItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No sales data yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.topItems.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.count} orders • ₹{item.revenue.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <TrendingUp className="h-4 w-4 text-success" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Peak Hours */}
              <Card>
                <CardHeader>
                  <CardTitle>Peak Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.peakHours.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No order data yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.peakHours.map((peak) => (
                        <div key={peak.hour} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {peak.hour.toString().padStart(2, '0')}:00 - {(peak.hour + 1).toString().padStart(2, '0')}:00
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {peak.orders} orders
                              </p>
                            </div>
                          </div>
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full"
                              style={{ 
                                width: `${(peak.orders / Math.max(...analytics.peakHours.map(p => p.orders))) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.revenueByDay.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No revenue data yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {analytics.revenueByDay.map((day) => (
                      <div key={day.date} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{day.date}</span>
                        </div>
                        <span className="font-bold text-primary">₹{day.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Orders by Status</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(analytics.ordersByStatus).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No order data yet
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(analytics.ordersByStatus).map(([status, count]) => (
                      <div key={status} className="text-center p-4 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-xs text-muted-foreground mt-1 capitalize">
                          {status.toLowerCase()}
                        </p>
                      </div>
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
