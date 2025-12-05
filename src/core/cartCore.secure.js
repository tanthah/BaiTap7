import { validators, sanitize, CartError } from '../security/sanitizer';

export const CART_STORAGE_KEY = 'shopping_cart_secure_v1';
export const MAX_CART_SIZE = 50;
export const MAX_STORAGE_SIZE = 5242880; // 5MB

export const storage = {
  save: (cart) => {
    try {
      if (!Array.isArray(cart)) {
        throw new CartError('Invalid cart data format', 'INVALID_FORMAT');
      }
      
      if (cart.length > MAX_CART_SIZE) {
        throw new CartError(
          `Cart size exceeds limit (${MAX_CART_SIZE} items)`,
          'SIZE_LIMIT'
        );
      }
      
      // Validate and sanitize each item before saving
      const validatedCart = cart.map(item => {
        try {
          return validators.cartItem(item);
        } catch (error) {
          console.warn('Skipping invalid cart item:', error);
          return null;
        }
      }).filter(Boolean);
      
      const data = JSON.stringify(validatedCart);
      
      // Check storage size limit
      if (data.length > MAX_STORAGE_SIZE) {
        throw new CartError('Cart data too large', 'STORAGE_LIMIT');
      }
      
      localStorage.setItem(CART_STORAGE_KEY, data);
      return true;
      
    } catch (error) {
      console.error('Failed to save cart:', error);
      if (error instanceof CartError) {
        throw error;
      }
      throw new CartError('Failed to save cart', 'STORAGE_ERROR');
    }
  },
  
  load: () => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (!saved) return [];
      
      const parsed = JSON.parse(saved);
      
      // Validate it's an array
      if (!Array.isArray(parsed)) {
        console.warn('Invalid cart format in storage, resetting...');
        storage.clear();
        return [];
      }
      
      // Validate and sanitize each item
      const validatedCart = parsed
        .map(item => {
          try {
            return validators.cartItem(item);
          } catch (error) {
            console.warn('Invalid item in cart, removing:', error);
            return null;
          }
        })
        .filter(Boolean)
        .slice(0, MAX_CART_SIZE); // Enforce size limit
      
      // If validation removed items, save cleaned version
      if (validatedCart.length !== parsed.length) {
        storage.save(validatedCart);
      }
      
      return validatedCart;
      
    } catch (error) {
      console.error('Failed to load cart:', error);
      // Clear corrupted data
      storage.clear();
      return [];
    }
  },
  
  clear: () => {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear cart:', error);
      return false;
    }
  }
};

export const cartCore = {
  addItem: (cart, product) => {
    try {
      // Validate and sanitize product
      const validProduct = validators.cartItem(product);
      
      // Check cart size limit
      const currentSize = cart.reduce((sum, item) => 
        sum + (item.id === validProduct.id && 
               JSON.stringify(item.variant) === JSON.stringify(validProduct.variant) ? 0 : 1),
        0
      );
      
      if (currentSize >= MAX_CART_SIZE) {
        throw new CartError(
          `Cannot add more items. Cart limit is ${MAX_CART_SIZE} items.`,
          'CART_FULL'
        );
      }
      
      // Find existing item
      const existingIndex = cart.findIndex(item => 
        item.id === validProduct.id && 
        JSON.stringify(item.variant) === JSON.stringify(validProduct.variant)
      );
      
      if (existingIndex !== -1) {
        // Update existing item quantity
        const newCart = [...cart];
        const newQuantity = newCart[existingIndex].quantity + validProduct.quantity;
        
        // Validate new quantity
        try {
          newCart[existingIndex].quantity = validators.quantity(newQuantity);
        } catch (error) {
          throw new CartError(
            `Maximum quantity is 999 per item`,
            'QUANTITY_LIMIT'
          );
        }
        
        return newCart;
      }
      
      // Add new item
      return [...cart, validProduct];
      
    } catch (error) {
      if (error instanceof CartError) {
        throw error;
      }
      throw new CartError('Failed to add item to cart', 'ADD_FAILED');
    }
  },
  
  removeItem: (cart, id, variant = null) => {
    try {
      const validId = validators.productId(id);
      const sanitizedVariant = variant ? sanitize.object(variant) : null;
      
      return cart.filter(item => 
        !(item.id === validId && 
          JSON.stringify(item.variant) === JSON.stringify(sanitizedVariant))
      );
    } catch (error) {
      console.error('Failed to remove item:', error);
      return cart;
    }
  },
  
  updateQuantity: (cart, id, variant, quantity) => {
    try {
      const validId = validators.productId(id);
      const validQuantity = validators.quantity(quantity);
      const sanitizedVariant = variant ? sanitize.object(variant) : null;
      
      return cart.map(item => 
        item.id === validId && 
        JSON.stringify(item.variant) === JSON.stringify(sanitizedVariant)
          ? { ...item, quantity: validQuantity }
          : item
      );
    } catch (error) {
      console.error('Failed to update quantity:', error);
      throw new CartError('Failed to update quantity', 'UPDATE_FAILED');
    }
  },
  
  clearCart: () => [],
  
  calculateSubtotal: (cart) => {
    try {
      if (!Array.isArray(cart)) return 0;
      
      const subtotal = cart.reduce((sum, item) => {
        const price = validators.price(item.price);
        const quantity = validators.quantity(item.quantity);
        return sum + (price * quantity);
      }, 0);
      
      return Math.round(subtotal * 100) / 100;
    } catch (error) {
      console.error('Failed to calculate subtotal:', error);
      return 0;
    }
  },
  
  calculateTotal: (cart, discount = 0, tax = 0, shipping = 0) => {
    try {
      const subtotal = cartCore.calculateSubtotal(cart);
      const discountAmount = subtotal * (sanitize.number(discount, 0, 100) / 100);
      const taxAmount = (subtotal - discountAmount) * (sanitize.number(tax, 0, 100) / 100);
      const shippingFee = sanitize.number(shipping, 0, 1000);
      
      const total = subtotal - discountAmount + taxAmount + shippingFee;
      return Math.round(total * 100) / 100;
    } catch (error) {
      console.error('Failed to calculate total:', error);
      return 0;
    }
  },
  
  getItemCount: (cart) => {
    try {
      if (!Array.isArray(cart)) return 0;
      return cart.reduce((sum, item) => sum + validators.quantity(item.quantity), 0);
    } catch (error) {
      console.error('Failed to get item count:', error);
      return 0;
    }
  },
  
  applyDiscount: (amount, discountPercent) => {
    try {
      const validAmount = sanitize.number(amount, 0);
      const validDiscount = sanitize.number(discountPercent, 0, 100);
      return validAmount * (1 - validDiscount / 100);
    } catch (error) {
      console.error('Failed to apply discount:', error);
      return amount;
    }
  }
};
