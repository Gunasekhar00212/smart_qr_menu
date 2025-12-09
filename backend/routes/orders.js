const express = require('express');
const router = express.Router();
const pool = require('../db');
const { validateOrderCreation, validateRestaurantId } = require('../middleware/validation');

// GET /api/orders?restaurantId=ID - Get all orders for a restaurant
router.get('/', validateRestaurantId, async (req, res) => {
  try {
    const { restaurantId } = req.query;
    
    if (!restaurantId) {
      return res.status(400).json({ error: 'restaurantId is required' });
    }

    const result = await pool.query(
      `SELECT 
        o.id,
        o.restaurant_id as "restaurantId",
        o.table_id as "tableId",
        t.number as "tableNumber",
        t.label as "tableLabel",
        o.status,
        o.payment_status as "paymentStatus",
        o.total_cents as "totalCents",
        o.currency,
        o.placed_by as "placedBy",
        o.notes,
        o.created_at as "createdAt",
        o.updated_at as "updatedAt",
        json_agg(
          json_build_object(
            'id', oi.id,
            'menuItemId', oi.menu_item_id,
            'itemName', mi.name,
            'quantity', oi.quantity,
            'unitPriceCents', oi.unit_price_cents,
            'totalCents', oi.total_cents,
            'notes', oi.notes
          )
        ) as items
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE o.restaurant_id = $1
      GROUP BY o.id, t.number, t.label
      ORDER BY o.created_at DESC`,
      [restaurantId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// POST /api/orders - Create a new order
router.post('/', validateOrderCreation, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { restaurantId, tableId, tableNumber, items, placedBy, notes } = req.body;

    if (!restaurantId || !items || items.length === 0) {
      return res.status(400).json({ 
        error: 'restaurantId and items array are required' 
      });
    }

    await client.query('BEGIN');

    // Get or find table_id
    let finalTableId = null;
    
    // If tableId is provided and looks like a UUID, use it
    if (tableId && tableId.length > 10 && tableId.includes('-')) {
      finalTableId = tableId;
    } 
    // If tableId is a number or string number, look up by table number
    else if (tableId && !isNaN(tableId)) {
      const tableResult = await client.query(
        'SELECT id FROM tables WHERE restaurant_id = $1 AND number = $2',
        [restaurantId, parseInt(tableId)]
      );
      if (tableResult.rows.length > 0) {
        finalTableId = tableResult.rows[0].id;
      }
    }
    // If tableNumber is provided separately
    else if (tableNumber) {
      const tableResult = await client.query(
        'SELECT id FROM tables WHERE restaurant_id = $1 AND number = $2',
        [restaurantId, tableNumber]
      );
      if (tableResult.rows.length > 0) {
        finalTableId = tableResult.rows[0].id;
      }
    }

    // Get menu item prices
    const itemIds = items.map(item => item.menuItemId || item.itemId);
    const menuItemsResult = await client.query(
      'SELECT id, price_cents FROM menu_items WHERE id = ANY($1)',
      [itemIds]
    );

    const priceMap = {};
    menuItemsResult.rows.forEach(row => {
      priceMap[row.id] = parseInt(row.price_cents);
    });

    // Calculate total
    let totalCents = 0;
    items.forEach(item => {
      const itemId = item.menuItemId || item.itemId;
      const priceCents = priceMap[itemId];
      if (!priceCents) {
        throw new Error(`Menu item ${itemId} not found`);
      }
      totalCents += priceCents * item.quantity;
    });

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (restaurant_id, table_id, total_cents, status, payment_status, placed_by, notes)
      VALUES ($1, $2, $3, 'PENDING', 'PENDING', $4, $5)
      RETURNING id, restaurant_id as "restaurantId", table_id as "tableId", 
                status, payment_status as "paymentStatus", total_cents as "totalCents", 
                currency, placed_by as "placedBy", notes, created_at as "createdAt"`,
      [restaurantId, finalTableId, totalCents, placedBy || null, notes || null]
    );

    const order = orderResult.rows[0];

    // Create order items
    const orderItems = [];
    for (const item of items) {
      const itemId = item.menuItemId || item.itemId;
      const unitPriceCents = priceMap[itemId];
      const itemTotalCents = unitPriceCents * item.quantity;
      
      const itemResult = await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price_cents, total_cents, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, menu_item_id as "menuItemId", quantity, unit_price_cents as "unitPriceCents", 
                  total_cents as "totalCents", notes`,
        [order.id, itemId, item.quantity, unitPriceCents, itemTotalCents, item.notes || null]
      );
      orderItems.push(itemResult.rows[0]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      ...order,
      items: orderItems
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order', message: error.message });
  } finally {
    client.release();
  }
});

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED', 'COMPLETED'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status', 
        validStatuses 
      });
    }

    const result = await pool.query(
      `UPDATE orders 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, restaurant_id as "restaurantId", table_id as "tableId", 
                status, payment_status as "paymentStatus", total_cents as "totalCents", 
                currency, created_at as "createdAt", updated_at as "updatedAt"`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// DELETE /api/orders/clear-today?restaurantId=ID - Clear today's orders
router.delete('/clear-today', validateRestaurantId, async (req, res) => {
  const client = await pool.connect();
  try {
    const { restaurantId } = req.query;

    if (!restaurantId) {
      return res.status(400).json({ error: 'restaurantId is required' });
    }

    console.log('🗑️  Clearing ALL orders for restaurant:', restaurantId);

    await client.query('BEGIN');

    // Get ALL orders for this restaurant (not just today)
    const ordersResult = await client.query(
      `SELECT id, created_at FROM orders 
       WHERE restaurant_id = $1`,
      [restaurantId]
    );

    const orderIds = ordersResult.rows.map(row => row.id);

    console.log(`📊 Found ${orderIds.length} orders to delete`);
    if (orderIds.length > 0) {
      console.log('Order IDs:', orderIds);
      console.log('Order timestamps:', ordersResult.rows.map(r => r.created_at));
    }

    if (orderIds.length > 0) {
      // Delete order items first (foreign key constraint)
      const itemsResult = await client.query(
        `DELETE FROM order_items WHERE order_id = ANY($1) RETURNING id`,
        [orderIds]
      );
      console.log(`🗑️  Deleted ${itemsResult.rowCount} order items`);

      // Delete orders
      const ordersDeleteResult = await client.query(
        `DELETE FROM orders WHERE id = ANY($1) RETURNING id`,
        [orderIds]
      );
      console.log(`🗑️  Deleted ${ordersDeleteResult.rowCount} orders`);
    }

    await client.query('COMMIT');
    console.log('✅ Clear operation completed successfully');

    res.json({ 
      success: true, 
      deletedCount: orderIds.length,
      message: `Cleared ${orderIds.length} orders` 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error clearing orders:', error);
    res.status(500).json({ error: 'Failed to clear orders', details: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
