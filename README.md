# 🍽️ Smart Menu AI - Dynamic Restaurant QR Menu System

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-4.18.2-green.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A complete full-stack restaurant menu and ordering system with QR code functionality. Transform your restaurant operations with real-time menu management, QR code ordering, and AI-powered customer assistance.

## ✨ Features

- 🍕 **Dynamic Menu Management** - Create, update, delete menu items with real-time sync
- 📱 **QR Code Ordering** - Generate unique QR codes for each table
- 🤖 **AI Assistant** - OpenAI-powered recommendations for customers
- 📊 **Order Tracking** - Real-time order management and status updates
- 💰 **Indian Rupee Support** - Full ₹ currency integration
- 🌐 **Multi-language Ready** - i18n support built-in
- 📱 **Responsive Design** - Works seamlessly on all devices
- ⚡ **Real-time Updates** - React Query for instant UI synchronization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

```bash
# 1. Install dependencies
npm install
cd backend && npm install && cd ..

# 2. Setup database
createdb smart_menu_db

# 3. Configure environment
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# 4. Initialize database
npm run init-db

# 5. (Optional) Add sample data
npm run seed-db

# 6. Start servers
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev
```

Visit **http://localhost:5173** to see your app!

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get running in 5 minutes
- **[SETUP.md](SETUP.md)** - Comprehensive setup guide
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and diagrams
- **[TESTING.md](TESTING.md)** - Testing guide and test cases
- **[CHECKLIST.md](CHECKLIST.md)** - Implementation checklist
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Complete feature list

## 🏗️ Project Structure

```
smart-menu-ai/
├── backend/                    # Express.js backend
│   ├── server.js              # Main API server
│   ├── db.js                  # PostgreSQL connection
│   ├── init-db.js             # Database initialization
│   ├── seed-db.js             # Sample data seeder
│   └── routes/
│       ├── menu.js            # Menu CRUD endpoints
│       └── orders.js          # Order management
├── src/                       # React frontend
│   ├── pages/
│   │   ├── CustomerMenu.jsx   # Customer-facing menu
│   │   ├── MenuManagement.jsx # Admin menu management
│   │   ├── QRGenerator.jsx    # QR code generator
│   │   └── ...
│   ├── components/            # Reusable components
│   └── contexts/              # React contexts
└── server/
    └── ai-proxy.cjs           # OpenAI assistant proxy
```

## 🎯 Key Technologies

- **Frontend**: React 18, React Query, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, PostgreSQL, Node.js 18+
- **QR Codes**: qrcode.react
- **AI**: OpenAI API (optional)
- **State**: React Query + Context API

## 📖 Usage Guide

### For Restaurant Owners

1. **Manage Menu**
   - Go to `/dashboard/menus`
   - Add, edit, or remove items
   - Set prices, categories, veg/spicy flags

2. **Generate QR Codes**
   - Go to `/dashboard/qr`
   - Enter table number
   - Download and print QR code

3. **Track Orders**
   - Go to `/dashboard/orders`
   - View incoming orders
   - Update order status

### For Customers

1. **Scan QR code** on table
2. **Browse menu** - filter by category, search
3. **Add to cart** - select items and quantities
4. **Place order** - submit to restaurant
5. **Get AI help** - click sparkle icon for recommendations

## 🔌 API Endpoints

### Menu
- `GET /api/menu?restaurantId=1` - Get all menu items
- `POST /api/menu` - Create menu item
- `PUT /api/menu/:id` - Update menu item
- `DELETE /api/menu/:id` - Delete menu item

### Orders
- `GET /api/orders?restaurantId=1` - Get all orders
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/status` - Update order status

## 🛠️ Available Scripts

```bash
# Frontend
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Backend
npm run init-db          # Initialize database tables
npm run seed-db          # Add sample menu items
npm run dev:backend      # Start backend with nodemon
npm run start:backend    # Start backend (production)

# AI Assistant (optional)
npm run ai-server        # Start OpenAI proxy
```

## 🎨 Customization

### Change Restaurant Name
Edit `backend/init-db.js`:
```javascript
INSERT INTO restaurants (name, slug) 
VALUES ('Your Restaurant', 'your-slug')
```

### Modify Menu Categories
Edit `src/pages/CustomerMenu.jsx`:
```javascript
const categories = ['All', 'Starters', 'Mains', 'Desserts', 'Drinks'];
```

### Add Custom Branding
- Update `src/components/dashboard/DashboardLayout.tsx`
- Modify colors in `src/index.css`
- Replace logo in header

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy dist/ folder
```

### Backend (Railway/Heroku)
```bash
# Set environment variables
DATABASE_URL=your_postgres_url
PORT=5175

# Deploy
git push heroku main
```

### Database (Managed PostgreSQL)
- Heroku Postgres
- AWS RDS
- Supabase
- DigitalOcean Managed Databases

## 🔒 Security

- ✅ Parameterized SQL queries (SQL injection protected)
- ✅ Environment variables for secrets
- ✅ CORS configuration
- ⚠️ Add authentication before production
- ⚠️ Enable HTTPS
- ⚠️ Implement rate limiting

## 🐛 Troubleshooting

**Database connection error?**
- Check PostgreSQL is running
- Verify DATABASE_URL in `.env`

**Port already in use?**
- Change PORT in `backend/.env`
- Kill process: `taskkill /PID <pid> /F`

**Module not found?**
- Run `npm install` in both root and backend

See [TESTING.md](TESTING.md) for more solutions.

## 📄 License

MIT License - See [LICENSE](LICENSE) file

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 💬 Support

- Check documentation files
- Review test cases
- Verify environment setup
- Check backend and frontend logs

## 🌟 Features Roadmap

- [ ] Table reservation system
- [ ] Real-time order notifications
- [ ] Payment gateway integration
- [ ] Multi-restaurant support
- [ ] Customer review system
- [ ] Inventory management
- [ ] Staff management
- [ ] Advanced analytics

---

**Built with ❤️ for restaurants worldwide**

*Transform your restaurant operations with Smart Menu AI*

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
