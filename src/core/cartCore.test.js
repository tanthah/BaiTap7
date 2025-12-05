import { cartCore } from './cartCore';

describe('cartCore', () => {
  test('addItem adds new product', () => {
    const cart = [];
    const product = { id: 1, name: 'Test', price: 10, quantity: 1 };
    const result = cartCore.addItem(cart, product);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(product);
  });

  test('addItem increments quantity for existing product', () => {
    const cart = [{ id: 1, name: 'Test', price: 10, quantity: 1 }];
    const product = { id: 1, name: 'Test', price: 10, quantity: 1 };
    const result = cartCore.addItem(cart, product);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(2);
  });

  test('removeItem removes product', () => {
    const cart = [{ id: 1, name: 'Test', price: 10, quantity: 1 }];
    const result = cartCore.removeItem(cart, 1, null);
    expect(result).toHaveLength(0);
  });

  test('calculateSubtotal returns correct total', () => {
    const cart = [
      { id: 1, price: 10, quantity: 2 },
      { id: 2, price: 5, quantity: 3 }
    ];
    const result = cartCore.calculateSubtotal(cart);
    expect(result).toBe(35);
  });
});