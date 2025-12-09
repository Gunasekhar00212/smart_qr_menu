const pool = require('./db');

async function initDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database initialization with complete schema...\n');

    // Create ENUMs
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE role_enum AS ENUM ('ADMIN', 'WAITER', 'CUSTOMER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE order_status_enum AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED', 'COMPLETED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'PAID', 'FAILED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ Created/verified enums');

    // 1. Create restaurants table
    await client.query(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        address TEXT,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        radius_meters INTEGER,
        timezone TEXT,
        currency TEXT DEFAULT 'INR',
        contact_email TEXT,
        contact_phone TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created table: restaurants');

    // 2. Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        role role_enum DEFAULT 'ADMIN',
        restaurant_id UUID REFERENCES restaurants(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created table: users');

    // 3. Create menu_lists table
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_lists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        title_key TEXT NOT NULL,
        description_key TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created table: menu_lists');

    // 4. Create menu_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        menu_id UUID NOT NULL REFERENCES menu_lists(id) ON DELETE CASCADE,
        sku TEXT UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        price_cents INTEGER NOT NULL,
        currency TEXT DEFAULT 'INR',
        is_veg BOOLEAN DEFAULT true,
        category TEXT,
        is_available BOOLEAN DEFAULT true,
        image_url TEXT,
        ai_image_meta JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created table: menu_items');

    // 5. Create menu_item_translations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_item_translations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
        locale TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        UNIQUE(menu_item_id, locale)
      )
    `);
    console.log('✅ Created table: menu_item_translations');

    // 6. Create tables table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tables (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        number INTEGER NOT NULL,
        label TEXT,
        seats INTEGER,
        status TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(restaurant_id, number)
      )
    `);
    console.log('✅ Created table: tables');

    // 7. Create qr_codes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS qr_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        table_id UUID UNIQUE NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
        code_string TEXT UNIQUE NOT NULL,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created table: qr_codes');

    // 8. Create menu_assigned_tables junction table
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_assigned_tables (
        menu_id UUID NOT NULL REFERENCES menu_lists(id) ON DELETE CASCADE,
        table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
        PRIMARY KEY(menu_id, table_id)
      )
    `);
    console.log('✅ Created table: menu_assigned_tables');

    // 9. Create device_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS device_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        table_id UUID REFERENCES tables(id),
        device_fingerprint TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        locked_until TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_device_fingerprint ON device_sessions(device_fingerprint);
    `);
    console.log('✅ Created table: device_sessions');

    // 10. Create orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        table_id UUID REFERENCES tables(id),
        device_session_id UUID REFERENCES device_sessions(id),
        status order_status_enum DEFAULT 'PENDING',
        payment_status payment_status_enum DEFAULT 'PENDING',
        total_cents INTEGER NOT NULL,
        currency TEXT DEFAULT 'INR',
        placed_by TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON orders(restaurant_id, status);
    `);
    console.log('✅ Created table: orders');

    // 11. Create order_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        menu_item_id UUID NOT NULL REFERENCES menu_items(id),
        quantity INTEGER DEFAULT 1,
        unit_price_cents INTEGER NOT NULL,
        total_cents INTEGER NOT NULL,
        notes TEXT
      )
    `);
    console.log('✅ Created table: order_items');

    // 12. Create feedback table
    await client.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID UNIQUE REFERENCES orders(id),
        restaurant_id UUID REFERENCES restaurants(id),
        rating INTEGER DEFAULT 5,
        comment TEXT,
        photos JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created table: feedback');

    // 13. Create analytics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        date TIMESTAMP NOT NULL,
        metric TEXT NOT NULL,
        value DOUBLE PRECISION NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_analytics_restaurant_date ON analytics(restaurant_id, date);
    `);
    console.log('✅ Created table: analytics');

    // 14. Create notification_log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID,
        payload JSONB NOT NULL,
        type TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created table: notification_log');

    // 15. Create rate_limit table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rate_limit (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key TEXT NOT NULL,
        count INTEGER DEFAULT 0,
        window_start TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(key, window_start)
      )
    `);
    console.log('✅ Created table: rate_limit');

    // 16. Create popular_item_cache table
    await client.query(`
      CREATE TABLE IF NOT EXISTS popular_item_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL,
        menu_item_id UUID NOT NULL,
        period_start TIMESTAMP NOT NULL,
        period_end TIMESTAMP NOT NULL,
        count INTEGER DEFAULT 0,
        UNIQUE(restaurant_id, menu_item_id, period_start)
      );
      CREATE INDEX IF NOT EXISTS idx_popular_items ON popular_item_cache(restaurant_id, period_start);
    `);
    console.log('✅ Created table: popular_item_cache');

    // 17. Create service_requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
        request_type TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        resolved_at TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_service_requests_restaurant 
        ON service_requests(restaurant_id, status, created_at DESC);
    `);
    console.log('✅ Created table: service_requests');

    // Insert default restaurant if none exists
    const restaurantCheck = await client.query('SELECT COUNT(*) FROM restaurants');
    if (parseInt(restaurantCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO restaurants (name, slug) 
        VALUES ('MenuAI Restaurant', 'menuai-restaurant')
      `);
      console.log('✅ Inserted default restaurant');
    }

    console.log('\n🎉 Database initialization completed successfully!');
    console.log('📊 Created 18 tables matching the application schema\n');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
