// Prisma schema for Restaurant QR Menu & Smart AI Ordering System
// Provider: PostgreSQL

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Enums
enum Role {
  ADMIN
  WAITER
  CUSTOMER
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PREPARING
  READY
  SERVED
  CANCELLED
  COMPLETED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
}

// Models
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  name          String?
  role          Role      @default(ADMIN)
  restaurant    Restaurant? @relation(fields: [restaurantId], references: [id])
  restaurantId  String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Restaurant {
  id             String       @id @default(uuid())
  name           String
  slug           String       @unique
  description    String?
  address        String?
  latitude       Float?
  longitude      Float?
  radiusMeters   Int?         // for GPS validation
  timezone       String?      
  currency       String?      @default("INR")
  contactEmail   String?
  contactPhone   String?
  menus          MenuList[]
  tables         Table[]
  orders         Order[]
  users          User[]
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
}

model MenuList {
  id             String       @id @default(uuid())
  restaurant     Restaurant   @relation(fields: [restaurantId], references: [id])
  restaurantId   String
  titleKey       String       // i18n key or default title
  descriptionKey String?
  isActive       Boolean      @default(true)
  items          MenuItem[]
  assignedTables Table[]      @relation("MenuAssignedTables")
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
}

model MenuItem {
  id             String        @id @default(uuid())
  menu           MenuList      @relation(fields: [menuId], references: [id])
  menuId         String
  sku            String?       @unique
  name           String
  description    String?
  priceCents     Int           // store price in smallest currency unit
  currency       String        @default("INR")
  isVeg          Boolean       @default(true)
  category       String?
  isAvailable    Boolean       @default(true)
  imageUrl       String?
  aiImageMeta    Json?
  translations   MenuItemTranslation[]
  orderItems     OrderItem[]
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}

model MenuItemTranslation {
  id          String   @id @default(uuid())
  menuItem    MenuItem @relation(fields: [menuItemId], references: [id])
  menuItemId  String
  locale      String   // e.g. en, hi, te
  name        String
  description String?
  @@unique([menuItemId, locale])
}

model Table {
  id            String    @id @default(uuid())
  restaurant    Restaurant @relation(fields: [restaurantId], references: [id])
  restaurantId  String
  number        Int
  label         String?   // e.g., "Table 1 - Window"
  seats         Int?      
  qrCode        QRCode?
  assignedMenus MenuList[] @relation("MenuAssignedTables")
  status        String?   // e.g., available, occupied
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  @@unique([restaurantId, number])
}

model QRCode {
  id            String   @id @default(uuid())
  table         Table    @relation(fields: [tableId], references: [id])
  tableId       String   @unique
  codeString    String   @unique
  imageUrl      String?
  createdAt     DateTime @default(now())
  // QR does not change when menu updates — codeString remains constant
}

model DeviceSession {
  id              String   @id @default(uuid())
  table           Table?   @relation(fields: [tableId], references: [id])
  tableId         String?
  deviceFingerprint String
  ipAddress       String?
  userAgent       String?
  lockedUntil     DateTime?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  @@index([deviceFingerprint])
}

model Order {
  id              String     @id @default(uuid())
  restaurant      Restaurant @relation(fields: [restaurantId], references: [id])
  restaurantId    String
  table           Table?     @relation(fields: [tableId], references: [id])
  tableId         String?
  deviceSession   DeviceSession? @relation(fields: [deviceSessionId], references: [id])
  deviceSessionId String?
  status          OrderStatus @default(PENDING)
  paymentStatus   PaymentStatus @default(PENDING)
  totalCents      Int
  currency        String      @default("INR")
  placedBy        String?     // e.g., guest name or device id
  items           OrderItem[]
  feedback        Feedback?
  notes           String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  @@index([restaurantId, status])
}

model OrderItem {
  id          String   @id @default(uuid())
  order       Order    @relation(fields: [orderId], references: [id])
  orderId     String
  menuItem    MenuItem @relation(fields: [menuItemId], references: [id])
  menuItemId  String
  quantity    Int      @default(1)
  unitPriceCents Int
  totalCents  Int
  notes       String?
}

model Feedback {
  id         String   @id @default(uuid())
  order      Order?   @relation(fields: [orderId], references: [id])
  orderId    String?
  restaurant Restaurant? @relation(fields: [restaurantId], references: [id])
  restaurantId String?
  rating     Int      @default(5)
  comment    String?
  photos     Json?
  createdAt  DateTime @default(now())
}

model Analytics {
  id            String   @id @default(uuid())
  restaurant    Restaurant @relation(fields: [restaurantId], references: [id])
  restaurantId  String
  date          DateTime
  metric        String
  value         Float
  createdAt     DateTime @default(now())
  @@index([restaurantId, date])
}

// Optional: store webhook logs, notifications
model NotificationLog {
  id           String   @id @default(uuid())
  restaurantId String?
  payload      Json
  type         String?
  createdAt    DateTime @default(now())
}

// Add indexes and constraints that help with throttling / abuse protection
model RateLimit {
  id           String   @id @default(uuid())
  key          String   // e.g. "qr:codeString:ip"
  count        Int      @default(0)
  windowStart  DateTime
  createdAt    DateTime @default(now())
  @@unique([key, windowStart])
}

// Example composite index to quickly fetch popular items
model PopularItemCache {
  id           String   @id @default(uuid())
  restaurantId String
  menuItemId   String
  periodStart  DateTime
  periodEnd    DateTime
  count        Int      @default(0)
  @@index([restaurantId, periodStart])
  @@unique([restaurantId, menuItemId, periodStart])
}

// Notes / next steps (keep here as comments):
// - Run: prisma generate
// - Create migrations: prisma migrate dev --name init
// - Create seed script to populate a sample restaurant, menus, tables, and an admin user
// - Use PostGIS extension or store lat/lng for distance checks on GPS validation (we used plain Float fields)
// - For translations, you may choose to store i18n keys in MenuList.titleKey and provide a translations store
