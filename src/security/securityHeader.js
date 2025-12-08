/**
 * Security Headers Configuration
 * Để sử dụng với server-side (Express, Next.js, etc.)
 */

export const securityHeaders = {
  /**
   * Content Security Policy
   * Ngăn chặn XSS attacks
   */
  contentSecurityPolicy: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Cần cho React inline scripts
      'https://cdn.jsdelivr.net',
      'https://cdnjs.cloudflare.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Cần cho Bootstrap inline styles
      'https://cdn.jsdelivr.net'
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      'http:'
    ],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
    'connect-src': ["'self'", 'https://api.yourdomain.com'],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"]
  },
  
  /**
   * Convert CSP object to header string
   */
  getCSPString() {
    return Object.entries(this.contentSecurityPolicy)
      .map(([key, values]) => `${key} ${values.join(' ')}`)
      .join('; ');
  },
  
  /**
   * All security headers
   */
  getAllHeaders() {
    return {
      // CSP
      'Content-Security-Policy': this.getCSPString(),
      
      // XSS Protection (legacy but still useful)
      'X-XSS-Protection': '1; mode=block',
      
      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // Clickjacking protection
      'X-Frame-Options': 'DENY',
      
      // Referrer policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Permissions policy
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      
      // HSTS (HTTPS only)
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    };
  }
};

/**
 * Apply security headers to fetch requests
 */
export const applySecurityHeaders = (headers = {}) => {
  return {
    ...headers,
    'X-Content-Type-Options': 'nosniff'
  };
};

/**
 * Meta tags for HTML <head>
 * IMPORTANT: Chỉ những headers có thể set qua meta tags
 */
import React from 'react';

export const SecurityMetaTags = () => {
  return (
    <>
      {/* Chỉ X-Content-Type-Options có thể set qua meta */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      
      {/* Referrer Policy */}
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      
      {/* Note: CSP, X-Frame-Options, HSTS phải set từ server, không dùng meta tags */}
    </>
  );
};

/**
 * For Express.js middleware
 */
export const expressSecurityMiddleware = (req, res, next) => {
  const headers = securityHeaders.getAllHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  next();
};

/**
 * For Next.js config
 */
export const nextSecurityHeaders = async () => {
  return Object.entries(securityHeaders.getAllHeaders()).map(([key, value]) => ({
    key,
    value
  }));
};

export default securityHeaders;