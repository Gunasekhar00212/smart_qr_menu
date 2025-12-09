import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChefHat, Mail, Lock, User, Eye, EyeOff, ArrowRight, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function Signup() {
  const [name, setName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signup, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signup(email, password, name);
      toast({
        title: 'Account created!',
        description: 'Welcome to MenuAI. Let\'s set up your restaurant.',
      });
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col-reverse lg:flex-row">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex flex-1 gradient-primary items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center text-primary-foreground max-w-md"
        >
          <div className="w-24 h-24 rounded-3xl bg-primary-foreground/20 backdrop-blur flex items-center justify-center mx-auto mb-8">
            <ChefHat className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold font-display mb-4">
            Start Your Digital Journey
          </h2>
          <p className="text-primary-foreground/80 mb-8">
            Join hundreds of restaurants using MenuAI to create memorable dining experiences.
          </p>
          <div className="flex justify-center gap-4">
            {['🍕', '🍔', '🍣', '🥗'].map((emoji, i) => (
              <motion.div
                key={emoji}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center text-2xl"
              >
                {emoji}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-auto"
        >
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display">MenuAI</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold font-display mb-2">Create your account</h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
            Get started with MenuAI in minutes
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="restaurant">Restaurant Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="restaurant"
                    type="text"
                    placeholder="Cafe Luna"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
            </div>

            <div className="flex items-start gap-2">
              <input type="checkbox" id="terms" className="rounded border-input mt-1" required />
              <label htmlFor="terms" className="text-sm text-muted-foreground">
                I agree to the{' '}
                <a href="#" className="text-primary hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-primary hover:underline">Privacy Policy</a>
              </label>
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </form>

          <p className="mt-8 text-center text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
