/**
 * Security Layer - Input Sanitization & Validation
 * Note: DOMPurify is optional - falls back to basic sanitization
 */

let DOMPurify;
try {
  DOMPurify = require('dompurify');
} catch (e) {
  console.warn('DOMPurify not found, using basic sanitization');
}

// Sanitize functions
export const sanitize = {
  // Sanitize text input - remove all HTML/script tags
  text: (input) => {
    if (typeof input !== 'string') return '';
    
    if (DOMPurify) {
      return DOMPurify.sanitize(input, { 
        ALLOWED_TAGS: [], 
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true
      }).trim();
    }
    
    // Fallback basic sanitization
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  },
  
  // Sanitize HTML content (if needed for rich text)
  html: (input) => {
    if (typeof input !== 'string') return '';
    
    if (DOMPurify) {
      return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
        ALLOWED_ATTR: []
      });
    }
    
    return sanitize.text(input);
  },
  
  // Validate and sanitize number
  number: (input, min = -Infinity, max = Infinity) => {
    const num = Number(input);
    if (isNaN(num)) {
      throw new Error(`Invalid number: ${input}`);
    }
    if (num < min || num > max) {
      throw new Error(`Number out of range: ${num} (expected ${min}-${max})`);
    }
    return num;
  },
  
  // Validate and sanitize URL
  url: (input) => {
    if (!input) return null;
    
    try {
      const url = new URL(input);
      // Only allow http/https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
      return url.href;
    } catch {
      console.warn('Invalid URL:', input);
      return null;
    }
  },
  
  // Sanitize object keys and values
  object: (input) => {
    if (typeof input !== 'object' || input === null) return {};
    
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      const cleanKey = sanitize.text(String(key));
      const cleanValue = typeof value === 'string' ? sanitize.text(value) : value;
      if (cleanKey) {
        sanitized[cleanKey] = cleanValue;
      }
    }
    return sanitized;
  }
};

// Validation rules
export const validators = {
  productId: (id) => {
    return sanitize.number(id, 1, Number.MAX_SAFE_INTEGER);
  },
  
  productName: (name) => {
    const cleaned = sanitize.text(String(name));
    if (cleaned.length < 1) {
      throw new Error('Product name is required');
    }
    if (cleaned.length > 200) {
      throw new Error('Product name too long (max 200 characters)');
    }
    return cleaned;
  },
  
  price: (price) => {
    const validated = sanitize.number(price, 0, 10000000);
    // Round to 2 decimal places
    return Math.round(validated * 100) / 100;
  },
  
  quantity: (qty) => {
    return sanitize.number(qty, 1, 999);
  },
  
  image: (url) => {
    if (!url) return null;
    return sanitize.url(url);
  },
  
  variant: (variant) => {
    if (!variant) return null;
    return sanitize.object(variant);
  },
  
  // Validate entire cart item
  cartItem: (item) => {
    if (!item || typeof item !== 'object') {
      throw new Error('Invalid cart item');
    }
    
    try {
      return {
        id: validators.productId(item.id),
        name: validators.productName(item.name),
        price: validators.price(item.price),
        quantity: validators.quantity(item.quantity || 1),
        image: validators.image(item.image),
        variant: validators.variant(item.variant)
      };
    } catch (error) {
      console.error('Cart item validation failed:', error);
      throw error;
    }
  }
};

// Rate Limiter (Client-side protection)
export class RateLimiter {
  constructor(maxRequests = 20, timeWindowMs = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindowMs = timeWindowMs;
    this.requests = {};
  }
  
  canMakeRequest(action = 'default') {
    const now = Date.now();
    const key = `${action}_requests`;
    
    if (!this.requests[key]) {
      this.requests[key] = [];
    }
    
    // Remove old requests outside time window
    this.requests[key] = this.requests[key].filter(time => now - time < this.timeWindowMs);
    
    // Check if limit exceeded
    if (this.requests[key].length >= this.maxRequests) {
      const oldestRequest = this.requests[key][0];
      const waitTime = Math.ceil((this.timeWindowMs - (now - oldestRequest)) / 1000);
      throw new Error(`Too many requests. Please wait ${waitTime} seconds.`);
    }
    
    // Add current request
    this.requests[key].push(now);
    return true;
  }
  
  reset(action = 'default') {
    const key = `${action}_requests`;
    this.requests[key] = [];
  }
}

// Error handler
export class CartError extends Error {
  constructor(message, code = 'CART_ERROR') {
    super(message);
    this.name = 'CartError';
    this.code = code;
  }
}