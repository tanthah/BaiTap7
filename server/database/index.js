/**
 * Mock Database Layer
 * Trong production, thay thế bằng database thực (PostgreSQL, MongoDB, etc.)
 */

const { v4: uuidv4 } = require('uuid');

// In-memory storage
const storage = {
  users: new Map(),
  products: new Map(),
  carts: new Map(),
  cartItems: new Map(),
  orders: new Map(),
  discounts: new Map(),
};

// Seed initial data
const seedData = () => {
  // Sample products
  const products = [
    {
      id: '1',
      name: 'iPhone 15 Pro',
      price: 999,
      description: 'Latest iPhone with A17 Pro chip',
      image: 'https://via.placeholder.com/300x300?text=iPhone+15+Pro',
      stock: 50,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'MacBook Air M3',
      price: 1299,
      description: 'Powerful and portable',
      image: 'https://via.placeholder.com/300x300?text=MacBook+Air',
      stock: 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'AirPods Pro',
      price: 249,
      description: 'Active noise cancellation',
      image: 'https://via.placeholder.com/300x300?text=AirPods+Pro',
      stock: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '4',
      name: 'Apple Watch Series 9',
      price: 399,
      description: 'Advanced health features',
      image: 'https://via.placeholder.com/300x300?text=Apple+Watch',
      stock: 75,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  products.forEach(product => storage.products.set(product.id, product));

  // Sample discount codes
  const discounts = [
    {
      id: '1',
      code: 'SAVE10',
      percentage: 10,
      maxUses: 100,
      usedCount: 0,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      code: 'SAVE20',
      percentage: 20,
      maxUses: 50,
      usedCount: 0,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      code: 'WELCOME',
      percentage: 15,
      maxUses: 200,
      usedCount: 0,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    },
  ];

  discounts.forEach(discount => storage.discounts.set(discount.code, discount));

  // Sample user (for testing)
  storage.users.set('user-1', {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date().toISOString(),
  });
};

// Database API
const db = {
  // Users
  users: {
    findById: async (id) => {
      return storage.users.get(id) || null;
    },
    
    findByEmail: async (email) => {
      return Array.from(storage.users.values()).find(u => u.email === email) || null;
    },
  },

  // Products
  products: {
    findAll: async ({ limit = 20, offset = 0 }) => {
      const products = Array.from(storage.products.values());
      return products.slice(offset, offset + limit);
    },
    
    findById: async (id) => {
      return storage.products.get(id) || null;
    },
    
    decreaseStock: async (id, quantity) => {
      const product = storage.products.get(id);
      if (product) {
        product.stock -= quantity;
        product.updatedAt = new Date().toISOString();
        storage.products.set(id, product);
      }
      return product;
    },
  },

  // Carts
  carts: {
    findByUserId: async (userId) => {
      return Array.from(storage.carts.values()).find(c => c.userId === userId) || null;
    },
    
    create: async ({ userId }) => {
      const cart = {
        id: uuidv4(),
        userId,
        items: [],
        discount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      storage.carts.set(cart.id, cart);
      return cart;
    },
    
    addItem: async (cartId, itemData) => {
      const cart = storage.carts.get(cartId);
      if (!cart) throw new Error('Cart not found');
      
      // Check if item already exists
      const existingItemIndex = cart.items.findIndex(
        item => item.productId === itemData.productId && 
                JSON.stringify(item.variant) === JSON.stringify(itemData.variant)
      );
      
      if (existingItemIndex !== -1) {
        // Update quantity
        cart.items[existingItemIndex].quantity += itemData.quantity;
      } else {
        // Add new item
        const newItem = {
          id: uuidv4(),
          productId: itemData.productId,
          quantity: itemData.quantity,
          variant: itemData.variant || null,
          price: itemData.price,
          addedAt: new Date().toISOString(),
        };
        cart.items.push(newItem);
      }
      
      cart.updatedAt = new Date().toISOString();
      storage.carts.set(cartId, cart);
      return cart;
    },
    
    updateItemQuantity: async (cartId, itemId, quantity) => {
      const cart = storage.carts.get(cartId);
      if (!cart) throw new Error('Cart not found');
      
      const item = cart.items.find(i => i.id === itemId);
      if (!item) throw new Error('Item not found');
      
      item.quantity = quantity;
      cart.updatedAt = new Date().toISOString();
      storage.carts.set(cartId, cart);
      return cart;
    },
    
    removeItem: async (cartId, itemId) => {
      const cart = storage.carts.get(cartId);
      if (!cart) throw new Error('Cart not found');
      
      cart.items = cart.items.filter(i => i.id !== itemId);
      cart.updatedAt = new Date().toISOString();
      storage.carts.set(cartId, cart);
      return cart;
    },
    
    removeMultipleItems: async (cartId, itemIds) => {
      const cart = storage.carts.get(cartId);
      if (!cart) throw new Error('Cart not found');
      
      cart.items = cart.items.filter(i => !itemIds.includes(i.id));
      cart.updatedAt = new Date().toISOString();
      storage.carts.set(cartId, cart);
      return cart;
    },
    
    clear: async (cartId) => {
      const cart = storage.carts.get(cartId);
      if (!cart) throw new Error('Cart not found');
      
      cart.items = [];
      cart.discount = 0;
      cart.updatedAt = new Date().toISOString();
      storage.carts.set(cartId, cart);
      return cart;
    },
    
    applyDiscount: async (cartId, percentage) => {
      const cart = storage.carts.get(cartId);
      if (!cart) throw new Error('Cart not found');
      
      cart.discount = percentage;
      cart.updatedAt = new Date().toISOString();
      storage.carts.set(cartId, cart);
      return cart;
    },
    
    removeDiscount: async (cartId) => {
      const cart = storage.carts.get(cartId);
      if (!cart) throw new Error('Cart not found');
      
      cart.discount = 0;
      cart.updatedAt = new Date().toISOString();
      storage.carts.set(cartId, cart);
      return cart;
    },
  },

  // Discounts
  discounts: {
    findByCode: async (code) => {
      const discount = storage.discounts.get(code.toUpperCase());
      
      if (!discount) return null;
      
      // Check if valid
      const now = new Date();
      const expiresAt = new Date(discount.expiresAt);
      const isExpired = expiresAt < now;
      const isMaxUsed = discount.usedCount >= discount.maxUses;
      
      return {
        ...discount,
        valid: !isExpired && !isMaxUsed,
      };
    },
    
    incrementUsage: async (id) => {
      for (const [code, discount] of storage.discounts.entries()) {
        if (discount.id === id) {
          discount.usedCount++;
          storage.discounts.set(code, discount);
          return discount;
        }
      }
      return null;
    },
  },

  // Orders
  orders: {
    create: async (orderData) => {
      const order = {
        id: uuidv4(),
        ...orderData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      storage.orders.set(order.id, order);
      return order;
    },
    
    findById: async (id) => {
      return storage.orders.get(id) || null;
    },
    
    findByUserId: async (userId) => {
      return Array.from(storage.orders.values()).filter(o => o.userId === userId);
    },
  },
};

// Initialize seed data
seedData();

module.exports = db;