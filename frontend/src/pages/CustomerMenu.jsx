import { useState, useEffect } from 'react';
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

const API_BASE_URL = 'http://localhost:5000/api';
const RESTAURANT_ID = 'fd64a3b7-4c88-4a5d-b53f-a18ef35bcfe4'; // Default restaurant

const categories = ['All', 'Starters', 'Main Course', 'Desserts', 'Beverages', 'Breads'];

// Fetch menu items from backend
async function fetchMenuItems(restaurantId) {
  const response = await fetch(`${API_BASE_URL}/menu?restaurantId=${restaurantId}`);
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

  // Fetch menu items with React Query
  const { data: menuItems = [], isLoading, isError, error } = useQuery({
    queryKey: ['menu-items', RESTAURANT_ID],
    queryFn: () => fetchMenuItems(RESTAURANT_ID),
  });

  // AI Assistant state
  const [assistantMessages, setAssistantMessages] = useState([
    { role: 'assistant', text: "Hi — I'm your AI assistant. Ask me for recommendations or say 'something spicy'" },
  ]);
  const [assistantInput, setAssistantInput] = useState('');

  // Auto-open assistant when tableId is present (QR flow)
  useEffect(() => {
    if (tableId) {
      const timer = setTimeout(() => setIsAssistantOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, [tableId]);

  function assistantReplyFor(query) {
    const q = query.toLowerCase();
    if (q.includes('spicy')) {
      const spicy = menuItems.filter(i => i.isSpicy).map(i => i.name).slice(0, 5);
      if (spicy.length) return `Looking for spicy dishes? Try: ${spicy.join(', ')}.`;
      return "I couldn't find spicy items right now — try 'popular' or 'veg'.";
    }
    if (q.includes('veg') || q.includes('vegetarian')) {
      const veg = menuItems.filter(i => i.isVeg).map(i => i.name).slice(0, 6);
      return `Vegetarian picks: ${veg.join(', ')}.`;
    }
    if (q.includes('popular') || q.includes('best')) {
      const pop = menuItems.filter(i => i.isPopular).map(i => i.name).slice(0, 6);
      return `Our popular items: ${pop.join(', ')}.`;
    }
    if (q.includes('recommend') || q.includes('suggest')) {
      const rec = menuItems.slice(0, 3).map(i => i.name);
      return `You might like: ${rec.join(', ')}.`;
    }
    if (q.includes('cart') || q.includes('my order') || q.includes('what did i')) {
      if (cartItems.length === 0) return 'Your cart is empty right now.';
      const names = cartItems.map(c => `${c.quantity}× ${c.name}`);
      return `You have: ${names.join(', ')}. Total ₹${total.toFixed(2)}.`;
    }
    return "Sorry, I didn't get that. Try 'something spicy', 'vegetarian', or 'what's popular' — or ask about your cart.";
  }

  async function sendAssistantQuery(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    
    setAssistantMessages(m => [...m, { role: 'user', text: trimmed }]);
    setAssistantInput('');

    // Try server-side AI first, fall back to local rules
    try {
      const response = await fetch('http://localhost:5174/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.reply) {
          setAssistantMessages(m => [...m, { role: 'assistant', text: data.reply }]);
          return;
        }
      }
    } catch (e) {
      // Fallback to local assistant
    }

    // Local fallback
    setTimeout(() => {
      const reply = assistantReplyFor(trimmed);
      setAssistantMessages(m => [...m, { role: 'assistant', text: reply }]);
    }, 400);
  }

  // Filter menu items
  const filteredItems = menuItems.filter(item => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (showVegOnly && !item.isVeg) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleServiceRequest = (type) => {
    const messages = {
      water: 'Water request sent to staff',
      waiter: 'Waiter has been notified',
      clear: 'Table clearing request sent',
    };
    toast({
      title: 'Request Sent!',
      description: messages[type],
    });
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

      const response = await fetch(`${API_BASE_URL}/orders`, {
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
        description: `Order #${result.order.id.substring(0, 8)} has been sent to the kitchen`,
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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-strong border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold font-display">MenuAI Restaurant</h1>
              <p className="text-sm text-muted-foreground">
                {tableId ? `Table ${tableId}` : 'Browse Menu'}
              </p>
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
      <div className="container mx-auto px-4 py-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items found</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="glass-strong rounded-full p-2 flex items-center justify-around max-w-md mx-auto">
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
              className="fixed bottom-0 left-0 right-0 max-h-[80vh] bg-background z-50 rounded-t-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 flex flex-col h-full max-h-[80vh]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold font-display">AI Assistant</h2>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsAssistantOpen(false)}>
                    <X className="w-6 h-6" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                  {assistantMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'glass'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Ask me anything..."
                    value={assistantInput}
                    onChange={(e) => setAssistantInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        sendAssistantQuery(assistantInput);
                      }
                    }}
                  />
                  <Button onClick={() => sendAssistantQuery(assistantInput)}>
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
