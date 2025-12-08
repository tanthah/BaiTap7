/**
 * XSS Protection Utilities
 * Bổ sung cho DOMPurify sanitization
 */

import DOMPurify from 'dompurify';

/**
 * Enhanced XSS Protection
 */
export class XSSProtection {
  /**
   * Sanitize HTML with custom config
   */
  static sanitizeHTML(dirty, config = {}) {
    const defaultConfig = {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'span', 'div'],
      ALLOWED_ATTR: ['class'],
      ALLOW_DATA_ATTR: false,
      KEEP_CONTENT: true
    };
    
    return DOMPurify.sanitize(dirty, { ...defaultConfig, ...config });
  }
  
  /**
   * Strip all HTML tags
   */
  static stripHTML(input) {
    if (typeof input !== 'string') return '';
    
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    }).trim();
  }
  
  /**
   * Sanitize for attribute values
   */
  static sanitizeAttribute(input) {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[<>'"]/g, '') // Remove dangerous chars
      .trim();
  }
  
  /**
   * Sanitize URL - prevent javascript: and data: schemes
   */
  static sanitizeURL(url) {
    if (!url || typeof url !== 'string') return '';
    
    try {
      const parsed = new URL(url);
      
      // Only allow http, https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        console.warn('Blocked dangerous URL protocol:', parsed.protocol);
        return '';
      }
      
      return parsed.href;
    } catch {
      // Invalid URL
      return '';
    }
  }
  
  /**
   * Encode for JSON output
   */
  static encodeJSON(obj) {
    return JSON.stringify(obj)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026');
  }
  
  /**
   * Sanitize object recursively
   */
  static sanitizeObject(obj, depth = 0) {
    if (depth > 10) {
      throw new Error('Object nesting too deep');
    }
    
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      return this.stripHTML(obj);
    }
    
    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, depth + 1));
    }
    
    if (typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        const cleanKey = this.stripHTML(key);
        sanitized[cleanKey] = this.sanitizeObject(value, depth + 1);
      }
      return sanitized;
    }
    
    return obj;
  }
  
  /**
   * Validate and sanitize email
   */
  static sanitizeEmail(email) {
    if (typeof email !== 'string') return '';
    
    const cleaned = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(cleaned)) {
      throw new Error('Invalid email format');
    }
    
    // Additional XSS check
    if (/<|>|script|javascript:/i.test(cleaned)) {
      throw new Error('Invalid characters in email');
    }
    
    return cleaned;
  }
  
  /**
   * Sanitize phone number
   */
  static sanitizePhone(phone) {
    if (typeof phone !== 'string') return '';
    
    // Remove all non-digit characters except + at start
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Basic validation
    if (cleaned.length < 10 || cleaned.length > 15) {
      throw new Error('Invalid phone number length');
    }
    
    return cleaned;
  }
  
  /**
   * Create safe React component from HTML
   */
  static createSafeComponent(htmlString, allowedTags = ['b', 'i', 'em', 'strong']) {
    const sanitized = DOMPurify.sanitize(htmlString, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: []
    });
    
    return {
      __html: sanitized
    };
  }
}

/**
 * React component for safe HTML rendering
 */
import React from 'react';

export const SafeHTML = ({ html, allowedTags, className = '' }) => {
  const safeContent = XSSProtection.createSafeComponent(html, allowedTags);
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={safeContent}
    />
  );
};

/**
 * Hook for input sanitization
 */
export const useSanitizedInput = (initialValue = '') => {
  const [value, setValue] = React.useState(
    XSSProtection.stripHTML(initialValue)
  );
  
  const handleChange = (e) => {
    const sanitized = XSSProtection.stripHTML(e.target.value);
    setValue(sanitized);
  };
  
  return [value, handleChange, setValue];
};

/**
 * Validate file uploads
 */
export class FileUploadProtection {
  static ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  static MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  
  static validateImage(file) {
    if (!file) {
      throw new Error('No file provided');
    }
    
    // Check file type
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP allowed');
    }
    
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File too large. Maximum size is ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
    
    // Check file extension
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      throw new Error('Invalid file extension');
    }
    
    return true;
  }
  
  static async validateImageContent(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(true);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Invalid image file'));
      };
      
      img.src = objectUrl;
    });
  }
}

export default XSSProtection;