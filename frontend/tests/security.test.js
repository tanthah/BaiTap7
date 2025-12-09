// frontend/src/security/__tests__/security.test.js

import { sanitize, validators, RateLimiter, CartError } from '../src/security/sanitizer';
import XSSProtection, { FileUploadProtection } from '../src/security/xssProtection';
import CSRFProtection from '../src/security/csrfProtection';

describe('Sanitizer', () => {
  describe('sanitize.text', () => {
    test('removes HTML tags', () => {
      const dirty = '<script>alert("xss")</script>Hello';
      const clean = sanitize.text(dirty);
      
      expect(clean).toBe('Hello');
      expect(clean).not.toContain('<script>');
    });
    
    test('removes script tags with attributes', () => {
      const dirty = '<script src="evil.js">alert("xss")</script>';
      const clean = sanitize.text(dirty);
      
      expect(clean).not.toContain('<script>');
    });
    
    test('trims whitespace', () => {
      const dirty = '  Hello World  ';
      const clean = sanitize.text(dirty);
      
      expect(clean).toBe('Hello World');
    });
    
    test('handles non-string input', () => {
      expect(sanitize.text(123)).toBe('');
      expect(sanitize.text(null)).toBe('');
      expect(sanitize.text(undefined)).toBe('');
    });
  });
  
  describe('sanitize.number', () => {
    test('converts valid number', () => {
      expect(sanitize.number('123')).toBe(123);
      expect(sanitize.number(456)).toBe(456);
    });
    
    test('validates min/max range', () => {
      expect(() => sanitize.number(5, 10, 20)).toThrow('Number out of range');
      expect(() => sanitize.number(25, 10, 20)).toThrow('Number out of range');
    });
    
    test('throws on invalid number', () => {
      expect(() => sanitize.number('abc')).toThrow('Invalid number');
    });
  });
  
  describe('sanitize.url', () => {
    test('validates and returns valid URL', () => {
      const url = 'https://example.com/path';
      expect(sanitize.url(url)).toBe(url);
    });
    
    test('rejects javascript: protocol', () => {
      const url = 'javascript:alert("xss")';
      expect(sanitize.url(url)).toBeNull();
    });
    
    test('rejects data: protocol', () => {
      const url = 'data:text/html,<script>alert("xss")</script>';
      expect(sanitize.url(url)).toBeNull();
    });
    
    test('handles invalid URLs', () => {
      expect(sanitize.url('not a url')).toBeNull();
      expect(sanitize.url('')).toBeNull();
      expect(sanitize.url(null)).toBeNull();
    });
  });
  
  describe('sanitize.object', () => {
    test('sanitizes object keys and values', () => {
      const dirty = {
        '<script>key</script>': '<b>value</b>',
        normalKey: 'normalValue'
      };
      
      const clean = sanitize.object(dirty);
      
      expect(clean).not.toHaveProperty('<script>key</script>');
      expect(clean.key).toBe('value');
      expect(clean.normalKey).toBe('normalValue');
    });
    
    test('handles nested objects', () => {
      const dirty = {
        nested: {
          deep: '<script>alert("xss")</script>'
        }
      };
      
      const clean = sanitize.object(dirty);
      expect(clean.nested.deep).not.toContain('<script>');
    });
  });
});

describe('Validators', () => {
  describe('validators.productId', () => {
    test('validates valid product ID', () => {
      expect(validators.productId(1)).toBe(1);
      expect(validators.productId('123')).toBe(123);
    });
    
    test('rejects invalid product ID', () => {
      expect(() => validators.productId(0)).toThrow();
      expect(() => validators.productId(-1)).toThrow();
      expect(() => validators.productId('abc')).toThrow();
    });
  });
  
  describe('validators.quantity', () => {
    test('validates valid quantity', () => {
      expect(validators.quantity(1)).toBe(1);
      expect(validators.quantity(50)).toBe(50);
      expect(validators.quantity(999)).toBe(999);
    });
    
    test('rejects out of range quantity', () => {
      expect(() => validators.quantity(0)).toThrow();
      expect(() => validators.quantity(1000)).toThrow();
      expect(() => validators.quantity(-1)).toThrow();
    });
  });
  
  describe('validators.price', () => {
    test('validates and rounds price', () => {
      expect(validators.price(99.99)).toBe(99.99);
      expect(validators.price(100.005)).toBe(100.01);
      expect(validators.price(100.004)).toBe(100);
    });
    
    test('rejects negative price', () => {
      expect(() => validators.price(-10)).toThrow();
    });
  });
  
  describe('validators.cartItem', () => {
    test('validates complete cart item', () => {
      const item = {
        id: 1,
        name: 'Test Product',
        price: 99.99,
        quantity: 2,
        image: 'https://example.com/image.jpg',
        variant: { color: 'red' }
      };
      
      const validated = validators.cartItem(item);
      
      expect(validated.id).toBe(1);
      expect(validated.name).toBe('Test Product');
      expect(validated.price).toBe(99.99);
      expect(validated.quantity).toBe(2);
    });
    
    test('sanitizes cart item values', () => {
      const item = {
        id: '1',
        name: '<script>alert("xss")</script>Product',
        price: '99.99',
        quantity: '2'
      };
      
      const validated = validators.cartItem(item);
      
      expect(validated.name).not.toContain('<script>');
      expect(typeof validated.price).toBe('number');
      expect(typeof validated.quantity).toBe('number');
    });
    
    test('throws on invalid cart item', () => {
      expect(() => validators.cartItem(null)).toThrow();
      expect(() => validators.cartItem({})).toThrow();
      expect(() => validators.cartItem({ id: 'invalid' })).toThrow();
    });
  });
});

describe('RateLimiter', () => {
  let rateLimiter;
  
  beforeEach(() => {
    rateLimiter = new RateLimiter(3, 1000); // 3 requests per second
  });
  
  test('allows requests within limit', () => {
    expect(() => rateLimiter.canMakeRequest()).not.toThrow();
    expect(() => rateLimiter.canMakeRequest()).not.toThrow();
    expect(() => rateLimiter.canMakeRequest()).not.toThrow();
  });
  
  test('blocks requests exceeding limit', () => {
    rateLimiter.canMakeRequest();
    rateLimiter.canMakeRequest();
    rateLimiter.canMakeRequest();
    
    expect(() => rateLimiter.canMakeRequest()).toThrow('Too many requests');
  });
  
  test('resets after time window', async () => {
    rateLimiter.canMakeRequest();
    rateLimiter.canMakeRequest();
    rateLimiter.canMakeRequest();
    
    // Wait for time window to pass
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    expect(() => rateLimiter.canMakeRequest()).not.toThrow();
  });
  
  test('tracks different actions separately', () => {
    rateLimiter.canMakeRequest('action1');
    rateLimiter.canMakeRequest('action1');
    rateLimiter.canMakeRequest('action1');
    
    expect(() => rateLimiter.canMakeRequest('action1')).toThrow();
    expect(() => rateLimiter.canMakeRequest('action2')).not.toThrow();
  });
  
  test('reset clears rate limit for action', () => {
    rateLimiter.canMakeRequest();
    rateLimiter.canMakeRequest();
    rateLimiter.canMakeRequest();
    
    rateLimiter.reset();
    
    expect(() => rateLimiter.canMakeRequest()).not.toThrow();
  });
});

describe('XSSProtection', () => {
  describe('sanitizeHTML', () => {
    test('allows safe HTML tags', () => {
      const html = '<b>Bold</b> and <i>Italic</i>';
      const safe = XSSProtection.sanitizeHTML(html);
      
      expect(safe).toContain('<b>');
      expect(safe).toContain('<i>');
    });
    
    test('removes dangerous tags', () => {
      const html = '<script>alert("xss")</script><b>Safe</b>';
      const safe = XSSProtection.sanitizeHTML(html);
      
      expect(safe).not.toContain('<script>');
      expect(safe).toContain('<b>');
    });
  });
  
  describe('stripHTML', () => {
    test('removes all HTML tags', () => {
      const html = '<b>Bold</b> <script>alert("xss")</script> text';
      const stripped = XSSProtection.stripHTML(html);
      
      expect(stripped).toBe('Bold  text');
      expect(stripped).not.toContain('<');
    });
  });
  
  describe('sanitizeURL', () => {
    test('allows http and https', () => {
      expect(XSSProtection.sanitizeURL('https://example.com')).toBe('https://example.com/');
      expect(XSSProtection.sanitizeURL('http://example.com')).toBe('http://example.com/');
    });
    
    test('blocks javascript: protocol', () => {
      expect(XSSProtection.sanitizeURL('javascript:alert("xss")')).toBe('');
    });
    
    test('blocks data: protocol', () => {
      expect(XSSProtection.sanitizeURL('data:text/html,<script>')).toBe('');
    });
  });
  
  describe('sanitizeEmail', () => {
    test('validates and sanitizes email', () => {
      expect(XSSProtection.sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
    });
    
    test('throws on invalid email format', () => {
      expect(() => XSSProtection.sanitizeEmail('invalid')).toThrow('Invalid email format');
      expect(() => XSSProtection.sanitizeEmail('test@')).toThrow('Invalid email format');
    });
    
    test('blocks XSS attempts in email', () => {
      expect(() => XSSProtection.sanitizeEmail('test@example.com<script>')).toThrow('Invalid characters');
    });
  });
  
  describe('sanitizeObject', () => {
    test('sanitizes nested objects', () => {
      const obj = {
        name: '<script>alert("xss")</script>',
        nested: {
          value: '<b>test</b>'
        }
      };
      
      const clean = XSSProtection.sanitizeObject(obj);
      
      expect(clean.name).not.toContain('<script>');
      expect(clean.nested.value).not.toContain('<b>');
    });
    
    test('prevents deep nesting attacks', () => {
      let deepObj = { value: 'test' };
      for (let i = 0; i < 15; i++) {
        deepObj = { nested: deepObj };
      }
      
      expect(() => XSSProtection.sanitizeObject(deepObj)).toThrow('Object nesting too deep');
    });
  });
});

describe('FileUploadProtection', () => {
  describe('validateImage', () => {
    test('validates correct image types', () => {
      const validFile = {
        type: 'image/jpeg',
        size: 1024 * 1024, // 1MB
        name: 'test.jpg'
      };
      
      expect(() => FileUploadProtection.validateImage(validFile)).not.toThrow();
    });
    
    test('rejects invalid file types', () => {
      const invalidFile = {
        type: 'application/pdf',
        size: 1024,
        name: 'test.pdf'
      };
      
      expect(() => FileUploadProtection.validateImage(invalidFile)).toThrow('Invalid file type');
    });
    
    test('rejects files exceeding size limit', () => {
      const largeFile = {
        type: 'image/jpeg',
        size: 10 * 1024 * 1024, // 10MB
        name: 'test.jpg'
      };
      
      expect(() => FileUploadProtection.validateImage(largeFile)).toThrow('File too large');
    });
    
    test('validates file extension', () => {
      const invalidExt = {
        type: 'image/jpeg',
        size: 1024,
        name: 'test.exe'
      };
      
      expect(() => FileUploadProtection.validateImage(invalidExt)).toThrow('Invalid file extension');
    });
  });
});

describe('CSRFProtection', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });
  
  test('generates CSRF token', () => {
    const token = CSRFProtection.generateToken();
    
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });
  
  test('sets and gets token', () => {
    const token = CSRFProtection.setToken();
    const retrieved = CSRFProtection.getToken();
    
    expect(retrieved).toBe(token);
  });
  
  test('validates token correctly', () => {
    const token = CSRFProtection.setToken();
    
    expect(CSRFProtection.validateToken(token)).toBe(true);
    expect(CSRFProtection.validateToken('wrong-token')).toBe(false);
  });
  
  test('adds token to headers', () => {
    const token = CSRFProtection.setToken();
    const headers = CSRFProtection.addTokenToHeaders({ 'Content-Type': 'application/json' });
    
    expect(headers['X-CSRF-Token']).toBe(token);
    expect(headers['Content-Type']).toBe('application/json');
  });
  
  test('clears token', () => {
    CSRFProtection.setToken();
    CSRFProtection.clearToken();
    
    const token = sessionStorage.getItem('csrf_token');
    expect(token).toBeNull();
  });
});

describe('CartError', () => {
  test('creates error with message and code', () => {
    const error = new CartError('Test error', 'TEST_CODE');
    
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('CartError');
  });
  
  test('defaults to CART_ERROR code', () => {
    const error = new CartError('Test error');
    
    expect(error.code).toBe('CART_ERROR');
  });
});