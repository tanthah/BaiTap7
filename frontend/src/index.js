/**
 * React Bootstrap Cart Library - Main Entry Point
 * Export all public components, hooks, and utilities
 */

// ==================== CONTEXT & HOOKS ====================
export { CartProvider, useCart } from './context/CartContext.enhanced';

// ==================== CART COMPONENTS ====================
export { CartList, EmptyCart } from './components/cart/CartList';
export { CartItem } from './components/cart/CartItem';
export { CartSummary } from './components/cart/CartSummary';
export { AddToCartButton } from './components/cart/AddToCartButton';
export { CartBadge } from './components/cart/CartBadge';
export { DiscountCodeInput } from './components/cart/DiscountCodeInput';

// ==================== UI COMPONENTS ====================
export { QuantitySelector } from './components/ui/QuantitySelector';
export { ErrorAlert } from './components/ui/ErrorAlert';

// ==================== CORE UTILITIES ====================
export { cartCore, storage } from './core/cartCore.secure';

// ==================== SECURITY UTILITIES ====================
export { sanitize, validators, RateLimiter, CartError } from './security/sanitizer';
export { default as XSSProtection, SafeHTML, useSanitizedInput, FileUploadProtection } from './security/xssProtection';
export { default as CSRFProtection, useCSRF, CSRFTokenField } from './security/csrfProtection';
export { SecurityMetaTags, securityHeaders } from './security/securityHeader';

// ==================== GRAPHQL (Optional) ====================
export { default as apolloClient } from './graphql/client';
export * from './graphql/operations';
export * from './graphql/hooks';

// ==================== VERSION ====================
export const VERSION = '1.0.0';