/**
 * CSRF Protection Utilities
 * Sử dụng cho các form và API requests
 */

import React from 'react';

export class CSRFProtection {
  static TOKEN_KEY = 'csrf_token';
  static TOKEN_HEADER = 'X-CSRF-Token';
  
  /**
   * Generate CSRF token
   */
  static generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Set CSRF token in session storage
   */
  static setToken(token = null) {
    const csrfToken = token || this.generateToken();
    sessionStorage.setItem(this.TOKEN_KEY, csrfToken);
    return csrfToken;
  }
  
  /**
   * Get current CSRF token
   */
  static getToken() {
    let token = sessionStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      token = this.setToken();
    }
    return token;
  }
  
  /**
   * Clear CSRF token
   */
  static clearToken() {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }
  
  /**
   * Add CSRF token to fetch request headers
   */
  static addTokenToHeaders(headers = {}) {
    return {
      ...headers,
      [this.TOKEN_HEADER]: this.getToken()
    };
  }
  
  /**
   * Validate CSRF token
   */
  static validateToken(token) {
    const currentToken = this.getToken();
    return token === currentToken;
  }
  
  /**
   * Create protected fetch wrapper
   */
  static async protectedFetch(url, options = {}) {
    const headers = this.addTokenToHeaders(options.headers);
    
    return fetch(url, {
      ...options,
      headers,
      credentials: 'same-origin' // Important for CSRF
    });
  }
}

/**
 * React Hook for CSRF protection
 */
export const useCSRF = () => {
  const [token, setToken] = React.useState(() => CSRFProtection.getToken());
  
  React.useEffect(() => {
    // Regenerate token on mount
    const newToken = CSRFProtection.setToken();
    setToken(newToken);
    
    // Cleanup on unmount
    return () => {
      // Optional: clear token on component unmount
      // CSRFProtection.clearToken();
    };
  }, []);
  
  return {
    token,
    refreshToken: () => {
      const newToken = CSRFProtection.setToken();
      setToken(newToken);
      return newToken;
    },
    validateToken: (tokenToValidate) => CSRFProtection.validateToken(tokenToValidate)
  };
};

/**
 * CSRF Token Component (for forms)
 */
export const CSRFTokenField = () => {
  const token = CSRFProtection.getToken();
  
  return (
    <input 
      type="hidden" 
      name="csrf_token" 
      value={token}
      readOnly
    />
  );
};

export default CSRFProtection;