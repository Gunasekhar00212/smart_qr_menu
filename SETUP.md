# Smart Menu AI - Dynamic Restaurant QR Menu System

A complete full-stack restaurant menu and ordering system with QR code functionality, built with React (frontend) and Express + PostgreSQL (backend).

## 🚀 Features

- **Dynamic Menu Management**: Create, update, and delete menu items with real-time database sync
- **QR Code Generation**: Generate unique QR codes for each table
- **Customer Ordering**: Customers scan QR codes to view menu and place orders
- **AI Assistant**: OpenAI-powered assistant to help customers with recommendations
- **Order Management**: Track and manage customer orders in real-time
- **Analytics Dashboard**: View sales, popular items, and performance metrics
- **Multi-language Support**: i18n ready
- **Responsive Design**: Works on all devices

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

## 🛠️ Setup Instructions

### 1. Clone and Install

```powershell
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Database Setup

1. **Create PostgreSQL Database**:
```sql
CREATE DATABASE smart_menu_db;
```

2. **Configure Environment Variables**:
Create a `.env` file in the `backend` folder:

```env
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/smart_menu_db
PORT=5175
```

Replace `your_username` and `your_password` with your PostgreSQL credentials.

3. **Initialize Database Tables**:
```powershell
npm run init-db
```

This will automatically create all required tables:
- `restaurants` - Store restaurant information
- `menu_items` - Menu items with categories and pricing
- `orders` - Customer orders
- `order_items` - Individual items in each order

### 3. Start the Application

#### Start Backend Server (Terminal 1):
```powershell
npm run dev:backend
```
Backend will run on `http://localhost:5175`

#### Start Frontend (Terminal 2):
```powershell
npm run dev
```
Frontend will run on `http://localhost:5173` (or next available port)

#### Optional: Start AI Assistant Server (Terminal 3):
```powershell
# Set OpenAI API key
$env:OPENAI_API_KEY='your-openai-api-key-here'

# Start AI server
npm run ai-server
```
AI server will run on `http://localhost:5174`

## 📁 Project Structure

```
smart-menu-ai/
├── backend/                  # Express.js backend
│   ├── server.js            # Main server file
│   ├── db.js                # PostgreSQL connection
│   ├── init-db.js           # Database initialization script
│   └── routes/
│       ├── menu.js          # Menu CRUD endpoints
│       └── orders.js        # Order management endpoints
├── src/                     # React frontend
│   ├── pages/
│   │   ├── CustomerMenu.jsx # Customer-facing menu (React Query)
│   │   ├── MenuManagement.jsx # Admin menu management
│   │   ├── QRGenerator.jsx  # QR code generation
│   │   └── ...
│   ├── components/          # Reusable components
│   └── contexts/            # React contexts (Auth, Cart)
└── server/
    └── ai-proxy.cjs         # OpenAI proxy server
```

## 🔌 API Endpoints

### Menu Endpoints
- `GET /api/menu?restaurantId=1` - Get all menu items
- `POST /api/menu` - Create new menu item
- `PUT /api/menu/:id` - Update menu item
- `DELETE /api/menu/:id` - Delete menu item

### Order Endpoints
- `GET /api/orders?restaurantId=1` - Get all orders
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/status` - Update order status

### Health Check
- `GET /api/health` - Check server status

## 💻 Usage

### For Restaurant Owners:

1. **Login** to the dashboard at `http://localhost:5173/login`
2. **Add Menu Items**:
   - Go to "Menu Lists" 
   - Click "Add Menu Item"
   - Fill in details (name, price, category, etc.)
   - Save
3. **Generate QR Codes**:
   - Go to "QR Generator"
   - Enter table number
   - Download QR code
   - Print and place on tables
4. **Manage Orders**:
   - Go to "Orders" to view incoming orders
   - Update order status as you prepare items

### For Customers:

1. **Scan QR Code** on the table
2. **Browse Menu** - Filter by category, search, vegetarian options
3. **Add Items to Cart**
4. **Place Order** - Orders go directly to the restaurant dashboard
5. **Use AI Assistant** - Click sparkle icon for recommendations

## 🎨 Customization

### Change Restaurant Name
Edit `backend/init-db.js`:
```javascript
INSERT INTO restaurants (name, slug) 
VALUES ('Your Restaurant Name', 'your-restaurant-slug')
```

### Add Sample Menu Items
After `npm run init-db`, you can add items via the admin dashboard or directly insert SQL:
```sql
INSERT INTO menu_items (restaurant_id, name, description, price, category, is_veg, is_spicy, is_popular, image)
VALUES (1, 'Margherita Pizza', 'Fresh tomatoes and mozzarella', 299.00, 'Main Course', true, false, true, '🍕');
```

### Modify Categories
Update the `categories` array in `src/pages/CustomerMenu.jsx`:
```javascript
const categories = ['All', 'Starters', 'Main Course', 'Desserts', 'Beverages'];
```

## 🔒 Security Notes

**Important**: 
- Never commit `.env` files to version control
- The OpenAI API key exposed in previous conversations should be rotated
- Use environment variables for all sensitive data
- In production, use HTTPS and secure database connections
- Implement proper authentication and authorization

## 🐛 Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED ::1:5432
```
**Solution**: Ensure PostgreSQL is running and credentials in `.env` are correct

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5175
```
**Solution**: Change the PORT in `backend/.env` or kill the process using that port

### Module Not Found
```
Error: Cannot find module 'express'
```
**Solution**: Run `npm install` in the backend folder

### QR Code Not Working
**Solution**: Make sure the frontend URL in `QRGenerator.jsx` matches your deployment URL

## 📦 Available Scripts

### Frontend
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend
- `npm run init-db` - Initialize database tables
- `npm run start:backend` - Start backend server (production)
- `npm run dev:backend` - Start backend with nodemon (development)

### AI Assistant
- `npm run ai-server` - Start OpenAI proxy server

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Build: `npm run build`
2. Deploy `dist` folder
3. Update QR code base URL to production domain

### Backend (Heroku/Railway/DigitalOcean)
1. Set environment variables
2. Run `npm run init-db` on production database
3. Start with `npm run start:backend`

### Database (Heroku Postgres/AWS RDS)
1. Create PostgreSQL instance
2. Update `DATABASE_URL` in production environment
3. Run migrations

## 📄 License

MIT License - feel free to use for your restaurant!

## 🤝 Support

For issues or questions:
1. Check troubleshooting section
2. Verify all environment variables are set
3. Ensure PostgreSQL is running
4. Check backend and frontend are both running

---

**Built with ❤️ for restaurants worldwide**
