// backend/src/resolvers/__tests__/resolvers.test.js

const resolvers = require('../src/resolvers/index');
const db = require('../src/database');

// Mock database
jest.mock('../../database');

describe('GraphQL Resolvers', () => {
  let mockContext;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock context
    mockContext = {
      user: { id: 'user-1', email: 'test@example.com' },
      db
    };
  });
  
  describe('Query.getCart', () => {
    it('should return existing cart', async () => {
      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        items: [],
        discount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      db.carts.findByUserId.mockResolvedValue(mockCart);
      
      const result = await resolvers.Query.getCart(null, {}, mockContext);
      
      expect(result).toEqual(mockCart);
      expect(db.carts.findByUserId).toHaveBeenCalledWith('user-1');
    });
    
    it('should create new cart if none exists', async () => {
      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        items: [],
        discount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      db.carts.findByUserId.mockResolvedValue(null);
      db.carts.create.mockResolvedValue(mockCart);
      
      const result = await resolvers.Query.getCart(null, {}, mockContext);
      
      expect(result).toEqual(mockCart);
      expect(db.carts.create).toHaveBeenCalledWith({ userId: 'user-1' });
    });
    
    it('should throw error if not authenticated', async () => {
      mockContext.user = null;
      
      await expect(
        resolvers.Query.getCart(null, {}, mockContext)
      ).rejects.toThrow('You must be logged in');
    });
  });
  
  describe('Query.getProducts', () => {
    it('should return products with default pagination', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', price: 100 },
        { id: '2', name: 'Product 2', price: 200 }
      ];
      
      db.products.findAll.mockResolvedValue(mockProducts);
      
      const result = await resolvers.Query.getProducts(null, {}, mockContext);
      
      expect(result).toEqual(mockProducts);
      expect(db.products.findAll).toHaveBeenCalledWith({ limit: 20, offset: 0 });
    });
    
    it('should support custom pagination', async () => {
      db.products.findAll.mockResolvedValue([]);
      
      await resolvers.Query.getProducts(
        null, 
        { limit: 10, offset: 20 }, 
        mockContext
      );
      
      expect(db.products.findAll).toHaveBeenCalledWith({ limit: 10, offset: 20 });
    });
  });
  
  describe('Query.getProduct', () => {
    it('should return product by id', async () => {
      const mockProduct = { id: '1', name: 'Test Product', price: 100 };
      
      db.products.findById.mockResolvedValue(mockProduct);
      
      const result = await resolvers.Query.getProduct(
        null, 
        { id: '1' }, 
        mockContext
      );
      
      expect(result).toEqual(mockProduct);
    });
    
    it('should throw error if product not found', async () => {
      db.products.findById.mockResolvedValue(null);
      
      await expect(
        resolvers.Query.getProduct(null, { id: '999' }, mockContext)
      ).rejects.toThrow('Product not found');
    });
  });
  
  describe('Mutation.addToCart', () => {
    it('should add product to cart', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Product',
        price: 100,
        stock: 50
      };
      
      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        items: []
      };
      
      const updatedCart = {
        ...mockCart,
        items: [{
          id: 'item-1',
          productId: '1',
          quantity: 2,
          price: 100
        }]
      };
      
      db.products.findById.mockResolvedValue(mockProduct);
      db.carts.findByUserId.mockResolvedValue(mockCart);
      db.carts.addItem.mockResolvedValue(updatedCart);
      
      const result = await resolvers.Mutation.addToCart(
        null,
        { input: { productId: '1', quantity: 2 } },
        mockContext
      );
      
      expect(result).toEqual(updatedCart);
      expect(db.carts.addItem).toHaveBeenCalled();
    });
    
    it('should throw error if insufficient stock', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Product',
        price: 100,
        stock: 1
      };
      
      db.products.findById.mockResolvedValue(mockProduct);
      
      await expect(
        resolvers.Mutation.addToCart(
          null,
          { input: { productId: '1', quantity: 5 } },
          mockContext
        )
      ).rejects.toThrow('Insufficient stock');
    });
    
    it('should validate quantity range', async () => {
      await expect(
        resolvers.Mutation.addToCart(
          null,
          { input: { productId: '1', quantity: 0 } },
          mockContext
        )
      ).rejects.toThrow('Quantity must be between 1 and 999');
      
      await expect(
        resolvers.Mutation.addToCart(
          null,
          { input: { productId: '1', quantity: 1000 } },
          mockContext
        )
      ).rejects.toThrow('Quantity must be between 1 and 999');
    });
  });
  
  describe('Mutation.updateCartItem', () => {
    it('should update item quantity', async () => {
      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        items: [{
          id: 'item-1',
          productId: '1',
          quantity: 1,
          price: 100
        }]
      };
      
      const mockProduct = {
        id: '1',
        stock: 50
      };
      
      db.carts.findByUserId.mockResolvedValue(mockCart);
      db.products.findById.mockResolvedValue(mockProduct);
      db.carts.updateItemQuantity.mockResolvedValue({
        ...mockCart,
        items: [{ ...mockCart.items[0], quantity: 3 }]
      });
      
      const result = await resolvers.Mutation.updateCartItem(
        null,
        { input: { itemId: 'item-1', quantity: 3 } },
        mockContext
      );
      
      expect(result.items[0].quantity).toBe(3);
    });
  });
  
  describe('Mutation.removeFromCart', () => {
    it('should remove item from cart', async () => {
      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        items: [{ id: 'item-1' }, { id: 'item-2' }]
      };
      
      db.carts.findByUserId.mockResolvedValue(mockCart);
      db.carts.removeItem.mockResolvedValue({
        ...mockCart,
        items: [{ id: 'item-2' }]
      });
      
      const result = await resolvers.Mutation.removeFromCart(
        null,
        { itemId: 'item-1' },
        mockContext
      );
      
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('item-2');
    });
  });
  
  describe('Mutation.clearCart', () => {
    it('should clear all items from cart', async () => {
      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        items: [{ id: 'item-1' }, { id: 'item-2' }]
      };
      
      db.carts.findByUserId.mockResolvedValue(mockCart);
      db.carts.clear.mockResolvedValue({
        ...mockCart,
        items: []
      });
      
      const result = await resolvers.Mutation.clearCart(null, {}, mockContext);
      
      expect(result.items).toHaveLength(0);
    });
  });
  
  describe('Mutation.applyDiscount', () => {
    it('should apply valid discount code', async () => {
      const mockDiscount = {
        id: '1',
        code: 'SAVE10',
        percentage: 10,
        valid: true
      };
      
      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        items: [],
        discount: 0
      };
      
      db.discounts.findByCode.mockResolvedValue(mockDiscount);
      db.carts.findByUserId.mockResolvedValue(mockCart);
      db.carts.applyDiscount.mockResolvedValue({
        ...mockCart,
        discount: 10
      });
      
      const result = await resolvers.Mutation.applyDiscount(
        null,
        { input: { code: 'SAVE10' } },
        mockContext
      );
      
      expect(result.discount).toBe(10);
      expect(db.discounts.incrementUsage).toHaveBeenCalledWith('1');
    });
    
    it('should reject invalid discount code', async () => {
      db.discounts.findByCode.mockResolvedValue(null);
      
      await expect(
        resolvers.Mutation.applyDiscount(
          null,
          { input: { code: 'INVALID' } },
          mockContext
        )
      ).rejects.toThrow('Invalid discount code');
    });
  });
  
  describe('Mutation.checkout', () => {
    it('should process checkout successfully', async () => {
      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        items: [{
          id: 'item-1',
          productId: '1',
          quantity: 2,
          price: 100,
          subtotal: 200
        }]
      };
      
      const mockProduct = {
        id: '1',
        name: 'Test Product',
        stock: 50
      };
      
      const mockOrder = {
        id: 'order-1',
        userId: 'user-1',
        total: 232 // 200 + 20 tax + 10 shipping
      };
      
      db.carts.findByUserId.mockResolvedValue(mockCart);
      db.products.findById.mockResolvedValue(mockProduct);
      db.orders.create.mockResolvedValue(mockOrder);
      db.products.decreaseStock.mockResolvedValue(mockProduct);
      db.carts.removeMultipleItems.mockResolvedValue(mockCart);
      
      const result = await resolvers.Mutation.checkout(
        null,
        {
          input: {
            cartItemIds: ['item-1'],
            shippingAddress: '123 Test St',
            paymentMethod: 'credit_card'
          }
        },
        mockContext
      );
      
      expect(result.success).toBe(true);
      expect(result.orderId).toBe('order-1');
      expect(db.products.decreaseStock).toHaveBeenCalledWith('1', 2);
    });
    
    it('should validate selected items exist', async () => {
      const mockCart = {
        id: 'cart-1',
        userId: 'user-1',
        items: []
      };
      
      db.carts.findByUserId.mockResolvedValue(mockCart);
      
      await expect(
        resolvers.Mutation.checkout(
          null,
          {
            input: {
              cartItemIds: ['item-1'],
              shippingAddress: '123 Test St',
              paymentMethod: 'credit_card'
            }
          },
          mockContext
        )
      ).rejects.toThrow('Selected items not found in cart');
    });
  });
  
  describe('Cart Field Resolvers', () => {
    it('should calculate subtotal correctly', () => {
      const cart = {
        items: [
          { price: 100, quantity: 2, subtotal: 200 },
          { price: 50, quantity: 3, subtotal: 150 }
        ]
      };
      
      const result = resolvers.Cart.subtotal(cart);
      expect(result).toBe(350);
    });
    
    it('should calculate discount amount', () => {
      const cart = {
        items: [{ price: 100, quantity: 1, subtotal: 100 }],
        discount: 10
      };
      
      const result = resolvers.Cart.discountAmount(cart);
      expect(result).toBe(10);
    });
    
    it('should calculate tax correctly', () => {
      const cart = {
        items: [{ price: 100, quantity: 1, subtotal: 100 }],
        discount: 0
      };
      
      const result = resolvers.Cart.tax(cart);
      expect(result).toBe(10); // 10% of 100
    });
    
    it('should apply free shipping for orders over threshold', () => {
      const cart = {
        items: [{ price: 100, quantity: 2, subtotal: 200 }]
      };
      
      const result = resolvers.Cart.shipping(cart);
      expect(result).toBe(0);
    });
    
    it('should charge shipping for orders under threshold', () => {
      const cart = {
        items: [{ price: 50, quantity: 1, subtotal: 50 }]
      };
      
      const result = resolvers.Cart.shipping(cart);
      expect(result).toBe(10);
    });
  });
  
  describe('CartItem Field Resolvers', () => {
    it('should resolve product for cart item', async () => {
      const cartItem = { productId: '1' };
      const mockProduct = { id: '1', name: 'Test Product' };
      
      db.products.findById.mockResolvedValue(mockProduct);
      
      const result = await resolvers.CartItem.product(cartItem, {}, mockContext);
      
      expect(result).toEqual(mockProduct);
    });
    
    it('should calculate item subtotal', () => {
      const cartItem = { price: 100, quantity: 3 };
      
      const result = resolvers.CartItem.subtotal(cartItem);
      expect(result).toBe(300);
    });
  });
});