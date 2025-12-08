import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, QrCode, Download, RefreshCw, Smartphone, Wifi, Trash2 } from 'lucide-react';
import QRCode from 'qrcode';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = 'http://localhost:5000/api';
const RESTAURANT_ID = 'fd64a3b7-4c88-4a5d-b53f-a18ef35bcfe4';

interface Table {
  id: string;
  number: number;
  menuList: string;
  status: 'available' | 'occupied' | 'reserved';
  activeSession: boolean;
  qrCode?: string;
}

const statusColors = {
  available: 'bg-success/20 text-success border-success/30',
  occupied: 'bg-warning/20 text-warning border-warning/30',
  reserved: 'bg-info/20 text-info border-info/30',
};

export default function TableManagement() {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      generateQR(selectedTable);
    }
  }, [selectedTable]);

  const fetchTables = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/tables?restaurantId=${RESTAURANT_ID}`);
      if (!response.ok) throw new Error('Failed to fetch tables');
      const data = await response.json();

      // Transform backend data to frontend format
      const transformedTables = data.map((table: any) => ({
        id: table.id,
        number: table.number,
        menuList: table.menu_list_name || 'No menu assigned',
        status: table.status || 'available',
        activeSession: table.active_sessions > 0,
      }));

      setTables(transformedTables);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tables',
        variant: 'destructive',
      });
      setTables([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateQR = async (table: Table) => {
    const qrUrl = `${window.location.origin}/menu/${table.id}`;
    const dataUrl = await QRCode.toDataURL(qrUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#f97316',
        light: '#ffffff',
      },
    });
    setQrDataUrl(dataUrl);
  };

  const downloadQR = () => {
    if (!qrDataUrl || !selectedTable) return;
    const link = document.createElement('a');
    link.download = `table-${selectedTable.number}-qr.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleAddTables = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const tableCount = parseInt(formData.get('tableCount') as string);

    try {
      // Get the next table number
      const maxTableNumber = tables.length > 0 ? Math.max(...tables.map(t => t.number)) : 0;

      // Create tables
      for (let i = 1; i <= tableCount; i++) {
        const response = await fetch(`${API_BASE_URL}/tables`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId: RESTAURANT_ID,
            tableNumber: maxTableNumber + i,
            capacity: 4,
          }),
        });

        if (!response.ok) throw new Error('Failed to create table');
      }

      toast({
        title: 'Success',
        description: `${tableCount} table(s) created successfully`,
      });

      setIsAddTableOpen(false);
      fetchTables(); // Refresh tables
    } catch (error) {
      console.error('Error creating tables:', error);
      toast({
        title: 'Error',
        description: 'Failed to create tables',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTable = async (tableId: string, tableNumber: number) => {
    if (!confirm(`Are you sure you want to delete Table ${tableNumber}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tables/${tableId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete table');

      toast({
        title: 'Success',
        description: `Table ${tableNumber} deleted successfully`,
      });

      fetchTables(); // Refresh tables
      setSelectedTable(null);
    } catch (error) {
      console.error('Error deleting table:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete table',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display">Tables & QR Codes</h1>
            <p className="text-muted-foreground">Manage tables and generate QR codes</p>
          </div>
          <Dialog open={isAddTableOpen} onOpenChange={setIsAddTableOpen}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus className="w-5 h-5" />
                Add Tables
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Add Tables</DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleAddTables}>
                <div className="space-y-2">
                  <Label htmlFor="tableCount">Number of Tables to Add</Label>
                  <Input id="tableCount" name="tableCount" type="number" min="1" placeholder="5" required />
                </div>
                <Button type="submit" variant="hero" className="w-full">
                  Generate Tables & QR Codes
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                  <span className="text-2xl">🟢</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold">{tables.filter((t) => t.status === 'available').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                  <span className="text-2xl">🟠</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Occupied</p>
                  <p className="text-2xl font-bold">{tables.filter((t) => t.status === 'occupied').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-info/20 flex items-center justify-center">
                  <span className="text-2xl">🔵</span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reserved</p>
                  <p className="text-2xl font-bold">{tables.filter((t) => t.status === 'reserved').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Tables Grid */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>All Tables</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading tables...</div>
                ) : tables.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tables found. Click "Add Tables" to create some.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {tables.map((table) => (
                      <motion.div
                        key={table.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-4 rounded-xl border-2 transition-all relative ${
                          selectedTable?.id === table.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTable(table.id, table.number);
                          }}
                          className="absolute top-2 right-2 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete table"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="text-center cursor-pointer" onClick={() => setSelectedTable(table)}>
                          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-2">
                            <span className="text-lg font-bold">{table.number}</span>
                          </div>
                          <Badge className={statusColors[table.status]}>
                            {table.status}
                          </Badge>
                          {table.activeSession && (
                            <div className="flex items-center justify-center gap-1 mt-2 text-xs text-primary">
                              <Wifi className="w-3 h-3" />
                              Active
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* QR Code Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                QR Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTable ? (
                <div className="text-center space-y-4">
                  <div className="p-4 bg-secondary rounded-2xl inline-block">
                    {qrDataUrl && (
                      <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Table {selectedTable.number}</h4>
                    <p className="text-sm text-muted-foreground">{selectedTable.menuList}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={downloadQR}>
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => generateQR(selectedTable)}>
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </Button>
                  </div>
                  <div className="p-3 rounded-lg bg-info/10 text-info text-sm">
                    <Smartphone className="w-4 h-4 inline mr-2" />
                    QR remains the same when menu updates
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <QrCode className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Select a table to view QR code</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
