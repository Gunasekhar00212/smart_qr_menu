const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all staff members for a restaurant
router.get('/', async (req, res) => {
  try {
    const restaurantId = req.query.restaurantId;
    
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    const result = await pool.query(
      `SELECT id, name, email, role, phone, created_at, updated_at
       FROM users 
       WHERE restaurant_id = $1
       ORDER BY created_at DESC`,
      [restaurantId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// Get single staff member
router.get('/:staffId', async (req, res) => {
  try {
    const { staffId } = req.params;

    const result = await pool.query(
      'SELECT id, name, email, role, phone, created_at, updated_at FROM users WHERE id = $1',
      [staffId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching staff member:', error);
    res.status(500).json({ error: 'Failed to fetch staff member' });
  }
});

// Add new staff member
router.post('/', async (req, res) => {
  try {
    const { name, email, role, phone, password, restaurantId } = req.body;

    if (!name || !email || !role || !restaurantId) {
      return res.status(400).json({ error: 'Name, email, role, and restaurant ID are required' });
    }

    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password (default password if not provided)
    const crypto = require('crypto');
    const defaultPassword = password || 'Welcome123';
    const passwordHash = crypto.createHash('sha256').update(defaultPassword).digest('hex');

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, phone, restaurant_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, name, email, role, phone, created_at`,
      [name, email, passwordHash, role, phone, restaurantId]
    );

    console.log('✅ Staff member added:', result.rows[0].email);
    res.status(201).json({ 
      message: 'Staff member added successfully',
      staff: result.rows[0],
      defaultPassword: password ? null : defaultPassword
    });
  } catch (error) {
    console.error('❌ Error adding staff member:', error);
    res.status(500).json({ error: 'Failed to add staff member' });
  }
});

// Update staff member
router.put('/:staffId', async (req, res) => {
  try {
    const { staffId } = req.params;
    const { name, email, role, phone } = req.body;

    // Check if email is taken by another user
    if (email) {
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, staffId]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const result = await pool.query(
      `UPDATE users 
       SET name = $1, email = $2, role = $3, phone = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, name, email, role, phone, updated_at`,
      [name, email, role, phone, staffId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    console.log('✅ Staff member updated:', result.rows[0].email);
    res.json({ message: 'Staff member updated successfully', staff: result.rows[0] });
  } catch (error) {
    console.error('❌ Error updating staff member:', error);
    res.status(500).json({ error: 'Failed to update staff member' });
  }
});

// Delete staff member
router.delete('/:staffId', async (req, res) => {
  try {
    const { staffId } = req.params;

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING email',
      [staffId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    console.log('✅ Staff member deleted:', result.rows[0].email);
    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting staff member:', error);
    res.status(500).json({ error: 'Failed to delete staff member' });
  }
});

// Reset staff member password
router.post('/:staffId/reset-password', async (req, res) => {
  try {
    const { staffId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const crypto = require('crypto');
    const passwordHash = crypto.createHash('sha256').update(newPassword).digest('hex');

    const result = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING email',
      [passwordHash, staffId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    console.log('✅ Password reset for:', result.rows[0].email);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
