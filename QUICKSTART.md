# 🚀 Quick Start Guide

## Get Your Restaurant Menu System Running in 5 Minutes!

### Step 1: Install Dependencies ⚡
```powershell
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Step 2: Setup PostgreSQL Database 🗄️

1. **Create Database**:
```sql
CREATE DATABASE smart_menu_db;
```

2. **Create `.env` file in `backend` folder**:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/smart_menu_db
PORT=5175
```
Replace `yourpassword` with your PostgreSQL password.

### Step 3: Initialize Database 🛠️
```powershell
npm run init-db
```

### Step 4: (Optional) Add Sample Menu Items 🍕
```powershell
npm run seed-db
```
This adds 23 sample items across categories: Starters, Main Course, Breads, Desserts, Beverages.

### Step 5: Start the Application 🎬

**Terminal 1 - Start Backend:**
```powershell
npm run dev:backend
```
✅ Backend running on http://localhost:5175

**Terminal 2 - Start Frontend:**
```powershell
npm run dev
```
✅ Frontend running on http://localhost:5173

### Step 6: Access Your Application 🌐

- **Admin Dashboard**: http://localhost:5173/login
  - Default credentials: Create an account via signup
  
- **Customer Menu (Demo)**: http://localhost:5173/demo
  - Try it without scanning QR code

- **Health Check**: http://localhost:5175/api/health
  - Check if backend is running

### Step 7: Create Your First Menu Item 📝

1. Go to http://localhost:5173/dashboard/menus
2. Click "Add Menu Item"
3. Fill in:
   - Name: "Margherita Pizza"
   - Description: "Fresh tomatoes and mozzarella"
   - Price: 299
   - Category: "Main Course"
   - Toggle: Vegetarian ✓
4. Click "Create Item"
5. ✅ Item appears in customer menu!

### Step 8: Generate QR Codes 📱

1. Go to http://localhost:5173/dashboard/qr
2. Enter table number (e.g., "1")
3. Click "Download QR Code"
4. Print and place on table
5. Customers scan → See menu → Order!

---

## Common Issues & Solutions 🔧

### ❌ "Database connection failed"
**Solution**: Check if PostgreSQL is running:
```powershell
# Windows - check service status
Get-Service postgresql*
```

### ❌ "Port 5175 already in use"
**Solution**: Change port in `backend/.env`:
```env
PORT=5176
```

### ❌ "Module not found"
**Solution**: Reinstall dependencies:
```powershell
npm install
cd backend && npm install
```

### ❌ "Cannot find module './pages/CustomerMenu.jsx'"
**Solution**: Make sure React Query provider is set up in `src/main.tsx`

---

## What's Next? 🎯

✅ **System is running!** Now you can:

1. **Customize Your Menu**
   - Add your own items via dashboard
   - Set prices in Indian Rupees (₹)
   - Mark items as veg, spicy, or popular

2. **Generate QR Codes**
   - Create QR for each table
   - Print and display
   - Test by scanning with your phone

3. **Test Customer Experience**
   - Scan QR or visit `/demo`
   - Browse menu
   - Add items to cart
   - Try AI assistant (click sparkle icon)

4. **Manage Orders**
   - View incoming orders at `/dashboard/orders`
   - Update order status
   - Track table-wise orders

5. **Optional: Enable AI Assistant**
```powershell
$env:OPENAI_API_KEY='sk-your-key-here'
npm run ai-server
```

---

## Project Structure 📁

```
smart-menu-ai/
├── backend/              ← Express + PostgreSQL
│   ├── server.js        ← Main API server
│   ├── init-db.js       ← Create tables
│   ├── seed-db.js       ← Sample data
│   └── routes/          ← API endpoints
├── src/                 ← React frontend
│   ├── pages/
│   │   ├── CustomerMenu.jsx     ← Customer-facing menu
│   │   ├── MenuManagement.jsx   ← Admin menu CRUD
│   │   └── QRGenerator.jsx      ← QR code generator
│   └── contexts/        ← Cart & Auth
└── server/
    └── ai-proxy.cjs     ← OpenAI assistant
```

---

## Need Help? 💬

1. Check `SETUP.md` for detailed documentation
2. Verify all services are running:
   - PostgreSQL database ✓
   - Backend server (port 5175) ✓
   - Frontend dev server (port 5173) ✓

3. Common commands:
```powershell
# Restart backend
cd backend
npm run dev

# Rebuild frontend
npm run build

# Reset database
npm run init-db
npm run seed-db
```

---

**🎉 Congratulations! Your restaurant menu system is ready to use!**
