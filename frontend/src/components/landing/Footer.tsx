import { Link } from 'react-router-dom';
import { ChefHat } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display">MenuAI</span>
          </Link>
          <p className="text-muted-foreground text-sm max-w-md mb-8">
            Transforming restaurant experiences with smart QR menus and AI-powered ordering.
          </p>
        </div>

        <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground w-full">
          <p>&copy; {new Date().getFullYear()} MenuAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
