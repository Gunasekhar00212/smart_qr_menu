import { useState, useEffect } from 'react';
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
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isVeg: boolean;
  isSpicy: boolean;
  isPopular: boolean;
  isOutOfStock: boolean;
  image: string;
}

const categories = ['All', 'Starters', 'Main Course', 'Desserts', 'Beverages'];

const mockItems: MenuItem[] = [
  { id: '1', name: 'Margherita Pizza', description: 'Fresh tomatoes, mozzarella, basil', price: 14.99, category: 'Main Course', isVeg: true, isSpicy: false, isPopular: true, isOutOfStock: false, image: '🍕' },
  { id: '2', name: 'Grilled Salmon', description: 'Atlantic salmon with herbs and lemon', price: 24.99, category: 'Main Course', isVeg: false, isSpicy: false, isPopular: true, isOutOfStock: false, image: '🐟' },
  { id: '3', name: 'Caesar Salad', description: 'Crisp romaine, parmesan, croutons', price: 12.99, category: 'Starters', isVeg: true, isSpicy: false, isPopular: false, isOutOfStock: false, image: '🥗' },
  { id: '4', name: 'Spicy Thai Curry', description: 'Authentic Thai red curry with vegetables', price: 16.99, category: 'Main Course', isVeg: true, isSpicy: true, isPopular: true, isOutOfStock: false, image: '🍛' },
  { id: '5', name: 'Beef Burger', description: 'Angus beef, cheddar, special sauce', price: 15.99, category: 'Main Course', isVeg: false, isSpicy: false, isPopular: false, isOutOfStock: true, image: '🍔' },
  { id: '6', name: 'Tiramisu', description: 'Classic Italian coffee dessert', price: 8.99, category: 'Desserts', isVeg: true, isSpicy: false, isPopular: true, isOutOfStock: false, image: '🍰' },
  { id: '7', name: 'Spring Rolls', description: 'Crispy vegetable spring rolls', price: 7.99, category: 'Starters', isVeg: true, isSpicy: false, isPopular: false, isOutOfStock: false, image: '🥟' },
  { id: '8', name: 'Mango Smoothie', description: 'Fresh mango with yogurt', price: 5.99, category: 'Beverages', isVeg: true, isSpicy: false, isPopular: false, isOutOfStock: false, image: '🥤' },
];

export default function CustomerMenu() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showVegOnly, setShowVegOnly] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const { items: cartItems, addItem, removeItem, updateQuantity, total, itemCount } = useCart();
  const { toast } = useToast();

  // --- Simple on-device AI assistant state & logic ---
  const [assistantMessages, setAssistantMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: "Hi — I'm your AI assistant. Ask me for recommendations or say 'something spicy'" },
  ]);
  const [assistantInput, setAssistantInput] = useState('');

  // Try to detect a tableId param (QR flow) and auto-open assistant when present
  const { tableId } = ((): { tableId?: string } => {
    try {
      // dynamic require so this file works everywhere
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
      const rr = require('react-router-dom');
      return rr.useParams();
    } catch (e) {
      return {} as any;
    }
  })();

  useEffect(() => {
    if (tableId) {
      const t = setTimeout(() => setIsAssistantOpen(true), 600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [tableId]);

  function assistantReplyFor(query: string) {
    const q = query.toLowerCase();
    if (q.includes('spicy')) {
      const spicy = mockItems.filter((i) => i.isSpicy).map((i) => i.name).slice(0, 5);
      if (spicy.length) return `Looking for spicy dishes? Try: ${spicy.join(', ')}.`;
      return "I couldn't find spicy items right now — try 'popular' or 'veg'.";
    }
    if (q.includes('veg') || q.includes('vegetarian')) {
      const veg = mockItems.filter((i) => i.isVeg).map((i) => i.name).slice(0, 6);
      return `Vegetarian picks: ${veg.join(', ')}.`;
    }
    if (q.includes('popular') || q.includes('best')) {
      const pop = mockItems.filter((i) => i.isPopular).map((i) => i.name).slice(0, 6);
      return `Our popular items: ${pop.join(', ')}.`;
    }
    if (q.includes('recommend') || q.includes('suggest')) {
      const rec = [mockItems[0], mockItems[2], mockItems[5]].filter(Boolean).map((i) => i.name);
      return `You might like: ${rec.join(', ')}.`;
    }
    if (q.includes('cart') || q.includes('my order') || q.includes('what did i')) {
      if (cartItems.length === 0) return 'Your cart is empty right now.';
      const names = cartItems.map((c) => `${c.quantity}× ${c.name}`);
      return `You have: ${names.join(', ')}. Total ₹${total.toFixed(2)}.`;
    }
    return "Sorry, I didn't get that. Try 'something spicy', 'vegetarian', or 'what's popular' — or ask about your cart.";
  }

  function sendAssistantQuery(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setAssistantMessages((m) => [...m, { role: 'user', text: trimmed }]);
    // Try server-side AI first (if running), fall back to local rule-based assistant
    (async () => {
      try {
        const aiEndpoint = process.env.NODE_ENV === 'development' ? 'http://localhost:5174/api/ai' : '/api/ai';
        const r = await fetch(aiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: trimmed }),
        });
        if (r.ok) {
          const data = await r.json();
          if (data.reply) {
            setAssistantMessages((m) => [...m, { role: 'assistant', text: data.reply }]);
            return;
          }
        }
      } catch (e) {
        // ignore and fallback
      }

      // fallback
      setTimeout(() => {
        const reply = assistantReplyFor(trimmed);
        setAssistantMessages((m) => [...m, { role: 'assistant', text: reply }]);
      }, 400);
    })();
  }
  // --- end assistant logic ---

  const filteredItems = mockItems.filter((item) => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (showVegOnly && !item.isVeg) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleServiceRequest = (type: 'water' | 'waiter' | 'clear') => {
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

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-strong border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold font-display">Cafe Luna</h1>
              <p className="text-sm text-muted-foreground">Table 5 • Floor 1 Menu</p>
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

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto scrollbar-hide pb-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="whitespace-nowrap"
              >
                {cat}
              </Button>
            ))}
            <Button
              variant={showVegOnly ? 'success' : 'secondary'}
              size="sm"
              onClick={() => setShowVegOnly(!showVegOnly)}
              className="whitespace-nowrap"
            >
              <Leaf className="w-4 h-4" />
              Veg Only
            </Button>
          </div>
        </div>
      </header>

      {/* Menu Items */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-4">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-2xl bg-card border border-border ${
                item.isOutOfStock ? 'opacity-60' : ''
              }`}
            >
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-xl bg-secondary flex items-center justify-center text-4xl shrink-0">
                  {item.image}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{item.name}</h3>
                        {item.isVeg && (
                          <span className="w-4 h-4 rounded border-2 border-success flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-success" />
                          </span>
                        )}
                        {!item.isVeg && (
                          <span className="w-4 h-4 rounded border-2 border-destructive flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-destructive" />
                          </span>
                        )}
                        {item.isSpicy && <Flame className="w-4 h-4 text-destructive" />}
                        {item.isPopular && (
                          <Badge className="bg-primary/20 text-primary">
                            <Star className="w-3 h-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-primary">₹{item.price}</span>
                    {item.isOutOfStock ? (
                      <Badge variant="destructive">Out of Stock</Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          addItem({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                          });
                          toast({
                            title: 'Added to cart!',
                            description: `${item.name} has been added.`,
                          });
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Service Buttons */}
      <div className="fixed bottom-20 left-0 right-0 px-4">
        <div className="container mx-auto flex justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="glass"
            onClick={() => handleServiceRequest('water')}
          >
            <Droplets className="w-4 h-4" />
            Water
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="glass"
            onClick={() => handleServiceRequest('waiter')}
          >
            <User className="w-4 h-4" />
            Waiter
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="glass"
            onClick={() => handleServiceRequest('clear')}
          >
            <Trash2 className="w-4 h-4" />
            Clear Table
          </Button>
        </div>
      </div>

      {/* Cart Footer */}
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border"
        >
          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingCart className="w-5 h-5" />
            View Cart ({itemCount} items) • ₹{total.toFixed(2)}
          </Button>
        </motion.div>
      )}

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
              onClick={() => setIsCartOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 flex flex-col"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-bold font-display">Your Cart</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl bg-secondary">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-primary font-bold">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {cartItems.length > 0 && (
                <div className="p-4 border-t border-border space-y-4">
                  <div className="flex justify-between text-lg">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-bold">₹{total.toFixed(2)}</span>
                  </div>
                  <Button variant="hero" size="lg" className="w-full">
                    Place Order • ₹{total.toFixed(2)}
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* AI Assistant Drawer */}
      <AnimatePresence>
        {isAssistantOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
              onClick={() => setIsAssistantOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed left-0 right-0 bottom-0 h-[80vh] bg-card border-t border-border rounded-t-3xl z-50 flex flex-col"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="font-bold">AI Menu Assistant</h2>
                    <p className="text-xs text-muted-foreground">Ask me anything about our menu!</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsAssistantOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* AI Messages (conversation) */}
                <div className="space-y-3">
                  {assistantMessages.map((m, idx) => (
                    m.role === 'assistant' ? (
                      <div key={idx} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="p-3 rounded-2xl rounded-tl-none bg-secondary text-sm">{m.text}</div>
                        </div>
                      </div>
                    ) : (
                      <div key={idx} className="flex justify-end">
                        <div className="p-3 rounded-2xl rounded-tr-none bg-primary text-primary-foreground text-sm max-w-[70%]">{m.text}</div>
                      </div>
                    )
                  ))}

                  <div className="flex flex-wrap gap-2 mt-3">
                    {['Suggest something spicy', 'Vegetarian options', "What's popular?"].map((suggestion) => (
                      <Button key={suggestion} variant="outline" size="sm" onClick={() => sendAssistantQuery(suggestion)}>
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-border">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendAssistantQuery(assistantInput);
                    setAssistantInput('');
                  }}
                  className="flex gap-2"
                >
                  <Input
                    placeholder="Ask me anything..."
                    className="flex-1"
                    value={assistantInput}
                    onChange={(e) => setAssistantInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        (e.target as HTMLFormElement).dispatchEvent(new Event('submit', { cancelable: true }));
                      }
                    }}
                  />
                  <Button
                    variant="hero"
                    size="icon"
                    onClick={() => {
                      sendAssistantQuery(assistantInput);
                      setAssistantInput('');
                    }}
                  >
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
