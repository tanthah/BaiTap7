/**
 * Request Validation Middleware
 * Validates and sanitizes input data
 */

/**
 * Sanitize string input
 */
const sanitizeString = (str, maxLength = 200) => {
  if (typeof str !== 'string') return '';
  
  return str
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .substring(0, maxLength);
};

/**
 * Validate and sanitize number
 */
const sanitizeNumber = (num, min = -Infinity, max = Infinity) => {
  const parsed = Number(num);
  if (isNaN(parsed)) {
    throw new Error(`Invalid number: ${num}`);
  }
  if (parsed < min || parsed > max) {
    throw new Error(`Number out of range: ${parsed} (expected ${min}-${max})`);
  }
  return parsed;
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  if (typeof email !== 'string') {
    throw new Error('Email must be a string');
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  
  return email.toLowerCase().trim();
};

/**
 * Validate product ID
 */
const validateProductId = (id) => {
  return sanitizeNumber(id, 1, Number.MAX_SAFE_INTEGER);
};

/**
 * Validate quantity
 */
const validateQuantity = (qty) => {
  return sanitizeNumber(qty, 1, 999);
};

/**
 * Validate price
 */
const validatePrice = (price) => {
  const validated = sanitizeNumber(price, 0, 10000000);
  return Math.round(validated * 100) / 100;
};

/**
 * Validate discount code
 */
const validateDiscountCode = (code) => {
  if (typeof code !== 'string') {
    throw new Error('Discount code must be a string');
  }
  
  const cleaned = sanitizeString(code, 20).toUpperCase();
  
  if (cleaned.length < 3) {
    throw new Error('Discount code too short');
  }
  
  if (!/^[A-Z0-9-]+$/.test(cleaned)) {
    throw new Error('Discount code contains invalid characters');
  }
  
  return cleaned;
};

/**
 * Validate cart item
 */
const validateCartItem = (item) => {
  if (!item || typeof item !== 'object') {
    throw new Error('Invalid cart item');
  }
  
  return {
    productId: validateProductId(item.productId),
    quantity: validateQuantity(item.quantity || 1),
    variant: item.variant ? sanitizeObject(item.variant) : null
  };
};

/**
 * Sanitize object recursively
 */
const sanitizeObject = (obj, depth = 0) => {
  if (depth > 5) {
    throw new Error('Object nesting too deep');
  }
  
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleanKey = sanitizeString(key, 50);
      if (cleanKey) {
        sanitized[cleanKey] = sanitizeObject(value, depth + 1);
      }
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Validation middleware factory
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      const errors = [];
      
      // Validate body
      if (schema.body) {
        for (const [field, validator] of Object.entries(schema.body)) {
          try {
            if (validator.required && !req.body[field]) {
              errors.push(`${field} is required`);
              continue;
            }
            
            if (req.body[field] !== undefined) {
              req.body[field] = validator.validate(req.body[field]);
            }
          } catch (error) {
            errors.push(`${field}: ${error.message}`);
          }
        }
      }
      
      // Validate params
      if (schema.params) {
        for (const [field, validator] of Object.entries(schema.params)) {
          try {
            if (validator.required && !req.params[field]) {
              errors.push(`param ${field} is required`);
              continue;
            }
            
            if (req.params[field] !== undefined) {
              req.params[field] = validator.validate(req.params[field]);
            }
          } catch (error) {
            errors.push(`param ${field}: ${error.message}`);
          }
        }
      }
      
      // Validate query
      if (schema.query) {
        for (const [field, validator] of Object.entries(schema.query)) {
          try {
            if (validator.required && !req.query[field]) {
              errors.push(`query ${field} is required`);
              continue;
            }
            
            if (req.query[field] !== undefined) {
              req.query[field] = validator.validate(req.query[field]);
            }
          } catch (error) {
            errors.push(`query ${field}: ${error.message}`);
          }
        }
      }
      
      if (errors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
      }
      
      next();
    } catch (error) {
      console.error('Validation error:', error);
      res.status(400).json({
        error: 'Validation failed',
        details: [error.message]
      });
    }
  };
};

/**
 * Common validation schemas
 */
const schemas = {
  // Add to cart
  addToCart: {
    body: {
      productId: {
        required: true,
        validate: validateProductId
      },
      quantity: {
        required: false,
        validate: validateQuantity
      },
      variant: {
        required: false,
        validate: sanitizeObject
      }
    }
  },
  
  // Update cart item
  updateCartItem: {
    body: {
      itemId: {
        required: true,
        validate: (id) => sanitizeString(id, 50)
      },
      quantity: {
        required: true,
        validate: validateQuantity
      }
    }
  },
  
  // Apply discount
  applyDiscount: {
    body: {
      code: {
        required: true,
        validate: validateDiscountCode
      }
    }
  },
  
  // Checkout
  checkout: {
    body: {
      cartItemIds: {
        required: true,
        validate: (ids) => {
          if (!Array.isArray(ids) || ids.length === 0) {
            throw new Error('cartItemIds must be a non-empty array');
          }
          return ids.map(id => sanitizeString(id, 50));
        }
      },
      shippingAddress: {
        required: true,
        validate: (addr) => sanitizeString(addr, 500)
      },
      paymentMethod: {
        required: true,
        validate: (method) => sanitizeString(method, 50)
      }
    }
  },
  
  // Get products
  getProducts: {
    query: {
      limit: {
        required: false,
        validate: (limit) => sanitizeNumber(limit, 1, 100)
      },
      offset: {
        required: false,
        validate: (offset) => sanitizeNumber(offset, 0)
      }
    }
  },
  
  // Get product
  getProduct: {
    params: {
      id: {
        required: true,
        validate: validateProductId
      }
    }
  }
};

/**
 * Sanitize request body middleware
 */
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    try {
      req.body = sanitizeObject(req.body);
      next();
    } catch (error) {
      res.status(400).json({
        error: 'Invalid request body',
        details: [error.message]
      });
    }
  } else {
    next();
  }
};

/**
 * Rate limiting validation
 */
class RateLimitValidator {
  constructor() {
    this.requests = new Map();
  }
  
  check(identifier, maxRequests = 100, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    const key = String(identifier);
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const userRequests = this.requests.get(key);
    
    // Remove old requests
    const validRequests = userRequests.filter(time => now - time < windowMs);
    this.requests.set(key, validRequests);
    
    // Check limit
    if (validRequests.length >= maxRequests) {
      const oldestRequest = validRequests[0];
      const waitTime = Math.ceil((windowMs - (now - oldestRequest)) / 1000);
      throw new Error(`Too many requests. Please wait ${waitTime} seconds.`);
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }
  
  reset(identifier) {
    this.requests.delete(String(identifier));
  }
}

const rateLimitValidator = new RateLimitValidator();

/**
 * Rate limit middleware
 */
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    try {
      const identifier = req.ip || req.connection.remoteAddress;
      rateLimitValidator.check(identifier, maxRequests, windowMs);
      next();
    } catch (error) {
      res.status(429).json({
        error: error.message,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
  };
};

module.exports = {
  // Validators
  sanitizeString,
  sanitizeNumber,
  sanitizeObject,
  validateEmail,
  validateProductId,
  validateQuantity,
  validatePrice,
  validateDiscountCode,
  validateCartItem,
  
  // Middleware
  validate,
  sanitizeBody,
  rateLimit,
  
  // Schemas
  schemas,
  
  // Rate limit validator
  rateLimitValidator
};