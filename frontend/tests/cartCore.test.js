import { cartCore } from '../src/core/cartCore.secure';

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
        variant: 'A'
      }];
      const product = { 
        id: 1, 
        name: 'Test Product',
        price: 10, 
        quantity: 1,
        image: null,
        variant: 'B'
      };
      const result = cartCore.addItem(cart, product);
      
      expect(result).toHaveLength(2);
      expect(result[0].variant).toBe('A');
      expect(result[1].variant).toBe('B');
    });
  });

  describe('removeItem', () => {
    test('removes product from cart', () => {
      const cart = [{ 
        id: 1,
        name: 'Test Product', 
        price: 10, 
        quantity: 1,
        image: null,
        variant: null
      }];
      const productId = 1;
      const result = cartCore.removeItem(cart, productId);
      
      expect(result).toHaveLength(0);
    });

    test('does not change cart if product not found', () => {
      const cart = [{ 
        id: 1, 
        name: 'Test Product',
        price: 10,
        quantity: 1,
        image: null,
        variant: null
      }];
      const productId = 2;
      const result = cartCore.removeItem(cart, productId);
      expect(result).toHaveLength(1);
    });
  });
});