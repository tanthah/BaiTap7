import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartCore, storage } from '../core/cartCore';

const CartContext = createContext(null);

export const CartProvider = ({ children, config = {} }) => {
  const {
    persistCart = true,
    taxRate = 10,
    freeShippingThreshold = 100,
    shippingFee = 10
  } = config;
  
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  
  // Load cart from storage on mount
  useEffect(() => {
    if (persistCart) {
      const savedCart = storage.load();
      setCart(savedCart);
    }
  }, [persistCart]);
  
  // Save cart to storage on change
  useEffect(() => {
    if (persistCart && cart.length >= 0) {
      storage.save(cart);
    }
  }, [cart, persistCart]);
  
  const addItem = (product) => {
    setCart(prev => cartCore.addItem(prev, product));
  };
  
  const removeItem = (id, variant = null) => {
    setCart(prev => cartCore.removeItem(prev, id, variant));
  };
  
  const updateQuantity = (id, variant, quantity) => {
    setCart(prev => cartCore.updateQuantity(prev, id, variant, quantity));
  };
  
  const clearCart = () => {
    setCart(cartCore.clearCart());
    if (persistCart) storage.clear();
  };
  
  const subtotal = cartCore.calculateSubtotal(cart);
  const discountAmount = subtotal * (discount / 100);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const tax = subtotalAfterDiscount * (taxRate / 100);
  const shipping = subtotal >= freeShippingThreshold ? 0 : shippingFee;
  const total = subtotalAfterDiscount + tax + shipping;
  const itemCount = cartCore.getItemCount(cart);
  
  return (
    <CartContext.Provider value={{
      cart,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      subtotal,
      discount,
      setDiscount,
      discountAmount,
      tax,
      shipping,
      total,
      itemCount,
      config
    }}>
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
