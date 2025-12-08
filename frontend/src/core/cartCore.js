export const CART_STORAGE_KEY = 'shopping_cart';

export const storage = {
  save: (cart) => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      return true;
    } catch (error) {
      console.error('Failed to save cart:', error);
      return false;
    }
  },
  
  load: () => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load cart:', error);
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
    const existingIndex = cart.findIndex(item => 
      item.id === product.id && 
      JSON.stringify(item.variant) === JSON.stringify(product.variant)
    );
    
    if (existingIndex !== -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += product.quantity || 1;
      return newCart;
    }
    
    return [...cart, { ...product, quantity: product.quantity || 1 }];
  },
  
  removeItem: (cart, id, variant) => {
    return cart.filter(item => 
      !(item.id === id && JSON.stringify(item.variant) === JSON.stringify(variant))
    );
  },
  
  updateQuantity: (cart, id, variant, quantity) => {
    if (quantity <= 0) return cart;
    return cart.map(item => 
      item.id === id && JSON.stringify(item.variant) === JSON.stringify(variant)
        ? { ...item, quantity: Math.max(1, quantity) }
        : item
    );
  },
  
  clearCart: () => [],
  
  calculateSubtotal: (cart) => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },
  
  calculateTotal: (cart, discount = 0, tax = 0, shipping = 0) => {
    const subtotal = cartCore.calculateSubtotal(cart);
    const discountAmount = subtotal * (discount / 100);
    const taxAmount = (subtotal - discountAmount) * (tax / 100);
    return subtotal - discountAmount + taxAmount + shipping;
  },
  
  getItemCount: (cart) => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  },
  
  applyDiscount: (amount, discountPercent) => {
    return amount * (1 - discountPercent / 100);
  }
};