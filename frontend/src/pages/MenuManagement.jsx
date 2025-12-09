import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { getApiUrl } from '@/lib/apiClient';

const RESTAURANT_ID = 'fd64a3b7-4c88-4a5d-b53f-a18ef35bcfe4';

// API functions
async function fetchMenuItems(restaurantId) {
  const response = await fetch(getApiUrl(`/api/menu?restaurantId=${restaurantId}`));
  if (!response.ok) throw new Error('Failed to fetch menu items');
  const data = await response.json();
  // Transform to match frontend expectations
  return data.map(item => ({
    ...item,
    price: item.priceCents / 100, // Convert cents to rupees
    image: item.imageUrl,
    isSpicy: false,
    isPopular: false,
    isOutOfStock: !item.isAvailable
  }));
}

async function createMenuItem(item) {
  // Transform to match backend schema
  const payload = {
    restaurantId: item.restaurantId,
    name: item.name,
    description: item.description,
    priceCents: Math.round(item.price * 100), // Convert rupees to cents
    category: item.category,
    isVeg: item.isVeg,
    isAvailable: !item.isOutOfStock,
    imageUrl: item.image,
  };
  const response = await fetch(getApiUrl('/api/menu'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to create menu item');
  return response.json();
}

async function updateMenuItem({ id, ...data }) {
  // Transform to match backend schema
  const payload = {
    name: data.name,
    description: data.description,
    priceCents: data.price ? Math.round(data.price * 100) : undefined,
    category: data.category,
    isVeg: data.isVeg,
    isAvailable: data.isOutOfStock !== undefined ? !data.isOutOfStock : undefined,
    imageUrl: data.image,
  };
  const response = await fetch(getApiUrl(`/api/menu/${id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to update menu item');
  return response.json();
}

async function deleteMenuItem(id) {
  const response = await fetch(getApiUrl(`/api/menu/${id}`), {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete menu item');
  return response.json();
}

async function forceDeleteMenuItem(id) {
  const response = await fetch(getApiUrl(`/api/menu/${id}?force=true`), {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to force delete menu item');
  return response.json();
}

export default function MenuManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null); // Track item for force delete
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    isVeg: false,
    isSpicy: false,
    isPopular: false,
    isOutOfStock: false,
    isAvailable: true,
    image: '',
  });

  // Fetch menu items
  const { data: menuItems = [], isLoading, isError } = useQuery({
    queryKey: ['menu-items', RESTAURANT_ID],
    queryFn: () => fetchMenuItems(RESTAURANT_ID),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries(['menu-items', RESTAURANT_ID]);
      setIsAddItemOpen(false);
      resetForm();
      toast({
        title: 'Success!',
        description: 'Menu item created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: updateMenuItem,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['menu-items', RESTAURANT_ID]);
      // Only close dialog and reset form if it was a full edit
      if (editingItem) {
        setEditingItem(null);
        resetForm();
      }
      const message = data.isAvailable === false 
        ? 'Menu item marked as unavailable'
        : data.isAvailable === true 
        ? 'Menu item marked as available' 
        : 'Menu item updated successfully';
      toast({
        title: '✅ Success!',
        description: message,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['menu-items', RESTAURANT_ID]);
      if (data.markedUnavailable && data.canForceDelete) {
        // Ask if user wants to force delete
        setItemToDelete(data.id);
        toast({
          title: '⚠️ Item Marked Unavailable',
          description: 'This item is used in orders. Click "Force Delete" to permanently remove it and its order history.',
        });
      } else if (data.markedUnavailable) {
        toast({
          title: '⚠️ Item Marked Unavailable',
          description: 'This item is used in orders, so it was marked as unavailable instead of being deleted',
        });
      } else {
        toast({
          title: '✅ Success!',
          description: 'Menu item deleted successfully',
        });
      }
    },
    onError: (error) => {
      toast({
        title: '❌ Error',
        description: error.message || 'Failed to delete menu item. It may be used in existing orders.',
        variant: 'destructive',
      });
    },
  });

  // Force delete mutation
  const forceDeleteMutation = useMutation({
    mutationFn: forceDeleteMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries(['menu-items', RESTAURANT_ID]);
      setItemToDelete(null);
      toast({
        title: '✅ Force Deleted',
        description: 'Menu item and its order history have been permanently removed',
      });
    },
    onError: (error) => {
      toast({
        title: '❌ Error',
        description: error.message || 'Failed to force delete menu item',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      isVeg: false,
      isSpicy: false,
      isPopular: false,
      isOutOfStock: false,
      isAvailable: true,
      image: '',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const itemData = {
      restaurantId: RESTAURANT_ID,
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      isVeg: formData.isVeg,
      isSpicy: formData.isSpicy,
      isPopular: formData.isPopular,
      isOutOfStock: formData.isOutOfStock,
      isAvailable: formData.isAvailable,
      image: formData.image || null,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...itemData });
    } else {
      createMutation.mutate(itemData);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category || '',
      isVeg: item.isVeg,
      isSpicy: item.isSpicy,
      isPopular: item.isPopular,
      isOutOfStock: item.isOutOfStock,
      isAvailable: item.isAvailable !== false,
      image: item.imageUrl || '',
    });
    setIsAddItemOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleStockToggle = (item) => {
    const newAvailability = !item.isAvailable;
    updateMutation.mutate({
      id: item.id,
      isAvailable: newAvailability
    });
  };

  const handleDialogClose = () => {
    setIsAddItemOpen(false);
    setEditingItem(null);
    resetForm();
  };

  // Group items by category
  const itemsByCategory = menuItems.reduce((acc, item) => {
    const cat = item.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">Failed to load menu items</p>
            <p className="text-sm text-muted-foreground mt-2">Make sure the backend server is running</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display">Menu Management</h1>
            <p className="text-muted-foreground">
              Manage your restaurant menu items ({menuItems.length} total)
            </p>
          </div>
          <Button 
            onClick={() => {
              resetForm();
              setEditingItem(null);
              setIsAddItemOpen(true);
            }}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Menu Item
          </Button>
        </div>

        <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </DialogTitle>
            </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="name">Item Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Masala Dosa"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the dish..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="99.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Starters, Main Course"
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="image">Image (emoji or URL)</Label>
                    <Input
                      id="image"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="🍕 or image URL"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isVeg">Vegetarian</Label>
                    <Switch
                      id="isVeg"
                      checked={formData.isVeg}
                      onCheckedChange={(checked) => setFormData({ ...formData, isVeg: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isSpicy">Spicy</Label>
                    <Switch
                      id="isSpicy"
                      checked={formData.isSpicy}
                      onCheckedChange={(checked) => setFormData({ ...formData, isSpicy: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isPopular">Popular Item</Label>
                    <Switch
                      id="isPopular"
                      checked={formData.isPopular}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isAvailable" className="font-semibold">In Stock</Label>
                    <Switch
                      id="isAvailable"
                      checked={formData.isAvailable}
                      onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isOutOfStock">Out of Stock</Label>
                    <Switch
                      id="isOutOfStock"
                      checked={formData.isOutOfStock}
                      onCheckedChange={(checked) => setFormData({ ...formData, isOutOfStock: checked })}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleDialogClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="hero"
                    className="flex-1"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : editingItem ? (
                      'Update Item'
                    ) : (
                      'Create Item'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

        {/* Menu Items by Category */}
        <div className="space-y-6">
          {Object.keys(itemsByCategory).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No menu items yet</p>
                <Button onClick={() => setIsAddItemOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Item
                </Button>
              </CardContent>
            </Card>
          ) : (
            Object.entries(itemsByCategory).map(([category, items]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="font-display">
                    {category} ({items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        className="glass rounded-lg p-4 relative group flex flex-col h-full"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {item.image && (
                                <span className="text-2xl">{item.image}</span>
                              )}
                              <h3 className="font-semibold">{item.name}</h3>
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            <p className="font-bold text-primary">
                              ₹{parseFloat(item.price).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-3 min-h-[28px]">
                          {item.isVeg && (
                            <Badge variant="outline" className="text-green-600">
                              Veg
                            </Badge>
                          )}
                          {item.isSpicy && (
                            <Badge variant="outline" className="text-orange-600">
                              Spicy
                            </Badge>
                          )}
                          {item.isPopular && (
                            <Badge variant="outline" className="text-yellow-600">
                              Popular
                            </Badge>
                          )}
                          {item.isOutOfStock && (
                            <Badge variant="destructive">Out of Stock</Badge>
                          )}
                          {!item.isAvailable && (
                            <Badge variant="secondary">Unavailable</Badge>
                          )}
                        </div>

                        <div className="flex gap-2 mt-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Force Delete Confirmation Dialog */}
      <AlertDialog open={itemToDelete !== null} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Force Delete Item?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This item is used in existing orders. If you force delete it:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>The menu item will be permanently removed</li>
                <li>It will be removed from all order histories</li>
                <li>This action cannot be undone</li>
              </ul>
              <p className="mt-3 font-semibold text-foreground">
                Recommended: Keep it marked as "unavailable" to preserve order history.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => forceDeleteMutation.mutate(itemToDelete)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Force Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
