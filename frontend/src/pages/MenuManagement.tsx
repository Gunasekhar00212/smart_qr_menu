import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, MoreVertical, Image, Check, X } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isVeg: boolean;
  isSpicy: boolean;
  isOutOfStock: boolean;
  image?: string;
}

interface MenuList {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  assignedTables: number;
}

const mockMenuLists: MenuList[] = [
  { id: '1', name: 'Floor 1 - Tiffins', description: 'South Indian breakfast items', itemCount: 24, assignedTables: 8 },
  { id: '2', name: 'Floor 2 - Meals', description: 'Full course lunch and dinner', itemCount: 45, assignedTables: 12 },
  { id: '3', name: 'Outdoor - Snacks', description: 'Light snacks and beverages', itemCount: 18, assignedTables: 6 },
];

const mockMenuItems: MenuItem[] = [
  { id: '1', name: 'Masala Dosa', description: 'Crispy crepe with potato filling', price: 5.99, category: 'Breakfast', isVeg: true, isSpicy: true, isOutOfStock: false },
  { id: '2', name: 'Idli Sambar', description: 'Steamed rice cakes with lentil soup', price: 4.99, category: 'Breakfast', isVeg: true, isSpicy: false, isOutOfStock: false },
  { id: '3', name: 'Chicken Biryani', description: 'Aromatic rice with spiced chicken', price: 12.99, category: 'Main Course', isVeg: false, isSpicy: true, isOutOfStock: false },
  { id: '4', name: 'Paneer Tikka', description: 'Grilled cottage cheese with spices', price: 9.99, category: 'Starters', isVeg: true, isSpicy: true, isOutOfStock: true },
];

export default function MenuManagement() {
  const [selectedList, setSelectedList] = useState<string | null>('1');
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddListOpen, setIsAddListOpen] = useState(false);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display">Menu Management</h1>
            <p className="text-muted-foreground">Create and manage your restaurant menus</p>
          </div>
          <Dialog open={isAddListOpen} onOpenChange={setIsAddListOpen}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus className="w-5 h-5" />
                Add Menu List
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Create New Menu List</DialogTitle>
              </DialogHeader>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="listName">List Name</Label>
                  <Input id="listName" placeholder="e.g., Floor 1 - Tiffins" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="listDesc">Description</Label>
                  <Textarea id="listDesc" placeholder="Describe this menu list..." />
                </div>
                <Button type="submit" variant="hero" className="w-full">
                  Create Menu List
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Menu Lists Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Menu Lists
            </h3>
            {mockMenuLists.map((list) => (
              <motion.div
                key={list.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card
                  className={`cursor-pointer transition-all ${
                    selectedList === list.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedList(list.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{list.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{list.description}</p>
                        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                          <span>{list.itemCount} items</span>
                          <span>•</span>
                          <span>{list.assignedTables} tables</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Menu Items */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>
                  {mockMenuLists.find((l) => l.id === selectedList)?.name || 'Select a Menu'}
                </CardTitle>
                <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-5 h-5" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="font-display">Add Menu Item</DialogTitle>
                    </DialogHeader>
                    <form className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="itemName">Item Name</Label>
                        <Input id="itemName" placeholder="e.g., Margherita Pizza" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="itemDesc">Description</Label>
                        <Textarea id="itemDesc" placeholder="Describe this item..." />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="itemPrice">Price</Label>
                          <Input id="itemPrice" type="number" step="0.01" placeholder="9.99" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="itemCategory">Category</Label>
                          <Input id="itemCategory" placeholder="Main Course" />
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="rounded border-input" />
                          <span className="text-sm">Vegetarian</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="rounded border-input" />
                          <span className="text-sm">Spicy</span>
                        </label>
                      </div>
                      <div className="p-4 border-2 border-dashed rounded-xl text-center">
                        <Image className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Drop image or click to upload
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Or use AI to generate an image
                        </p>
                      </div>
                      <Button type="submit" variant="hero" className="w-full">
                        Add Item
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {mockMenuItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-xl border border-border hover:border-primary/50 transition-all group"
                    >
                      <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-lg bg-secondary flex items-center justify-center text-3xl">
                          {item.isVeg ? '🥬' : '🍗'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{item.name}</h4>
                                {item.isVeg && (
                                  <Badge variant="outline" className="text-success border-success">
                                    Veg
                                  </Badge>
                                )}
                                {item.isSpicy && (
                                  <span>🌶️</span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                            </div>
                            <p className="font-bold text-primary">₹{item.price}</p>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <Badge variant="secondary">{item.category}</Badge>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant={item.isOutOfStock ? 'destructive' : 'success'}
                                size="sm"
                              >
                                {item.isOutOfStock ? (
                                  <>
                                    <X className="w-4 h-4" />
                                    Out of Stock
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-4 h-4" />
                                    In Stock
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
