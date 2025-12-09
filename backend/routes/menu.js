const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/menu?restaurantId=ID - Get all menu items for a restaurant
router.get('/', async (req, res) => {
  try {
    const { restaurantId } = req.query;
    
    if (!restaurantId) {
      return res.status(400).json({ error: 'restaurantId is required' });
    }

    const result = await pool.query(
      `SELECT 
        mi.id,
        mi.menu_id as "menuId",
        mi.sku,
        mi.name,
        mi.description,
        mi.price_cents as "priceCents",
        mi.currency,
        mi.category,
        mi.is_veg as "isVeg",
        mi.is_available as "isAvailable",
        mi.image_url as "imageUrl",
        mi.ai_image_meta as "aiImageMeta",
        mi.created_at as "createdAt",
        mi.updated_at as "updatedAt",
        ml.title_key as "menuTitle",
        ml.is_active as "menuActive"
      FROM menu_items mi
      JOIN menu_lists ml ON mi.menu_id = ml.id
      WHERE ml.restaurant_id = $1 AND ml.is_active = true
      ORDER BY mi.category, mi.name`,
      [restaurantId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// POST /api/menu - Create a new menu item
router.post('/', async (req, res) => {
  try {
    const {
      menuId,
      restaurantId,
      name,
      description,
      priceCents,
      category,
      isVeg,
      isAvailable,
      imageUrl,
      sku,
      currency
    } = req.body;

    if (!name || !priceCents) {
      return res.status(400).json({ 
        error: 'name and priceCents are required' 
      });
    }

    // Get or create menu_id
    let finalMenuId = menuId;
    if (!finalMenuId && restaurantId) {
      const menuResult = await pool.query(
        'SELECT id FROM menu_lists WHERE restaurant_id = $1 AND is_active = true LIMIT 1',
        [restaurantId]
      );
      if (menuResult.rows.length > 0) {
        finalMenuId = menuResult.rows[0].id;
      }
    }

    if (!finalMenuId) {
      return res.status(400).json({ error: 'menuId or restaurantId is required' });
    }

    const result = await pool.query(
      `INSERT INTO menu_items 
        (menu_id, sku, name, description, price_cents, currency, category, is_veg, is_available, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING 
        id,
        menu_id as "menuId",
        sku,
        name,
        description,
        price_cents as "priceCents",
        currency,
        category,
        is_veg as "isVeg",
        is_available as "isAvailable",
        image_url as "imageUrl",
        created_at as "createdAt"`,
      [finalMenuId, sku || null, name, description || null, priceCents, currency || 'INR', category || null, isVeg !== undefined ? isVeg : true, isAvailable !== undefined ? isAvailable : true, imageUrl || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

// PUT /api/menu/:id - Update a menu item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      priceCents,
      category,
      isVeg,
      isAvailable,
      imageUrl,
      sku
    } = req.body;

    const result = await pool.query(
      `UPDATE menu_items 
      SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price_cents = COALESCE($3, price_cents),
        category = COALESCE($4, category),
        is_veg = COALESCE($5, is_veg),
        is_available = COALESCE($6, is_available),
        image_url = COALESCE($7, image_url),
        sku = COALESCE($8, sku),
        updated_at = NOW()
      WHERE id = $9
      RETURNING 
        id,
        menu_id as "menuId",
        sku,
        name,
        description,
        price_cents as "priceCents",
        currency,
        category,
        is_veg as "isVeg",
        is_available as "isAvailable",
        image_url as "imageUrl",
        created_at as "createdAt",
        updated_at as "updatedAt"`,
      [name, description, priceCents, category, isVeg, isAvailable, imageUrl, sku, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// DELETE /api/menu/:id?force=true - Delete a menu item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query; // ?force=true to permanently delete

    // Check if item exists
    const checkResult = await pool.query(
      'SELECT id FROM menu_items WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    // Check if item is used in any orders
    const orderCheck = await pool.query(
      'SELECT COUNT(*) as count FROM order_items WHERE menu_item_id = $1',
      [id]
    );

    const isUsedInOrders = parseInt(orderCheck.rows[0].count) > 0;

    if (isUsedInOrders && force !== 'true') {
      // Instead of deleting, mark as unavailable
      await pool.query(
        'UPDATE menu_items SET is_available = false, updated_at = NOW() WHERE id = $1',
        [id]
      );
      return res.json({ 
        message: 'Menu item is used in orders, marked as unavailable instead', 
        id,
        markedUnavailable: true,
        canForceDelete: true // Inform frontend that force delete is possible
      });
    }

    // Force delete - remove from order_items first
    if (force === 'true' && isUsedInOrders) {
      await pool.query(
        'DELETE FROM order_items WHERE menu_item_id = $1',
        [id]
      );
      console.log('⚠️ Force deleted order items for menu item:', id);
    }

    // Delete the menu item
    const result = await pool.query(
      'DELETE FROM menu_items WHERE id = $1 RETURNING id',
      [id]
    );

    console.log('✅ Menu item deleted:', id, force === 'true' ? '(FORCED)' : '');
    res.json({ 
      message: force === 'true' ? 'Menu item force deleted permanently' : 'Menu item deleted successfully', 
      id: result.rows[0].id,
      forcedDelete: force === 'true'
    });
  } catch (error) {
    console.error('❌ Error deleting menu item:', error);
    res.status(500).json({ 
      error: 'Failed to delete menu item',
      message: error.message 
    });
  }
});

module.exports = router;
