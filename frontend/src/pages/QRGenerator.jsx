import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const RESTAURANT_ID = 1;

export default function QRGenerator() {
  const { toast } = useToast();
  const [tableNumber, setTableNumber] = useState('1');
  const [copied, setCopied] = useState(false);
  
  // Generate QR code URL (change this to your production domain)
  const baseUrl = window.location.origin;
  const qrUrl = `${baseUrl}/menu/${tableNumber}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'QR code URL copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('qr-code');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `table-${tableNumber}-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      
      toast({
        title: 'Downloaded!',
        description: `QR code for Table ${tableNumber} saved`,
      });
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-display">QR Code Generator</h1>
          <p className="text-muted-foreground">
            Generate QR codes for your restaurant tables
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Configuration Card */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Configure QR Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tableNumber">Table Number</Label>
                <Input
                  id="tableNumber"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Enter table number"
                />
              </div>

              <div className="space-y-2">
                <Label>Generated URL</Label>
                <div className="flex gap-2">
                  <Input value={qrUrl} readOnly className="flex-1" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyUrl}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Customers will scan this QR code to access the menu
                </p>
              </div>

              <div className="pt-4 space-y-2">
                <h3 className="font-semibold">How to use:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Enter the table number</li>
                  <li>Download the QR code</li>
                  <li>Print and place on the table</li>
                  <li>Customers scan to view menu and order</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Display */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display">QR Code Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="p-6 bg-white rounded-lg shadow-sm">
                  <QRCodeSVG
                    id="qr-code"
                    value={qrUrl}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                
                <div className="text-center">
                  <p className="font-semibold text-lg">Table {tableNumber}</p>
                  <p className="text-sm text-muted-foreground">Scan to view menu</p>
                </div>

                <Button
                  variant="hero"
                  className="w-full"
                  onClick={handleDownloadQR}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download QR Code
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Generation Info */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Quick Table Numbers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Click a table number to quickly generate its QR code:
            </p>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                <Button
                  key={num}
                  variant={tableNumber === num.toString() ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTableNumber(num.toString())}
                >
                  {num}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
