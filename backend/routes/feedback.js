const express = require('express');
const router = express.Router();
const pool = require('../db');
const { validateFeedback, validateRestaurantId } = require('../middleware/validation');

// Get all feedback for a restaurant
router.get('/', validateRestaurantId, async (req, res) => {
  try {
    const restaurantId = req.query.restaurantId;
    
    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    const result = await pool.query(
      `SELECT f.*, u.name as customer_name, u.email as customer_email
       FROM feedback f
       LEFT JOIN users u ON f.user_id = u.id
       WHERE f.restaurant_id = $1
       ORDER BY f.created_at DESC`,
      [restaurantId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// Get feedback by ID
router.get('/:feedbackId', async (req, res) => {
  try {
    const { feedbackId } = req.params;

    const result = await pool.query(
      `SELECT f.*, u.name as customer_name, u.email as customer_email
       FROM feedback f
       LEFT JOIN users u ON f.user_id = u.id
       WHERE f.id = $1`,
      [feedbackId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// Create new feedback
router.post('/', validateFeedback, validateRestaurantId, async (req, res) => {
  try {
    const { restaurantId, userId, orderId, rating, comment, feedbackType } = req.body;

    if (!restaurantId || !rating) {
      return res.status(400).json({ error: 'Restaurant ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const result = await pool.query(
      `INSERT INTO feedback (restaurant_id, user_id, order_id, rating, comment, feedback_type, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [restaurantId, userId || null, orderId || null, rating, comment || null, feedbackType || 'general']
    );

    console.log('✅ Feedback created:', result.rows[0].id);
    res.status(201).json({ 
      message: 'Feedback submitted successfully',
      feedback: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error creating feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Update feedback
router.put('/:feedbackId', async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { rating, comment, feedbackType } = req.body;

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const result = await pool.query(
      `UPDATE feedback 
       SET rating = COALESCE($1, rating),
           comment = COALESCE($2, comment),
           feedback_type = COALESCE($3, feedback_type),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [rating, comment, feedbackType, feedbackId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    console.log('✅ Feedback updated:', result.rows[0].id);
    res.json({ message: 'Feedback updated successfully', feedback: result.rows[0] });
  } catch (error) {
    console.error('❌ Error updating feedback:', error);
    res.status(500).json({ error: 'Failed to update feedback' });
  }
});

// Delete feedback
router.delete('/:feedbackId', async (req, res) => {
  try {
    const { feedbackId } = req.params;

    const result = await pool.query(
      'DELETE FROM feedback WHERE id = $1 RETURNING id',
      [feedbackId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    console.log('✅ Feedback deleted:', result.rows[0].id);
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting feedback:', error);
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
});

// Get feedback statistics for a restaurant
router.get('/stats/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const result = await pool.query(
      `SELECT 
         COUNT(*) as total_feedback,
         AVG(rating) as average_rating,
         COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
         COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
         COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
         COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
         COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
       FROM feedback
       WHERE restaurant_id = $1`,
      [restaurantId]
    );

    const stats = {
      totalFeedback: parseInt(result.rows[0].total_feedback),
      averageRating: parseFloat(result.rows[0].average_rating) || 0,
      distribution: {
        5: parseInt(result.rows[0].five_star),
        4: parseInt(result.rows[0].four_star),
        3: parseInt(result.rows[0].three_star),
        2: parseInt(result.rows[0].two_star),
        1: parseInt(result.rows[0].one_star)
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({ error: 'Failed to fetch feedback statistics' });
  }
});

module.exports = router;
