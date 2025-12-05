// Core exports
export { cartCore, storage } from './core/cartCore.secure';

// Security exports
export { 
  sanitize, 
  validators, 
  RateLimiter, 
  CartError 
} from './security/sanitizer';

// Context exports
export { CartProvider, useCart } from './context/CartContext.enhanced';

// UI Component exports
export { QuantitySelector } from './components/ui/QuantitySelector';
export { ErrorAlert } from './components/ui/ErrorAlert';

// Cart Component exports
export { CartItem } from './components/cart/CartItem';
export { CartList, EmptyCart } from './components/cart/CartList';
export { CartSummary } from './components/cart/CartSummary';
export { AddToCartButton } from './components/cart/AddToCartButton';
export { CartBadge } from './components/cart/CartBadge';