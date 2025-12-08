const pool = require('./db');

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...\n');

    // Check if menu items already exist
    const existingItems = await client.query('SELECT COUNT(*) FROM menu_items');
    if (parseInt(existingItems.rows[0].count) > 0) {
      console.log('⚠️  Menu items already exist. Skipping seed.');
      console.log('   Run this script only on a fresh database or delete existing items first.\n');
      return;
    }

    // Get restaurant ID
    const restaurantResult = await client.query('SELECT id FROM restaurants LIMIT 1');
    if (restaurantResult.rows.length === 0) {
      console.log('❌ No restaurant found. Run init-db.js first.');
      return;
    }
    const restaurantId = restaurantResult.rows[0].id;

    // Create a default menu list
    const menuResult = await client.query(
      `INSERT INTO menu_lists (restaurant_id, title_key, description_key, is_active)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [restaurantId, 'Main Menu', 'Our delicious menu', true]
    );
    const menuId = menuResult.rows[0].id;
    console.log('✅ Created menu list: Main Menu\n');

    // Sample menu items (price in rupees converted to paise/cents)
    const sampleItems = [
      // Starters
      { name: 'Masala Papad', description: 'Crispy papad topped with onions, tomatoes, and spices', price: 60, category: 'Starters', isVeg: true, image: '🍽️' },
      { name: 'Paneer Tikka', description: 'Grilled cottage cheese marinated in spices', price: 180, category: 'Starters', isVeg: true, image: '🧀' },
      { name: 'Chicken 65', description: 'Spicy fried chicken appetizer', price: 220, category: 'Starters', isVeg: false, image: '🍗' },
      { name: 'Veg Spring Rolls', description: 'Crispy rolls filled with vegetables', price: 120, category: 'Starters', isVeg: true, image: '🥟' },
      
      // Main Course
      { name: 'Butter Chicken', description: 'Creamy tomato-based chicken curry', price: 280, category: 'Main Course', isVeg: false, image: '🍛' },
      { name: 'Paneer Butter Masala', description: 'Cottage cheese in rich tomato gravy', price: 240, category: 'Main Course', isVeg: true, image: '🧈' },
      { name: 'Chicken Biryani', description: 'Fragrant rice with spiced chicken', price: 320, category: 'Main Course', isVeg: false, image: '🍚' },
      { name: 'Veg Biryani', description: 'Aromatic rice with mixed vegetables', price: 250, category: 'Main Course', isVeg: true, image: '🥘' },
      { name: 'Dal Tadka', description: 'Yellow lentils tempered with spices', price: 180, category: 'Main Course', isVeg: true, image: '🫘' },
      { name: 'Fish Curry', description: 'Fish in coconut-based curry sauce', price: 340, category: 'Main Course', isVeg: false, image: '🐟' },
      
      // Breads
      { name: 'Butter Naan', description: 'Soft leavened bread with butter', price: 50, category: 'Breads', isVeg: true, image: '🫓' },
      { name: 'Garlic Naan', description: 'Naan topped with garlic and herbs', price: 60, category: 'Breads', isVeg: true, image: '🧄' },
      { name: 'Tandoori Roti', description: 'Whole wheat bread from tandoor', price: 30, category: 'Breads', isVeg: true, image: '🥖' },
      { name: 'Cheese Naan', description: 'Naan stuffed with cheese', price: 80, category: 'Breads', isVeg: true, image: '🧀' },
      
      // Desserts
      { name: 'Gulab Jamun', description: 'Sweet milk dumplings in sugar syrup', price: 80, category: 'Desserts', isVeg: true, image: '🍡' },
      { name: 'Rasmalai', description: 'Cottage cheese patties in sweet milk', price: 100, category: 'Desserts', isVeg: true, image: '🥛' },
      { name: 'Ice Cream (3 Scoops)', description: 'Choice of vanilla, chocolate, or strawberry', price: 120, category: 'Desserts', isVeg: true, image: '🍦' },
      { name: 'Kulfi', description: 'Traditional Indian ice cream', price: 90, category: 'Desserts', isVeg: true, image: '🍨' },
      
      // Beverages
      { name: 'Mango Lassi', description: 'Sweet mango yogurt drink', price: 80, category: 'Beverages', isVeg: true, image: '🥤' },
      { name: 'Sweet Lassi', description: 'Traditional yogurt drink', price: 60, category: 'Beverages', isVeg: true, image: '🥛' },
      { name: 'Masala Chai', description: 'Spiced Indian tea', price: 40, category: 'Beverages', isVeg: true, image: '☕' },
      { name: 'Fresh Lime Soda', description: 'Refreshing lime and soda water', price: 50, category: 'Beverages', isVeg: true, image: '🍋' },
      { name: 'Coke / Pepsi', description: 'Chilled soft drink', price: 40, category: 'Beverages', isVeg: true, image: '🥤' },
    ];

    // Insert all items (convert rupees to paise: multiply by 100)
    for (const item of sampleItems) {
      await client.query(
        `INSERT INTO menu_items (menu_id, name, description, price_cents, category, is_veg, is_available, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          menuId,
          item.name,
          item.description,
          item.price * 100, // Convert to cents/paise
          item.category,
          item.isVeg,
          true, // available by default
          item.image
        ]
      );
      console.log(`✅ Added: ${item.name}`);
    }

    console.log(`\n🎉 Successfully seeded ${sampleItems.length} menu items!`);
    console.log('   You can now view them in the admin dashboard or customer menu.\n');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
