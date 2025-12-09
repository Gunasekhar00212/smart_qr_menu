import { motion } from 'framer-motion';
import { QrCode, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Hero() {
  return (
    <section className="bg-[#fbf9f6] text-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* Right column on desktop, top on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="order-first lg:order-last flex justify-center lg:justify-end"
          >
            <div className="max-w-xs w-full">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5">
                  {/* Top single menu item card */}
                  <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center text-2xl">🥗</div>
                      <div>
                        <div className="text-sm font-semibold">Caesar Salad</div>
                        <div className="text-sm text-gray-600 font-medium">$12.99</div>
                      </div>
                    </div>
                    <button aria-label="add" className="ml-4 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-orange-500 text-white shadow-sm">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Spacer to push assistant to bottom */}
                  <div className="h-36" />

                  {/* AI Assistant bubble at bottom */}
                  <div className="flex justify-start">
                    <div className="bg-orange-100 text-orange-900 rounded-2xl px-4 py-2 max-w-[18rem] shadow-sm">
                      <div className="text-xs font-medium mb-1">AI Assistant</div>
                      <div className="text-sm leading-snug">Looking for something spicy? Try our signature Thai curry 🌶️</div>
                    </div>
                  </div>
                </div>
                {/* subtle phone bezel */}
                <div className="bg-gradient-to-b from-transparent to-gray-50 h-6" />
              </div>
            </div>
          </motion.div>

          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <div className="inline-block px-3 py-1 rounded-full bg-orange-50 text-orange-600 mb-6 text-sm font-medium">
              AI-Powered Restaurant Platform
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-3 sm:mb-4">
              Transform Your Restaurant Experience
            </h1>

            <p className="text-gray-600 text-base sm:text-lg max-w-xl mb-6 sm:mb-8 mx-auto lg:mx-0">
              Smart QR menus, AI-powered ordering, and real-time management — all in one platform.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 justify-center lg:justify-start mb-4 sm:mb-6">
              <Link to="/signup" className="inline-flex items-center justify-center gap-3 px-4 sm:px-5 py-3 rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold shadow-sm text-sm sm:text-base">
                Get Started Free
              </Link>
              <Link to="/demo" className="inline-flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-gray-200 text-gray-700 bg-white text-sm sm:text-base">
                View Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
