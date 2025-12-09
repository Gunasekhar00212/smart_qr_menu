const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/service-requests - Get all service requests for a restaurant
router.get('/', async (req, res) => {
  try {
    const { restaurantId } = req.query;
    
    if (!restaurantId) {
      return res.status(400).json({ error: 'restaurantId is required' });
    }

    const result = await pool.query(
      `SELECT 
        sr.id,
        sr.restaurant_id as "restaurantId",
        sr.table_id as "tableId",
        t.number as "tableNumber",
        t.label as "tableLabel",
        sr.request_type as "requestType",
        sr.status,
        sr.notes,
        sr.created_at as "createdAt",
        sr.resolved_at as "resolvedAt"
      FROM service_requests sr
      LEFT JOIN tables t ON sr.table_id = t.id
      WHERE sr.restaurant_id = $1
      ORDER BY sr.created_at DESC
      LIMIT 50`,
      [restaurantId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ error: 'Failed to fetch service requests' });
  }
});

// POST /api/service-requests - Create a new service request
router.post('/', async (req, res) => {
  try {
    const { restaurantId, tableId, tableNumber, requestType, notes } = req.body;

    if (!restaurantId || !requestType) {
      return res.status(400).json({ 
        error: 'restaurantId and requestType are required' 
      });
    }

    // Get or find table_id
    let finalTableId = null;
    
    // If tableId is provided and looks like a UUID, use it
    if (tableId && tableId.length > 10 && tableId.includes('-')) {
      finalTableId = tableId;
    } 
    // If tableId is a number or string number, look up by table number
    else if (tableId && !isNaN(tableId)) {
      const tableResult = await pool.query(
        'SELECT id FROM tables WHERE restaurant_id = $1 AND number = $2',
        [restaurantId, parseInt(tableId)]
      );
      if (tableResult.rows.length > 0) {
        finalTableId = tableResult.rows[0].id;
      }
    }
    // If tableNumber is provided separately
    else if (tableNumber) {
      const tableResult = await pool.query(
        'SELECT id FROM tables WHERE restaurant_id = $1 AND number = $2',
        [restaurantId, parseInt(tableNumber)]
      );
      if (tableResult.rows.length > 0) {
        finalTableId = tableResult.rows[0].id;
      }
    }

    const result = await pool.query(
      `INSERT INTO service_requests (restaurant_id, table_id, request_type, notes, status)
      VALUES ($1, $2, $3, $4, 'PENDING')
      RETURNING id, restaurant_id as "restaurantId", table_id as "tableId", 
                request_type as "requestType", status, notes, created_at as "createdAt"`,
      [restaurantId, finalTableId, requestType, notes || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({ error: 'Failed to create service request', message: error.message });
  }
});

// PUT /api/service-requests/:id/resolve - Resolve a service request
router.put('/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE service_requests 
      SET status = 'RESOLVED', resolved_at = NOW()
      WHERE id = $1
      RETURNING id, restaurant_id as "restaurantId", table_id as "tableId", 
                request_type as "requestType", status, notes, 
                created_at as "createdAt", resolved_at as "resolvedAt"`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error resolving service request:', error);
    res.status(500).json({ error: 'Failed to resolve service request' });
  }
});

module.exports = router;
