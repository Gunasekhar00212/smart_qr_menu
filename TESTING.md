# 🧪 Testing Your Restaurant Menu System

## Prerequisites Check ✅

Before testing, ensure you have:
- [ ] PostgreSQL installed and running
- [ ] Node.js 18+ installed
- [ ] All dependencies installed (`npm install` in both root and backend)

---

## Step-by-Step Testing Guide

### 1. Database Setup 🗄️

```powershell
# Connect to PostgreSQL (adjust for your setup)
psql -U postgres

# Create database
CREATE DATABASE smart_menu_db;
\q
```

### 2. Environment Configuration ⚙️

Create `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/smart_menu_db
PORT=5175
NODE_ENV=development
```

### 3. Initialize Database 🛠️

```powershell
# Create tables
npm run init-db

# Expected output:
# ✅ Created/verified table: restaurants
# ✅ Created/verified table: menu_items
# ✅ Created/verified table: orders
# ✅ Created/verified table: order_items
# ✅ Inserted default restaurant
# 🎉 Database initialization completed successfully!
```

### 4. Add Sample Data (Optional) 🍕

```powershell
npm run seed-db

# Expected output:
# ✅ Added: Masala Papad
# ✅ Added: Paneer Tikka
# ... (23 items total)
# 🎉 Successfully seeded 23 menu items!
```

### 5. Start Backend Server 🚀

```powershell
# Terminal 1
npm run dev:backend

# Expected output:
# ✅ Connected to PostgreSQL database
# 🚀 Smart Menu AI Backend Server
# 📍 Running on http://localhost:5175
# 🏥 Health check: http://localhost:5175/api/health
```

**Test Backend**:
Open browser → http://localhost:5175/api/health
```json
{"status":"OK","message":"Smart Menu AI Backend is running!"}
```

### 6. Start Frontend 🎨

```powershell
# Terminal 2
npm run dev

# Expected output:
# VITE vX.X.X ready in XXX ms
# ➜ Local:   http://localhost:5173/
```

---

## 🧪 Test Cases

### Test 1: View Menu Items (Customer)
1. Go to: http://localhost:5173/demo
2. **Expected**: Menu loads with items from database
3. **Verify**:
   - Items display with names, prices, descriptions
   - Category filter buttons work
   - Search functionality works
   - Veg filter works
   - No "Loading..." or errors

### Test 2: Admin Menu Management
1. Go to: http://localhost:5173/dashboard/menus
2. Click "Add Menu Item"
3. Fill form:
   - Name: "Test Burger"
   - Description: "Test item"
   - Price: 199
   - Category: "Main Course"
   - Toggle Vegetarian ON
4. Click "Create Item"
5. **Expected**: 
   - Item appears in the list
   - Customer menu also shows it immediately
   - No errors in console

### Test 3: Edit Menu Item
1. In Menu Management, click "Edit" on any item
2. Change price to 299
3. Click "Update Item"
4. **Expected**:
   - Price updates in admin view
   - Price updates in customer menu
   - Success toast appears

### Test 4: Delete Menu Item
1. Click delete button (trash icon)
2. Confirm deletion
3. **Expected**:
   - Item removed from list
   - Success toast appears
   - Item gone from customer menu

### Test 5: QR Code Generation
1. Go to: http://localhost:5173/dashboard/qr
2. Enter table number: "5"
3. **Expected**:
   - QR code displays
   - URL shows: http://localhost:5173/menu/5
4. Click "Copy URL"
   - Toast: "Copied!"
5. Click "Download QR Code"
   - PNG file downloads

### Test 6: Customer Flow via QR
1. Open: http://localhost:5173/menu/1
2. **Expected**:
   - Menu loads
   - "Table 1" displays in header
   - AI assistant auto-opens after 600ms
3. Add item to cart
4. Open cart (cart icon)
   - Items show with quantities
   - Total calculates correctly

### Test 7: Search & Filter
1. Go to customer menu
2. Type "paneer" in search
   - Only paneer items show
3. Click "Veg Only" filter
   - Non-veg items hide
4. Select "Desserts" category
   - Only desserts show

### Test 8: AI Assistant
1. Click sparkle icon (✨)
2. Type: "something spicy"
3. **Expected**: 
   - Lists spicy items
4. Type: "what's in my cart"
   - Shows cart contents

### Test 9: API Direct Tests

**Get Menu Items:**
```powershell
curl http://localhost:5175/api/menu?restaurantId=1
```
Expected: JSON array of menu items

**Create Item:**
```powershell
$body = @{
  restaurantId = 1
  name = "API Test Item"
  price = 99.99
  category = "Test"
  isVeg = $true
} | ConvertTo-Json

Invoke-RestMethod -Method POST -Uri "http://localhost:5175/api/menu" -Body $body -ContentType "application/json"
```

**Create Order:**
```powershell
$order = @{
  restaurantId = 1
  tableNumber = "10"
  items = @(
    @{ itemId = 1; quantity = 2 }
  )
} | ConvertTo-Json

Invoke-RestMethod -Method POST -Uri "http://localhost:5175/api/orders" -Body $order -ContentType "application/json"
```

### Test 10: Error Handling

**Backend Down Test:**
1. Stop backend server (Ctrl+C)
2. Reload customer menu
3. **Expected**: Error message "Failed to load menu"

**Invalid Data Test:**
1. Try to create item without name
2. **Expected**: Validation error

**Database Connection Test:**
1. Stop PostgreSQL
2. Try to fetch menu
3. **Expected**: Backend logs connection error

---

## 🐛 Common Issues & Solutions

### Issue: "Module not found"
```
Error: Cannot find module 'express'
```
**Fix**: 
```powershell
cd backend
npm install
```

### Issue: "Database connection failed"
```
Error: connect ECONNREFUSED
```
**Fix**: 
1. Check PostgreSQL is running
2. Verify DATABASE_URL in `.env`
3. Test connection:
```powershell
psql -U postgres -d smart_menu_db
```

### Issue: "Port already in use"
```
Error: EADDRINUSE :::5175
```
**Fix**:
```powershell
# Find process
netstat -ano | findstr :5175

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or change port in backend/.env
PORT=5176
```

### Issue: Menu items not showing
**Fix**:
1. Check backend is running
2. Open browser console (F12) - look for errors
3. Verify API call: http://localhost:5175/api/menu?restaurantId=1
4. Check database has data:
```sql
SELECT COUNT(*) FROM menu_items;
```

### Issue: QR code not scanning
**Fix**:
1. Ensure production URL is correct
2. Test URL manually first
3. Verify table ID in URL

---

## ✅ Verification Checklist

After testing, verify:
- [ ] Backend responds to health check
- [ ] Menu items load in customer view
- [ ] CRUD operations work (Create, Read, Update, Delete)
- [ ] QR codes generate and download
- [ ] Search and filters work
- [ ] Cart functionality works
- [ ] AI assistant responds
- [ ] No console errors
- [ ] Database persists data
- [ ] Real-time updates work

---

## 📊 Performance Tests

### Load Test Menu Endpoint
```powershell
# Using PowerShell (simple test)
1..100 | ForEach-Object {
  Invoke-RestMethod "http://localhost:5175/api/menu?restaurantId=1"
}
```
**Expected**: All requests succeed, <500ms each

### Database Query Test
```sql
-- Check data integrity
SELECT 
  m.name,
  m.price,
  m.category,
  r.name as restaurant_name
FROM menu_items m
JOIN restaurants r ON m.restaurant_id = r.id
LIMIT 10;
```

---

## 🎯 Success Criteria

Your system is working correctly if:
1. ✅ Backend starts without errors
2. ✅ Frontend starts without errors
3. ✅ Menu items load from database
4. ✅ CRUD operations complete successfully
5. ✅ QR codes generate and work
6. ✅ Customer can browse and add to cart
7. ✅ Orders can be placed
8. ✅ No TypeScript/JavaScript errors
9. ✅ Data persists after page reload
10. ✅ All API endpoints respond correctly

---

## 📸 Screenshot Checklist

Take these screenshots to verify:
- [ ] Customer menu with items
- [ ] Admin dashboard menu management
- [ ] QR code generator page
- [ ] Edit menu item dialog
- [ ] Shopping cart with items
- [ ] AI assistant conversation
- [ ] Backend health check response
- [ ] Database tables in PostgreSQL

---

## 🚀 Ready for Production?

Before deploying:
- [ ] All tests pass
- [ ] No console errors
- [ ] Database optimized
- [ ] Environment variables set
- [ ] SSL configured
- [ ] CORS whitelist set
- [ ] Error logging enabled
- [ ] Backup strategy in place

---

**Happy Testing! 🎉**

If all tests pass, your restaurant menu system is ready to use!
