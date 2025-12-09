const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');

// Get restaurant settings
router.get('/', async (req, res) => {
  try {
    const restaurantId = req.query.restaurantId;
    
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    const result = await pool.query(
      'SELECT id, name, address, contact_phone as phone, contact_email as email, description FROM restaurants WHERE id = $1',
      [restaurantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching restaurant settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update restaurant settings
router.put('/', async (req, res) => {
  try {
    const { restaurantId, name, address, phone, email, description } = req.body;
    
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    const result = await pool.query(
      `UPDATE restaurants 
       SET name = $1, address = $2, contact_phone = $3, contact_email = $4, description = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING id, name, address, contact_phone as phone, contact_email as email, description, updated_at`,
      [name, address, phone, email, description, restaurantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    console.log('✅ Restaurant settings updated:', result.rows[0].name);
    res.json({ message: 'Settings updated successfully', restaurant: result.rows[0] });
  } catch (error) {
    console.error('❌ Error updating restaurant settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get user profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      'SELECT id, name, email, role, phone, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, phone } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const result = await pool.query(
      `UPDATE users 
       SET name = $1, email = $2, phone = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, name, email, phone, role, updated_at`,
      [name, email, phone, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ User profile updated:', result.rows[0].email);
    res.json({ message: 'Profile updated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.post('/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Get current password hash
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const currentPasswordHash = crypto.createHash('sha256').update(currentPassword).digest('hex');
    
    if (currentPasswordHash !== userResult.rows[0].password_hash) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = crypto.createHash('sha256').update(newPassword).digest('hex');

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    );

    console.log('✅ Password changed for user:', userId);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('❌ Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
