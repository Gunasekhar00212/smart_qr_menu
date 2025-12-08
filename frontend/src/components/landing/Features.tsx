import { motion } from 'framer-motion';
import { 
  QrCode, 
  Sparkles, 
  LayoutDashboard, 
  Bell, 
  Globe, 
  Shield,
  Smartphone,
  ChartBar,
  MessageSquare
} from 'lucide-react';

const features = [
  {
    icon: QrCode,
    title: 'Smart QR Menus',
    description: 'Generate unique QR codes for each table. Customers scan to view menus instantly on their devices.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: Sparkles,
    title: 'AI Menu Assistant',
    description: 'Intelligent chatbot recommends dishes based on preferences, dietary restrictions, and popularity.',
    color: 'bg-accent/10 text-accent',
  },
  {
    icon: LayoutDashboard,
    title: 'Real-time Dashboard',
    description: 'Monitor orders, table status, and restaurant analytics all in one intuitive dashboard.',
    color: 'bg-info/10 text-info',
  },
  {
    icon: Bell,
    title: 'Instant Notifications',
    description: 'Waiters receive real-time alerts for orders, water requests, and table assistance.',
    color: 'bg-warning/10 text-warning',
  },
  {
    icon: Globe,
    title: 'Multi-language Support',
    description: 'Menus automatically translate to customer\'s preferred language for global accessibility.',
    color: 'bg-success/10 text-success',
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security with device locking, GPS validation, and fraud prevention.',
    color: 'bg-destructive/10 text-destructive',
  },
  {
    icon: Smartphone,
    title: 'Mobile-First Design',
    description: 'Optimized for all devices with PWA support for offline menu browsing.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: ChartBar,
    title: 'Analytics & Insights',
    description: 'Track popular items, peak hours, and customer feedback to optimize your business.',
    color: 'bg-accent/10 text-accent',
  },
  {
    icon: MessageSquare,
    title: 'Customer Feedback',
    description: 'Collect ratings, reviews, and photos to continuously improve customer satisfaction.',
    color: 'bg-info/10 text-info',
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display mb-4">
            Everything You Need to <span className="text-gradient">Digitize</span> Your Restaurant
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A complete suite of tools designed to streamline operations, enhance customer experience, and boost revenue.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
