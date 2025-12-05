import { cartCore } from './cartCore.secure';

describe('cartCore', () => {
  describe('addItem', () => {
    test('adds new product to empty cart', () => {
      const cart = [];
      const product = { 
        id: 1, 
        name: 'Test Product', 
        price: 10, 
        quantity: 1,
        image: null,
        variant: null
      };
      
      const result = cartCore.addItem(cart, product);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].name).toBe('Test Product');
      expect(result[0].quantity).toBe(1);
    });

    test('increments quantity for existing product', () => {
      const cart = [{ 
        id: 1, 
        name: 'Test Product', 
        price: 10, 
        quantity: 1,
        image: null,
        variant: null
      }];
      const product = { 
        id: 1, 
        name: 'Test Product', 
        price: 10, 
        quantity: 1,
        image: null,
        variant: null
      };
      
      const result = cartCore.addItem(cart, product);
      
      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(2);
    });

    test('handles products with variants separately', () => {
      const cart = [{ 
        id: 1, 
        name: 'Test Product', 
        price: 10, 
        quantity: 1,
        image: null,
        variant: { color: 'red' }
      }];
      const product = { 
        id: 1, 
        name: 'Test Product', 
        price: 10, 
        quantity: 1,
        image: null,
        variant: { color: 'blue' }
      };
      
      const result = cartCore.addItem(cart, product);
      
      expect(result).toHaveLength(2);
    });

    test('throws error when cart is full', () => {
      const cart = new Array(50).fill({
        id: 1,
        name: 'Test',
        price: 10,
        quantity: 1,
        image: null,
        variant: null
      });
      const product = { 
        id: 51, 
        name: 'New Product', 
        price: 10, 
        quantity: 1,
        image: null,
        variant: null
      };
      
      expect(() => cartCore.addItem(cart, product)).toThrow();
    });

    test('validates product data', () => {
      const cart = [];
      const invalidProduct = { 
        id: 'invalid', 
        name: '', 
        price: -10 
      };
      
      expect(() => cartCore.addItem(cart, invalidProduct)).toThrow();
    });
  });

  describe('removeItem', () => {
    test('removes product from cart', () => {
      const cart = [
        { id: 1, name: 'Test 1', price: 10, quantity: 1, variant: null },
        { id: 2, name: 'Test 2', price: 20, quantity: 1, variant: null }
      ];
      
      const result = cartCore.removeItem(cart, 1, null);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    test('removes product with specific variant', () => {
      const cart = [
        { id: 1, name: 'Test', price: 10, quantity: 1, variant: { color: 'red' } },
        { id: 1, name: 'Test', price: 10, quantity: 1, variant: { color: 'blue' } }
      ];
      
      const result = cartCore.removeItem(cart, 1, { color: 'red' });
      
      expect(result).toHaveLength(1);
      expect(result[0].variant.color).toBe('blue');
    });
  });

  describe('updateQuantity', () => {
    test('updates quantity successfully', () => {
      const cart = [
        { id: 1, name: 'Test', price: 10, quantity: 1, variant: null }
      ];
      
      const result = cartCore.updateQuantity(cart, 1, null, 5);
      
      expect(result[0].quantity).toBe(5);
    });

    test('validates quantity range', () => {
      const cart = [
        { id: 1, name: 'Test', price: 10, quantity: 1, variant: null }
      ];
      
      // Should throw for quantity > 999
      expect(() => cartCore.updateQuantity(cart, 1, null, 1000)).toThrow();
      
      // Should throw for quantity < 1
      expect(() => cartCore.updateQuantity(cart, 1, null, 0)).toThrow();
    });
  });

  describe('calculateSubtotal', () => {
    test('calculates subtotal correctly', () => {
      const cart = [
        { id: 1, price: 10, quantity: 2 },
        { id: 2, price: 5, quantity: 3 }
      ];
      
      const result = cartCore.calculateSubtotal(cart);
      
      expect(result).toBe(35);
    });

    test('returns 0 for empty cart', () => {
      const result = cartCore.calculateSubtotal([]);
      expect(result).toBe(0);
    });

    test('handles invalid cart data', () => {
      const result = cartCore.calculateSubtotal(null);
      expect(result).toBe(0);
    });
  });

  describe('calculateTotal', () => {
    test('calculates total with discount and tax', () => {
      const cart = [
        { id: 1, price: 100, quantity: 1 }
      ];
      
      const result = cartCore.calculateTotal(cart, 10, 10, 5);
      
      // Subtotal: 100
      // Discount (10%): -10
      // Subtotal after discount: 90
      // Tax (10%): 9
      // Shipping: 5
      // Total: 104
      expect(result).toBe(104);
    });
  });

  describe('getItemCount', () => {
    test('counts total items correctly', () => {
      const cart = [
        { id: 1, quantity: 2 },
        { id: 2, quantity: 3 }
      ];
      
      const result = cartCore.getItemCount(cart);
      
      expect(result).toBe(5);
    });

    test('returns 0 for empty cart', () => {
      const result = cartCore.getItemCount([]);
      expect(result).toBe(0);
    });
  });

  describe('clearCart', () => {
    test('returns empty array', () => {
      const result = cartCore.clearCart();
      expect(result).toEqual([]);
    });
  });

  describe('applyDiscount', () => {
    test('applies discount correctly', () => {
      const result = cartCore.applyDiscount(100, 20);
      expect(result).toBe(80);
    });

    test('validates discount range', () => {
      const result = cartCore.applyDiscount(100, 150);
      expect(result).toBe(100); // Should cap at 100%
    });
  });
});