import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartCore, storage } from '../core/cartCore.secure';
import { RateLimiter, CartError } from '../security/sanitizer';
import CSRFProtection from '../security/csrfProtection';

const CartContext = createContext(null);

export const CartProvider = ({ children, config = {} }) => {
  const {
    persistCart = true,
    taxRate = 10,
    freeShippingThreshold = 100,
    shippingFee = 10,
    enableRateLimit = true,
    maxRequestsPerMinute = 20
  } = config;
  
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Initialize rate limiter
  const [rateLimiter] = useState(() => 
    enableRateLimit ? new RateLimiter(maxRequestsPerMinute, 60000) : null
  );
  
  // Initialize CSRF protection
  useEffect(() => {
    CSRFProtection.setToken();
  }, []);
  
  // Load cart from storage on mount
  useEffect(() => {
    if (persistCart) {
      try {
        const savedCart = storage.load();
        setCart(savedCart);
      } catch (error) {
        console.error('Failed to load cart:', error);
        setError('Failed to load saved cart');
      }
    }
  }, [persistCart]);
  
  // Save cart to storage on change
  useEffect(() => {
    if (persistCart && cart.length >= 0) {
      try {
        storage.save(cart);
      } catch (error) {
        console.error('Failed to save cart:', error);
        setError('Failed to save cart');
      }
    }
  }, [cart, persistCart]);
  
  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  /**
   * Add item with rate limiting and error handling
   */
  const addItem = useCallback(async (product) => {
    try {
      // Check rate limit
      if (rateLimiter) {
        rateLimiter.canMakeRequest('addItem');
      }
      
      setLoading(true);
      setError(null);
      
      // Add item with validation
      const newCart = cartCore.addItem(cart, product);
      setCart(newCart);
      
      return true;
    } catch (error) {
      console.error('Add item error:', error);
      
      if (error instanceof CartError) {
        setError(error.message);
      } else {
        setError('Failed to add item to cart');
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [cart, rateLimiter]);
  
  /**
   * Remove item with confirmation
   */
  const removeItem = useCallback((id, variant = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const newCart = cartCore.removeItem(cart, id, variant);
      setCart(newCart);
      
      return true;
    } catch (error) {
      console.error('Remove item error:', error);
      setError('Failed to remove item');
      return false;
    } finally {
      setLoading(false);
    }
  }, [cart]);
  
  /**
   * Update quantity with validation
   */
  const updateQuantity = useCallback((id, variant, quantity) => {
    try {
      // Check rate limit
      if (rateLimiter) {
        rateLimiter.canMakeRequest('updateQuantity');
      }
      
      setLoading(true);
      setError(null);
      
      const newCart = cartCore.updateQuantity(cart, id, variant, quantity);
      setCart(newCart);
      
      return true;
    } catch (error) {
      console.error('Update quantity error:', error);
      
      if (error instanceof CartError) {
        setError(error.message);
      } else {
        setError('Failed to update quantity');
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [cart, rateLimiter]);
  
  /**
   * Clear cart with confirmation
   */
  const clearCart = useCallback(() => {
    try {
      setCart(cartCore.clearCart());
      if (persistCart) storage.clear();
      setError(null);
      return true;
    } catch (error) {
      console.error('Clear cart error:', error);
      setError('Failed to clear cart');
      return false;
    }
  }, [persistCart]);
  
  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  /**
   * Apply discount code (with validation)
   */
  const applyDiscount = useCallback((code, percentage) => {
    try {
      if (typeof code !== 'string' || code.length < 3) {
        throw new Error('Invalid discount code');
      }
      
      if (percentage < 0 || percentage > 100) {
        throw new Error('Invalid discount percentage');
      }
      
      setDiscount(percentage);
      setError(null);
      return true;
    } catch (error) {
      console.error('Apply discount error:', error);
      setError(error.message);
      return false;
    }
  }, []);
  
  /**
   * Remove discount
   */
  const removeDiscount = useCallback(() => {
    setDiscount(0);
  }, []);
  
  // Calculate totals
  const subtotal = cartCore.calculateSubtotal(cart);
  const discountAmount = subtotal * (discount / 100);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const tax = subtotalAfterDiscount * (taxRate / 100);
  const shipping = subtotal >= freeShippingThreshold ? 0 : shippingFee;
  const total = subtotalAfterDiscount + tax + shipping;
  const itemCount = cartCore.getItemCount(cart);
  
  const value = {
    // State
    cart,
    loading,
    error,
    
    // Actions
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    clearError,
    
    // Discount
    discount,
    setDiscount,
    applyDiscount,
    removeDiscount,
    discountAmount,
    
    // Calculations
    subtotal,
    tax,
    shipping,
    total,
    itemCount,
    
    // Config
    config: {
      taxRate,
      freeShippingThreshold,
      shippingFee
    }
  };
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export default CartProvider;