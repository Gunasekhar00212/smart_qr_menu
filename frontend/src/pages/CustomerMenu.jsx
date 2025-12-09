import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Sparkles,
  Bell,
  Droplets,
  User,
  Trash2,
  MessageCircle,
  X,
  Leaf,
  Flame,
  Star,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from '@/lib/apiClient';

const RESTAURANT_ID = 'fd64a3b7-4c88-4a5d-b53f-a18ef35bcfe4'; // Default restaurant

const categories = ['All', 'Starters', 'Main Course', 'Desserts', 'Beverages', 'Breads'];

// Fetch restaurant information
async function fetchRestaurantInfo(restaurantId) {
  const response = await fetch(getApiUrl(`/api/settings?restaurantId=${restaurantId}`));
  if (!response.ok) {
    throw new Error('Failed to fetch restaurant info');
  }
  return await response.json();
}

// Fetch menu items from backend
async function fetchMenuItems(restaurantId) {
  const response = await fetch(getApiUrl(`/api/menu?restaurantId=${restaurantId}`));
  if (!response.ok) {
    throw new Error('Failed to fetch menu items');
  }
  const data = await response.json();
  // Transform to match frontend expectations
  return data.map(item => ({
    ...item,
    price: item.priceCents / 100, // Convert cents to rupees
    image: item.imageUrl,
    isSpicy: false, // Default values for removed fields
    isPopular: false,
    isOutOfStock: !item.isAvailable
  }));
}

export default function CustomerMenu() {
  const { tableId } = useParams();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showVegOnly, setShowVegOnly] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const { items: cartItems, addItem, removeItem, updateQuantity, total, itemCount, clearCart } = useCart();
  const { toast } = useToast();

  // Fetch restaurant info with React Query
  const { data: restaurantInfo } = useQuery({
    queryKey: ['restaurant-info', RESTAURANT_ID],
    queryFn: () => fetchRestaurantInfo(RESTAURANT_ID),
  });

  // Fetch menu items with React Query
  const { data: menuItems = [], isLoading, isError, error } = useQuery({
    queryKey: ['menu-items', RESTAURANT_ID],
    queryFn: () => fetchMenuItems(RESTAURANT_ID),
  });

  // AI Assistant state - Option-based system
  const [assistantMessages, setAssistantMessages] = useState([]);
  const [assistantStep, setAssistantStep] = useState('welcome'); // welcome, category, preference, recommendations
  const [selectedAICategory, setSelectedAICategory] = useState(null);
  const [selectedAIPreference, setSelectedAIPreference] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isAssistantOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [assistantMessages, isAssistantOpen]);

  // Initialize AI with welcome message and category options
  useEffect(() => {
    if (menuItems.length > 0 && assistantMessages.length === 0) {
      const uniqueCategories = [...new Set(menuItems.map(item => item.category))].filter(Boolean);
      setAssistantMessages([{
        role: 'assistant',
        text: "👋 Welcome! I'm here to help you find the perfect dish.",
        options: [
          ...uniqueCategories.map(cat => ({ label: cat, value: cat, type: 'category' })),
          { label: '⭐ Popular Items', value: 'popular', type: 'special' },
          { label: '🥗 Vegetarian', value: 'veg', type: 'dietary' },
          { label: '🛒 View Cart', value: 'cart', type: 'action' },
          { label: '✖️ Close AI', value: 'close', type: 'action' }
        ]
      }]);
    }
  }, [menuItems]);

  // Auto-open assistant when tableId is present (QR flow)
  useEffect(() => {
    if (tableId && menuItems.length > 0) {
      const timer = setTimeout(() => setIsAssistantOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, [tableId, menuItems]);

  // Handle option click
  function handleOptionClick(option) {
    // Add user selection to messages
    setAssistantMessages(m => [...m, { role: 'user', text: option.label }]);

    if (option.type === 'category') {
      // Category selected - show preferences
      setSelectedAICategory(option.value);
      setAssistantStep('preference');
      
      const categoryItems = menuItems.filter(item => item.category === option.value);
      const preferences = [];
      
      // Extract available preferences from this category
      if (categoryItems.some(i => i.isSpicy)) preferences.push({ label: '🌶️ Spicy', value: 'spicy', type: 'pref' });
      if (categoryItems.some(i => i.isVeg)) preferences.push({ label: '🥗 Vegetarian', value: 'veg', type: 'pref' });
      if (categoryItems.some(i => !i.isVeg)) preferences.push({ label: '🍖 Non-Veg', value: 'nonveg', type: 'pref' });
      if (categoryItems.some(i => i.isPopular)) preferences.push({ label: '⭐ Popular', value: 'popular', type: 'pref' });
      
      preferences.push({ label: '👀 Show All', value: 'all', type: 'pref' });
      preferences.push({ label: '↩️ Back to Categories', value: 'back', type: 'action' });
      preferences.push({ label: '✖️ Close AI', value: 'close', type: 'action' });
      
      setTimeout(() => {
        setAssistantMessages(m => [...m, {
          role: 'assistant',
          text: `Great choice! What kind of ${option.value} are you in the mood for?`,
          options: preferences
        }]);
      }, 300);
      
    } else if (option.type === 'pref') {
      // Preference selected - show recommendations
      setSelectedAIPreference(option.value);
      setAssistantStep('recommendations');
      
      let filteredItems = menuItems.filter(item => item.category === selectedAICategory);
      
      if (option.value === 'spicy') filteredItems = filteredItems.filter(i => i.isSpicy);
      else if (option.value === 'veg') filteredItems = filteredItems.filter(i => i.isVeg);
      else if (option.value === 'nonveg') filteredItems = filteredItems.filter(i => !i.isVeg);
      else if (option.value === 'popular') filteredItems = filteredItems.filter(i => i.isPopular);
      
      const recommendations = filteredItems.slice(0, 5);
      
      setTimeout(() => {
        setAssistantMessages(m => [...m, {
          role: 'assistant',
          text: recommendations.length > 0 
            ? `Here are my top recommendations for you:` 
            : `No items found. Let me show you all ${selectedAICategory}:`,
          recommendations: recommendations.length > 0 ? recommendations : menuItems.filter(item => item.category === selectedAICategory).slice(0, 5),
          options: [
            { label: '🔄 Different Preference', value: 'reselect_pref', type: 'action' },
            { label: '↩️ Choose Another Category', value: 'back', type: 'action' },
            { label: '🛒 View Cart', value: 'cart', type: 'action' },
            { label: '✖️ Close AI', value: 'close', type: 'action' }
          ]
        }]);
      }, 300);
      
    } else if (option.type === 'special') {
      // Special options like Popular Items
      if (option.value === 'popular') {
        const popularItems = menuItems.filter(i => i.isPopular).slice(0, 5);
        setTimeout(() => {
          setAssistantMessages(m => [...m, {
            role: 'assistant',
            text: '⭐ Here are our most popular dishes:',
            recommendations: popularItems,
            options: [
              { label: '🔙 Start Over', value: 'restart', type: 'action' },
              { label: '🛒 View Cart', value: 'cart', type: 'action' }
            ]
          }]);
        }, 300);
      }
      
    } else if (option.type === 'dietary') {
      // Dietary preferences
      if (option.value === 'veg') {
        const vegItems = menuItems.filter(i => i.isVeg).slice(0, 5);
        setTimeout(() => {
          setAssistantMessages(m => [...m, {
            role: 'assistant',
            text: '🥗 Here are our vegetarian options:',
            recommendations: vegItems,
            options: [
              { label: '🔙 Start Over', value: 'restart', type: 'action' },
              { label: '🛒 View Cart', value: 'cart', type: 'action' },
              { label: '✖️ Close AI', value: 'close', type: 'action' }
            ]
          }]);
        }, 300);
      }
      
    } else if (option.type === 'action') {
      // Action buttons
      if (option.value === 'back' || option.value === 'restart') {
        setSelectedAICategory(null);
        setSelectedAIPreference(null);
        setAssistantStep('welcome');
        const uniqueCategories = [...new Set(menuItems.map(item => item.category))].filter(Boolean);
        setTimeout(() => {
          setAssistantMessages(m => [...m, {
            role: 'assistant',
            text: '👋 Let\'s start fresh! What would you like to explore?',
            options: [
              ...uniqueCategories.map(cat => ({ label: cat, value: cat, type: 'category' })),
              { label: '⭐ Popular Items', value: 'popular', type: 'special' },
              { label: '🥗 Vegetarian', value: 'veg', type: 'dietary' },
              { label: '🛒 View Cart', value: 'cart', type: 'action' },
              { label: '✖️ Close AI', value: 'close', type: 'action' }
            ]
          }]);
        }, 300);
      } else if (option.value === 'cart') {
        if (cartItems.length === 0) {
          setTimeout(() => {
            setAssistantMessages(m => [...m, {
              role: 'assistant',
              text: '🛒 Your cart is empty. Let me help you find something delicious!',
              options: [
                { label: '🔙 Browse Menu', value: 'restart', type: 'action' },
                { label: '✖️ Close AI', value: 'close', type: 'action' }
              ]
            }]);
          }, 300);
        } else {
          const cartSummary = cartItems.map(c => `${c.quantity}× ${c.name}`).join(', ');
          setTimeout(() => {
            setAssistantMessages(m => [...m, {
              role: 'assistant',
              text: `🛒 Your Cart:\n${cartSummary}\n\nTotal: ₹${total.toFixed(2)}`,
              options: [
                { label: '🔙 Continue Shopping', value: 'restart', type: 'action' },
                { label: '✅ View Full Cart', value: 'view_cart_full', type: 'action' },
                { label: '✖️ Close AI', value: 'close', type: 'action' }
              ]
            }]);
          }, 300);
        }
      } else if (option.value === 'view_cart_full') {
        setIsAssistantOpen(false);
        setIsCartOpen(true);
      } else if (option.value === 'close') {
        setIsAssistantOpen(false);
      } else if (option.value === 'reselect_pref') {
        // Go back to preference selection
        const categoryItems = menuItems.filter(item => item.category === selectedAICategory);
        const preferences = [];
        
        if (categoryItems.some(i => i.isSpicy)) preferences.push({ label: '🌶️ Spicy', value: 'spicy', type: 'pref' });
        if (categoryItems.some(i => i.isVeg)) preferences.push({ label: '🥗 Vegetarian', value: 'veg', type: 'pref' });
        if (categoryItems.some(i => !i.isVeg)) preferences.push({ label: '🍖 Non-Veg', value: 'nonveg', type: 'pref' });
        if (categoryItems.some(i => i.isPopular)) preferences.push({ label: '⭐ Popular', value: 'popular', type: 'pref' });
        
        preferences.push({ label: '👀 Show All', value: 'all', type: 'pref' });
        preferences.push({ label: '↩️ Back to Categories', value: 'back', type: 'action' });
        preferences.push({ label: '✖️ Close AI', value: 'close', type: 'action' });
        
        setTimeout(() => {
          setAssistantMessages(m => [...m, {
            role: 'assistant',
            text: `What kind of ${selectedAICategory} would you like?`,
            options: preferences
          }]);
        }, 300);
      }
    }
  }

  // Filter menu items
  const filteredItems = menuItems.filter(item => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (showVegOnly && !item.isVeg) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleServiceRequest = async (type) => {
    try {
      const requestType = type.toUpperCase();
      const response = await fetch(getApiUrl('/api/service-requests'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: RESTAURANT_ID,
          tableId: tableId || null,
          requestType: requestType,
          notes: null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send request');
      }

      const messages = {
        water: '💧 Water request sent to staff',
        waiter: '🙋 Waiter has been notified',
        clear: '🧹 Table clearing request sent',
      };
      
      toast({
        title: '✅ Request Sent!',
        description: messages[type],
      });
    } catch (error) {
      console.error('Error sending service request:', error);
      toast({
        title: '❌ Error',
        description: 'Failed to send request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;

    setIsPlacingOrder(true);
    try {
      // Prepare order data
      const orderData = {
        restaurantId: RESTAURANT_ID,
        tableId: tableId || null,
        items: cartItems.map(item => ({
          menuItemId: item.id,
          quantity: item.quantity,
          priceCents: Math.round(item.price * 100)
        })),
        totalCents: Math.round(total * 100),
        status: 'pending',
        customerName: 'Customer' // Can be enhanced to ask for customer name
      };

      const response = await fetch(getApiUrl('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place order');
      }

      const result = await response.json();

      toast({
        title: '✅ Order Placed Successfully!',
        description: `Order #${result.id ? result.id.substring(0, 8) : 'XXXX'} has been sent to the kitchen`,
      });

      // Clear cart and close
      clearCart();
      setIsCartOpen(false);

    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to place order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load menu</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <p className="text-sm text-muted-foreground mt-4">Make sure the backend server is running on port 5175</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-4">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-strong border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 max-w-7xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold font-display">
                {restaurantInfo?.name || 'MenuAI Restaurant'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {tableId ? `Table ${tableId}` : 'Browse Menu'}
              </p>
              {restaurantInfo?.description && (
                <p className="text-xs text-muted-foreground mt-1 max-w-md line-clamp-2">
                  {restaurantInfo.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsAssistantOpen(true)}
                className="relative"
              >
                <Sparkles className="w-5 h-5 text-primary" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsCartOpen(true)}
                className="relative"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}
              <Button
                variant={showVegOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowVegOnly(!showVegOnly)}
                className="whitespace-nowrap"
              >
                <Leaf className="w-4 h-4 mr-1" />
                Veg Only
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Menu Items Grid */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items found</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      {item.isVeg && <Leaf className="w-4 h-4 text-green-600" />}
                      {item.isSpicy && <Flame className="w-4 h-4 text-orange-600" />}
                      {item.isPopular && <Star className="w-4 h-4 text-yellow-600 fill-yellow-600" />}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    <p className="font-bold text-primary">₹{parseFloat(item.price).toFixed(2)}</p>
                  </div>
                  {item.image && (
                    <div className="text-4xl ml-2">{item.image}</div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {item.isOutOfStock ? (
                    <Badge variant="secondary" className="w-full justify-center">
                      Out of Stock
                    </Badge>
                  ) : (
                    <>
                      {cartItems.find(ci => ci.id === item.id.toString()) ? (
                        <div className="flex items-center gap-2 w-full">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              const cartItem = cartItems.find(ci => ci.id === item.id.toString());
                              if (cartItem.quantity === 1) {
                                removeItem(item.id.toString());
                              } else {
                                updateQuantity(item.id.toString(), cartItem.quantity - 1);
                              }
                            }}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="flex-1 text-center font-semibold">
                            {cartItems.find(ci => ci.id === item.id.toString())?.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              const cartItem = cartItems.find(ci => ci.id === item.id.toString());
                              updateQuantity(item.id.toString(), cartItem.quantity + 1);
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={() => {
                            addItem({
                              id: item.id.toString(),
                              name: item.name,
                              price: parseFloat(item.price),
                              quantity: 1,
                            });
                            toast({
                              title: 'Added to cart',
                              description: `${item.name} added to your order`,
                            });
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Service Buttons */}
      <div className="fixed bottom-20 left-4 right-4 z-30">
        <div className="glass-strong rounded-full p-2 flex items-center justify-around max-w-md mx-auto w-[90%] sm:w-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleServiceRequest('water')}
            className="rounded-full"
          >
            <Droplets className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleServiceRequest('waiter')}
            className="rounded-full"
          >
            <User className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleServiceRequest('clear')}
            className="rounded-full"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsCartOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background z-50 shadow-2xl overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold font-display">Your Order</h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(false)}>
                    <X className="w-6 h-6" />
                  </Button>
                </div>

                {cartItems.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-4 glass rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-sm text-primary">₹{item.price.toFixed(2)} each</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => {
                                if (item.quantity === 1) {
                                  removeItem(item.id);
                                } else {
                                  updateQuantity(item.id, item.quantity - 1);
                                }
                              }}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">₹{total.toFixed(2)}</span>
                      </div>
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handlePlaceOrder}
                        disabled={isPlacingOrder}
                      >
                        {isPlacingOrder ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Placing Order...
                          </>
                        ) : (
                          `Place Order (${itemCount} items)`
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* AI Assistant */}
      <AnimatePresence>
        {isAssistantOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsAssistantOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 h-[70vh] bg-background z-50 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-bold font-display">AI Assistant</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsAssistantOpen(false)}
                  >
                    Browse Menu
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setIsAssistantOpen(false)}>
                    <X className="w-6 h-6" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-scroll p-4 space-y-3" style={{ minHeight: 0 }}>
                  {assistantMessages.map((msg, idx) => (
                    <div key={idx}>
                      <div
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'glass'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-line">{msg.text}</p>
                        </div>
                      </div>
                      
                      {/* Show recommendations if available */}
                      {msg.recommendations && msg.recommendations.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {msg.recommendations.map((item) => (
                            <div
                              key={item.id}
                              className="glass p-3 rounded-lg border border-primary/20"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-sm">{item.name}</h4>
                                    {item.isVeg && <span className="text-green-600">🥗</span>}
                                    {item.isSpicy && <span>🌶️</span>}
                                    {item.isPopular && <span>⭐</span>}
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {item.description}
                                  </p>
                                </div>
                                <span className="font-bold text-primary ml-2">₹{item.price.toFixed(2)}</span>
                              </div>
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  addItem(item);
                                  toast({
                                    title: '✅ Added to Cart',
                                    description: `${item.name} added successfully`,
                                  });
                                }}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add to Cart
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Show options as buttons */}
                      {msg.options && msg.options.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {msg.options.map((option, optIdx) => (
                            <Button
                              key={optIdx}
                              variant="outline"
                              size="sm"
                              onClick={() => handleOptionClick(option)}
                              className="rounded-full"
                            >
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Removed text input - fully option-based */}
                <div className="p-4 border-t text-center text-xs text-muted-foreground flex-shrink-0">
                  Click on any option above to continue
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer with Restaurant Info - At bottom of page, not fixed */}
      {restaurantInfo && (
        <footer className="border-t-2 border-primary/30 py-6 px-4 shadow-lg mt-8" style={{ backgroundColor: '#5B7C99' }}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
              <div className="text-center md:text-left">
                <p className="font-bold text-white text-lg mb-2">{restaurantInfo.name || 'Restaurant'}</p>
                {restaurantInfo.address && (
                  <p className="text-white/90 text-sm">
                    <span>📍</span> {restaurantInfo.address}
                  </p>
                )}
                {restaurantInfo.description && (
                  <p className="text-white/90 text-sm mt-2 max-w-md">
                    {restaurantInfo.description}
                  </p>
                )}
              </div>
              <div className="text-center md:text-right">
                {restaurantInfo.phone && (
                  <p className="text-white/90 text-sm mb-2 whitespace-nowrap">
                    <span>📞</span> {restaurantInfo.phone}
                  </p>
                )}
                {restaurantInfo.email && (
                  <p className="text-white/90 text-sm whitespace-nowrap">
                    <span>✉️</span> {restaurantInfo.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
