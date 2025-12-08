// Validation middleware for sanitizing and validating input data

/**
 * Sanitize string input - remove HTML tags and trim whitespace
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').trim();
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format
 */
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate phone number (basic validation)
 */
function isValidPhone(phone) {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Sanitize request body
 */
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }
  next();
}

/**
 * Validate restaurant ID
 */
function validateRestaurantId(req, res, next) {
  const restaurantId = req.body.restaurantId || req.query.restaurantId || req.params.restaurantId;
  
  if (!restaurantId) {
    return res.status(400).json({ error: 'Restaurant ID is required' });
  }
  
  if (!isValidUUID(restaurantId)) {
    return res.status(400).json({ error: 'Invalid restaurant ID format' });
  }
  
  next();
}

/**
 * Validate email in request
 */
function validateEmail(req, res, next) {
  const email = req.body.email;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  next();
}

/**
 * Validate order creation
 */
function validateOrderCreation(req, res, next) {
  const { restaurantId, items, totalCents } = req.body;
  
  if (!restaurantId || !isValidUUID(restaurantId)) {
    return res.status(400).json({ error: 'Valid restaurant ID is required' });
  }
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item' });
  }
  
  // Validate each item
  for (const item of items) {
    if (!item.menuItemId || !isValidUUID(item.menuItemId)) {
      return res.status(400).json({ error: 'Invalid menu item ID' });
    }
    
    if (!item.quantity || item.quantity < 1 || item.quantity > 100) {
      return res.status(400).json({ error: 'Item quantity must be between 1 and 100' });
    }
    
    if (!item.priceCents || item.priceCents < 0) {
      return res.status(400).json({ error: 'Invalid item price' });
    }
  }
  
  if (!totalCents || totalCents < 0) {
    return res.status(400).json({ error: 'Invalid total amount' });
  }
  
  next();
}

/**
 * Validate menu item creation/update
 */
function validateMenuItem(req, res, next) {
  const { name, priceCents, category, restaurantId } = req.body;
  
  if (restaurantId && !isValidUUID(restaurantId)) {
    return res.status(400).json({ error: 'Invalid restaurant ID format' });
  }
  
  if (name && (name.length < 2 || name.length > 200)) {
    return res.status(400).json({ error: 'Item name must be between 2 and 200 characters' });
  }
  
  if (priceCents !== undefined && (priceCents < 0 || priceCents > 100000000)) {
    return res.status(400).json({ error: 'Price must be between 0 and 1,000,000' });
  }
  
  if (category && category.length > 100) {
    return res.status(400).json({ error: 'Category name too long' });
  }
  
  next();
}

/**
 * Validate user registration
 */
function validateUserRegistration(req, res, next) {
  const { name, email, password } = req.body;
  
  if (!name || name.length < 2 || name.length > 100) {
    return res.status(400).json({ error: 'Name must be between 2 and 100 characters' });
  }
  
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  next();
}

/**
 * Validate feedback submission
 */
function validateFeedback(req, res, next) {
  const { rating, comment } = req.body;
  
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }
  
  if (comment && comment.length > 1000) {
    return res.status(400).json({ error: 'Comment must be less than 1000 characters' });
  }
  
  next();
}

/**
 * Rate limiting - simple in-memory implementation
 */
const requestCounts = new Map();

function rateLimit(maxRequests = 100, windowMs = 60000) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requestCounts.has(ip)) {
      requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const record = requestCounts.get(ip);
    
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }
    
    if (record.count >= maxRequests) {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again later.' 
      });
    }
    
    record.count++;
    next();
  };
}

// Cleanup old rate limit records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(ip);
    }
  }
}, 300000);

module.exports = {
  sanitizeString,
  isValidEmail,
  isValidUUID,
  isValidPhone,
  sanitizeBody,
  validateRestaurantId,
  validateEmail,
  validateOrderCreation,
  validateMenuItem,
  validateUserRegistration,
  validateFeedback,
  rateLimit
};
