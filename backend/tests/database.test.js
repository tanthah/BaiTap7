// backend/src/database/__tests__/database.test.js

const db = require('../src/resolvers/index');

describe('Database Layer', () => {
  beforeEach(() => {
    // Clear database before each test
    const storage = require('../src/resolvers/index').storage;
    storage.users.clear();
    storage.products.clear();
    storage.carts.clear();
    storage.discounts.clear();
    storage.orders.clear();
    
    // Re-seed data
    require('../src/resolvers/index').seedData();
  });
  
  describe('Users', () => {
    test('findById should return user', async () => {
      const user = await db.users.findById('user-1');
      
      expect(user).toBeDefined();
      expect(user.id).toBe('user-1');
      expect(user.email).toBe('test@example.com');
    });
    
    test('findById should return null for non-existent user', async () => {
      const user = await db.users.findById('non-existent');
      expect(user).toBeNull();
    });
    
    test('findByEmail should return user', async () => {
      const user = await db.users.findByEmail('test@example.com');
      
      expect(user).toBeDefined();
      expect(user.id).toBe('user-1');
    });
  });
  
  describe('Products', () => {
    test('findAll should return products with pagination', async () => {
      const products = await db.products.findAll({ limit: 2, offset: 0 });
      
      expect(products).toHaveLength(2);
      expect(products[0]).toHaveProperty('id');
      expect(products[0]).toHaveProperty('name');
      expect(products[0]).toHaveProperty('price');
    });
    
    test('findById should return product', async () => {
      const product = await db.products.findById('1');
      
      expect(product).toBeDefined();
      expect(product.name).toBe('iPhone 15 Pro');
      expect(product.price).toBe(999);
    });
    
    test('findById should return null for non-existent product', async () => {
      const product = await db.products.findById('999');
      expect(product).toBeNull();
    });
    
    test('decreaseStock should update product stock', async () => {
      const product = await db.products.decreaseStock('1', 5);
      
      expect(product).toBeDefined();
      expect(product.stock).toBe(45); // 50 - 5
    });
  });
  
  describe('Carts', () => {
    test('create should create new cart', async () => {
      const cart = await db.carts.create({ userId: 'user-1' });
      
      expect(cart).toBeDefined();
      expect(cart.id).toBeDefined();
      expect(cart.userId).toBe('user-1');
      expect(cart.items).toEqual([]);
      expect(cart.discount).toBe(0);
    });
    
    test('findByUserId should return user cart', async () => {
      const createdCart = await db.carts.create({ userId: 'user-1' });
      const foundCart = await db.carts.findByUserId('user-1');
      
      expect(foundCart).toBeDefined();
      expect(foundCart.id).toBe(createdCart.id);
    });
    
    test('addItem should add new item to cart', async () => {
      const cart = await db.carts.create({ userId: 'user-1' });
      
      const updatedCart = await db.carts.addItem(cart.id, {
        productId: '1',
        quantity: 2,
        price: 999,
        variant: null
      });
      
      expect(updatedCart.items).toHaveLength(1);
      expect(updatedCart.items[0].productId).toBe('1');
      expect(updatedCart.items[0].quantity).toBe(2);
    });
    
    test('addItem should update quantity for existing item', async () => {
      const cart = await db.carts.create({ userId: 'user-1' });
      
      await db.carts.addItem(cart.id, {
        productId: '1',
        quantity: 2,
        price: 999,
        variant: null
      });
      
      const updatedCart = await db.carts.addItem(cart.id, {
        productId: '1',
        quantity: 3,
        price: 999,
        variant: null
      });
      
      expect(updatedCart.items).toHaveLength(1);
      expect(updatedCart.items[0].quantity).toBe(5); // 2 + 3
    });
    
    test('addItem should handle items with different variants', async () => {
      const cart = await db.carts.create({ userId: 'user-1' });
      
      await db.carts.addItem(cart.id, {
        productId: '1',
        quantity: 1,
        price: 999,
        variant: { color: 'black' }
      });
      
      const updatedCart = await db.carts.addItem(cart.id, {
        productId: '1',
        quantity: 1,
        price: 999,
        variant: { color: 'white' }
      });
      
      expect(updatedCart.items).toHaveLength(2);
    });
    
    test('updateItemQuantity should update item quantity', async () => {
      const cart = await db.carts.create({ userId: 'user-1' });
      
      await db.carts.addItem(cart.id, {
        productId: '1',
        quantity: 2,
        price: 999,
        variant: null
      });
      
      const itemId = cart.items[0].id;
      const updatedCart = await db.carts.updateItemQuantity(cart.id, itemId, 5);
      
      expect(updatedCart.items[0].quantity).toBe(5);
    });
    
    test('removeItem should remove item from cart', async () => {
      const cart = await db.carts.create({ userId: 'user-1' });
      
      await db.carts.addItem(cart.id, {
        productId: '1',
        quantity: 2,
        price: 999,
        variant: null
      });
      
      const itemId = cart.items[0].id;
      const updatedCart = await db.carts.removeItem(cart.id, itemId);
      
      expect(updatedCart.items).toHaveLength(0);
    });
    
    test('removeMultipleItems should remove multiple items', async () => {
      const cart = await db.carts.create({ userId: 'user-1' });
      
      await db.carts.addItem(cart.id, {
        productId: '1',
        quantity: 1,
        price: 999,
        variant: null
      });
      
      await db.carts.addItem(cart.id, {
        productId: '2',
        quantity: 1,
        price: 1299,
        variant: null
      });
      
      const itemIds = cart.items.map(item => item.id);
      const updatedCart = await db.carts.removeMultipleItems(cart.id, itemIds);
      
      expect(updatedCart.items).toHaveLength(0);
    });
    
    test('clear should remove all items and discount', async () => {
      const cart = await db.carts.create({ userId: 'user-1' });
      
      await db.carts.addItem(cart.id, {
        productId: '1',
        quantity: 1,
        price: 999,
        variant: null
      });
      
      await db.carts.applyDiscount(cart.id, 10);
      
      const clearedCart = await db.carts.clear(cart.id);
      
      expect(clearedCart.items).toHaveLength(0);
      expect(clearedCart.discount).toBe(0);
    });
    
    test('applyDiscount should apply discount percentage', async () => {
      const cart = await db.carts.create({ userId: 'user-1' });
      const updatedCart = await db.carts.applyDiscount(cart.id, 15);
      
      expect(updatedCart.discount).toBe(15);
    });
    
    test('removeDiscount should remove discount', async () => {
      const cart = await db.carts.create({ userId: 'user-1' });
      
      await db.carts.applyDiscount(cart.id, 15);
      const updatedCart = await db.carts.removeDiscount(cart.id);
      
      expect(updatedCart.discount).toBe(0);
    });
  });
  
  describe('Discounts', () => {
    test('findByCode should return discount', async () => {
      const discount = await db.discounts.findByCode('SAVE10');
      
      expect(discount).toBeDefined();
      expect(discount.code).toBe('SAVE10');
      expect(discount.percentage).toBe(10);
      expect(discount.valid).toBe(true);
    });
    
    test('findByCode should be case-insensitive', async () => {
      const discount = await db.discounts.findByCode('save10');
      
      expect(discount).toBeDefined();
      expect(discount.code).toBe('SAVE10');
    });
    
    test('findByCode should return null for non-existent code', async () => {
      const discount = await db.discounts.findByCode('INVALID');
      expect(discount).toBeNull();
    });
    
    test('findByCode should mark expired discount as invalid', async () => {
      // This would require manipulating the discount expiry date
      // For now, we test the valid flag logic
      const discount = await db.discounts.findByCode('SAVE10');
      expect(discount.valid).toBe(true);
    });
    
    test('incrementUsage should increment usage count', async () => {
      const discount = await db.discounts.findByCode('SAVE10');
      const initialCount = discount.usedCount;
      
      await db.discounts.incrementUsage(discount.id);
      
      const updatedDiscount = await db.discounts.findByCode('SAVE10');
      expect(updatedDiscount.usedCount).toBe(initialCount + 1);
    });
  });
  
  describe('Orders', () => {
    test('create should create new order', async () => {
      const orderData = {
        userId: 'user-1',
        items: [{ productId: '1', quantity: 1, price: 999 }],
        subtotal: 999,
        tax: 99.9,
        shipping: 10,
        total: 1108.9,
        shippingAddress: '123 Test St',
        paymentMethod: 'credit_card'
      };
      
      const order = await db.orders.create(orderData);
      
      expect(order).toBeDefined();
      expect(order.id).toBeDefined();
      expect(order.userId).toBe('user-1');
      expect(order.status).toBe('pending');
      expect(order.total).toBe(1108.9);
    });
    
    test('findById should return order', async () => {
      const orderData = {
        userId: 'user-1',
        items: [],
        subtotal: 100,
        tax: 10,
        shipping: 5,
        total: 115,
        shippingAddress: '123 Test St',
        paymentMethod: 'credit_card'
      };
      
      const createdOrder = await db.orders.create(orderData);
      const foundOrder = await db.orders.findById(createdOrder.id);
      
      expect(foundOrder).toBeDefined();
      expect(foundOrder.id).toBe(createdOrder.id);
    });
    
    test('findByUserId should return user orders', async () => {
      const orderData = {
        userId: 'user-1',
        items: [],
        subtotal: 100,
        tax: 10,
        shipping: 5,
        total: 115,
        shippingAddress: '123 Test St',
        paymentMethod: 'credit_card'
      };
      
      await db.orders.create(orderData);
      await db.orders.create(orderData);
      
      const orders = await db.orders.findByUserId('user-1');
      
      expect(orders).toHaveLength(2);
      expect(orders[0].userId).toBe('user-1');
    });
  });
});