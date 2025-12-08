# 🏗️ System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CUSTOMER LAYER                           │
│  📱 Smartphone → QR Code Scanner → Menu Display → Cart → Order │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND (React)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │CustomerMenu  │  │MenuManagement│  │QRGenerator   │         │
│  │   (JSX)      │  │    (JSX)     │  │   (JSX)      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         ↓                  ↓                  ↓                 │
│  ┌────────────────────────────────────────────────┐           │
│  │         React Query (Data Layer)              │           │
│  │  - Caching  - Invalidation  - Loading States  │           │
│  └────────────────────────────────────────────────┘           │
│                                                                 │
│  Port: 5173 (Vite Dev Server)                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express)                          │
│  ┌────────────────────────────────────────────────┐           │
│  │              server.js (Main App)              │           │
│  │  - CORS enabled  - JSON parsing  - Logging     │           │
│  └────────────────────────────────────────────────┘           │
│         ↓                              ↓                        │
│  ┌──────────────┐            ┌──────────────┐                 │
│  │/api/menu     │            │/api/orders   │                 │
│  │- GET (list)  │            │- GET (list)  │                 │
│  │- POST (new)  │            │- POST (new)  │                 │
│  │- PUT (edit)  │            │- PUT (status)│                 │
│  │- DELETE      │            └──────────────┘                 │
│  └──────────────┘                                              │
│         ↓                              ↓                        │
│  ┌────────────────────────────────────────────────┐           │
│  │         db.js (PostgreSQL Pool)                │           │
│  │  - Connection pooling  - Error handling        │           │
│  └────────────────────────────────────────────────┘           │
│                                                                 │
│  Port: 5175                                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓ SQL
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │restaurants   │  │menu_items    │  │orders        │         │
│  │- id          │  │- id          │  │- id          │         │
│  │- name        │  │- name        │  │- table_number│         │
│  │- slug        │  │- price       │  │- status      │         │
│  └──────────────┘  │- category    │  │- total       │         │
│                     │- is_veg      │  └──────────────┘         │
│                     │- is_spicy    │  ┌──────────────┐         │
│                     │- is_popular  │  │order_items   │         │
│                     │- restaurant  │  │- order_id    │         │
│                     │  _id (FK)    │  │- item_id     │         │
│                     └──────────────┘  │- quantity    │         │
│                                        │- price_at    │         │
│                                        │  _order      │         │
│                                        └──────────────┘         │
│  Port: 5432                                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Menu Display Flow (Customer)

```
Customer Phone
     │
     │ 1. Scan QR Code
     ↓
http://localhost:5173/menu/5
     │
     │ 2. React Router → CustomerMenu.jsx
     ↓
React Query (useQuery)
     │
     │ 3. GET /api/menu?restaurantId=1
     ↓
Express Server (routes/menu.js)
     │
     │ 4. SELECT * FROM menu_items WHERE restaurant_id = 1
     ↓
PostgreSQL Database
     │
     │ 5. Returns JSON array
     ↓
React Query Cache
     │
     │ 6. Renders menu items
     ↓
Customer sees menu with items, prices, categories
```

### 2. Create Menu Item Flow (Admin)

```
Admin Dashboard
     │
     │ 1. Fill form + Click "Create Item"
     ↓
MenuManagement.jsx (createMutation)
     │
     │ 2. POST /api/menu
     │    Body: { name, price, category, ... }
     ↓
Express Server (routes/menu.js)
     │
     │ 3. INSERT INTO menu_items (...)
     ↓
PostgreSQL Database
     │
     │ 4. Returns new item with ID
     ↓
React Query
     │
     │ 5. invalidateQueries(['menu-items'])
     ↓
Automatic Refetch
     │
     │ 6. UI updates with new item
     ↓
Admin sees new item in list immediately
Customer menu also shows it (cached data invalidated)
```

### 3. Place Order Flow

```
Customer adds items to cart
     │
     │ 1. Click "Place Order"
     ↓
Cart Context → POST /api/orders
     │
     │ Body: {
     │   restaurantId: 1,
     │   tableNumber: "5",
     │   items: [{ itemId: 3, quantity: 2 }]
     │ }
     ↓
Express Server (routes/orders.js)
     │
     │ 2. BEGIN TRANSACTION
     │ 3. SELECT prices from menu_items
     │ 4. Calculate total
     │ 5. INSERT INTO orders
     │ 6. INSERT INTO order_items
     │ 7. COMMIT
     ↓
PostgreSQL Database
     │
     │ 8. Returns order with items
     ↓
Success Response
     │
     │ 9. Clear cart + Show confirmation
     ↓
Admin dashboard shows new order
```

### 4. QR Code Generation Flow

```
Admin enters table number
     │
     │ 1. Table: "5"
     ↓
QRGenerator.jsx
     │
     │ 2. Generate URL:
     │    http://localhost:5173/menu/5
     ↓
QRCodeSVG Component
     │
     │ 3. Encode URL to QR format
     ↓
Display QR Image
     │
     │ 4. Admin clicks "Download"
     ↓
Convert SVG → Canvas → PNG
     │
     │ 5. Download table-5-qr.png
     ↓
Print and place on Table 5
```

---

## Component Architecture

### Frontend Components

```
App.tsx (Root)
  │
  ├── QueryClientProvider (React Query)
  │     │
  │     ├── AuthProvider (Authentication Context)
  │     │     │
  │     │     └── CartProvider (Shopping Cart Context)
  │     │           │
  │     │           ├── BrowserRouter
  │     │                 │
  │     │                 ├── Public Routes
  │     │                 │     ├── Index (Landing)
  │     │                 │     ├── Login
  │     │                 │     └── Signup
  │     │                 │
  │     │                 ├── Customer Routes
  │     │                 │     ├── CustomerMenu.jsx (/menu/:tableId)
  │     │                 │     └── CustomerMenu.jsx (/demo)
  │     │                 │
  │     │                 └── Admin Routes (DashboardLayout)
  │     │                       ├── Dashboard (/dashboard)
  │     │                       ├── MenuManagement.jsx (/dashboard/menus)
  │     │                       ├── TableManagement (/dashboard/tables)
  │     │                       ├── QRGenerator.jsx (/dashboard/qr)
  │     │                       ├── OrdersPage (/dashboard/orders)
  │     │                       ├── Analytics (/dashboard/analytics)
  │     │                       └── Settings (/dashboard/settings)
  │     │
  │     └── Toaster (Notifications)
```

### Backend Structure

```
backend/
  │
  ├── server.js (Entry Point)
  │     │
  │     ├── Express App Setup
  │     │     ├── CORS middleware
  │     │     ├── JSON parser
  │     │     └── Request logger
  │     │
  │     ├── Routes
  │     │     ├── /api/health (Health check)
  │     │     ├── /api/menu (Menu CRUD)
  │     │     └── /api/orders (Order management)
  │     │
  │     └── Error Handlers
  │           ├── 404 handler
  │           └── 500 error handler
  │
  ├── db.js (Database Layer)
  │     └── PostgreSQL Pool
  │           ├── Connection management
  │           ├── Error handling
  │           └── Event logging
  │
  ├── routes/
  │     ├── menu.js (Menu endpoints)
  │     │     ├── GET /api/menu (fetch)
  │     │     ├── POST /api/menu (create)
  │     │     ├── PUT /api/menu/:id (update)
  │     │     └── DELETE /api/menu/:id (delete)
  │     │
  │     └── orders.js (Order endpoints)
  │           ├── GET /api/orders (fetch)
  │           ├── POST /api/orders (create)
  │           └── PUT /api/orders/:id/status (update)
  │
  ├── init-db.js (Database Setup)
  │     └── Create tables if not exist
  │
  └── seed-db.js (Sample Data)
        └── Insert 23 menu items
```

---

## Technology Stack

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.19
- **Routing**: React Router 6.30.1
- **State Management**: 
  - React Query (server state)
  - Context API (auth, cart)
- **UI Library**: shadcn/ui (Radix primitives)
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **QR Codes**: qrcode.react
- **Forms**: React Hook Form + Zod

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express 4.18.2
- **Database Driver**: pg (node-postgres) 8.11.3
- **Config**: dotenv 16.3.1
- **CORS**: cors 2.8.5
- **Dev Tool**: nodemon 3.0.2

### Database
- **DBMS**: PostgreSQL 12+
- **Schema**: 4 tables with foreign keys
- **Features**: ACID transactions, JSON aggregation

### Additional Services
- **AI Assistant**: OpenAI API (optional)
- **AI Proxy**: Express server on port 5174

---

## Port Assignment

| Service | Port | Purpose |
|---------|------|---------|
| Frontend (Vite) | 5173 | React development server |
| Backend (Express) | 5175 | REST API server |
| AI Proxy (Optional) | 5174 | OpenAI API proxy |
| PostgreSQL | 5432 | Database server |

---

## Security Layers

```
┌──────────────────────────────────────┐
│  Input Validation                    │
│  - Required fields                   │
│  - Type checking                     │
│  - Zod schemas                       │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│  API Layer                           │
│  - CORS whitelist                    │
│  - Rate limiting (TODO)              │
│  - Authentication (TODO)             │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│  Database Layer                      │
│  - Parameterized queries ✓           │
│  - Connection pooling ✓              │
│  - Foreign key constraints ✓         │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│  Infrastructure                      │
│  - HTTPS (production)                │
│  - Environment variables ✓           │
│  - SSL database connection           │
└──────────────────────────────────────┘
```

---

## Deployment Architecture (Production)

```
┌──────────────────────────────────────────────┐
│              CDN / Edge Network              │
│         (Static Assets, Images)              │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│           Frontend Hosting                   │
│     (Vercel / Netlify / Cloudflare)         │
│  - React build artifacts                     │
│  - Auto SSL                                  │
│  - Global CDN                                │
└──────────────────────────────────────────────┘
                    ↓ HTTPS
┌──────────────────────────────────────────────┐
│          Backend Server                      │
│    (Railway / Heroku / DigitalOcean)        │
│  - Express API                               │
│  - Environment variables                     │
│  - Health checks                             │
└──────────────────────────────────────────────┘
                    ↓ SSL
┌──────────────────────────────────────────────┐
│        Managed PostgreSQL                    │
│   (Heroku Postgres / AWS RDS / Supabase)    │
│  - Automated backups                         │
│  - Connection pooling                        │
│  - Monitoring                                │
└──────────────────────────────────────────────┘
```

---

## Request/Response Examples

### GET /api/menu?restaurantId=1

**Request**:
```http
GET /api/menu?restaurantId=1 HTTP/1.1
Host: localhost:5175
```

**Response**:
```json
[
  {
    "id": 1,
    "restaurantId": 1,
    "name": "Butter Chicken",
    "description": "Creamy tomato-based chicken curry",
    "price": "280.00",
    "category": "Main Course",
    "isVeg": false,
    "isSpicy": false,
    "isPopular": true,
    "isOutOfStock": false,
    "image": "🍛",
    "createdAt": "2024-12-07T10:30:00.000Z"
  }
]
```

### POST /api/orders

**Request**:
```http
POST /api/orders HTTP/1.1
Host: localhost:5175
Content-Type: application/json

{
  "restaurantId": 1,
  "tableNumber": "5",
  "items": [
    { "itemId": 1, "quantity": 2 },
    { "itemId": 5, "quantity": 1 }
  ]
}
```

**Response**:
```json
{
  "id": 15,
  "restaurantId": 1,
  "tableNumber": "5",
  "status": "PENDING",
  "totalAmount": "760.00",
  "createdAt": "2024-12-07T11:00:00.000Z",
  "items": [
    {
      "id": 20,
      "itemId": 1,
      "quantity": 2,
      "price": "280.00"
    },
    {
      "id": 21,
      "itemId": 5,
      "quantity": 1,
      "price": "200.00"
    }
  ]
}
```

---

**This architecture is scalable, maintainable, and ready for production deployment!**
