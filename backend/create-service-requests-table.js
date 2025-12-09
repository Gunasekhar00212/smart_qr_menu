const pool = require('./db');

async function createServiceRequestsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating service_requests table...\n');

    // Create service_requests table
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
    console.log('✅ Created index: idx_service_requests_restaurant');
    console.log('\n🎉 Service requests table created successfully!\n');
    
    // Verify the table was created
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'service_requests'
      ORDER BY ordinal_position;
    `);
    
    console.log('📊 Table structure:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Error creating service_requests table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createServiceRequestsTable()
  .then(() => {
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
