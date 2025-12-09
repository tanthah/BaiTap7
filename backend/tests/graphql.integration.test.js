// backend/src/__tests__/integration/graphql.integration.test.js

const request = require('supertest');
const app = require('../../server');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper to generate auth token
const generateToken = (userId = 'user-1') => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
};

// Helper to make GraphQL request
const graphqlRequest = (query, variables = {}, token = null) => {
  const req = request(app)
    .post('/graphql')
    .send({ query, variables });
  
  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }
  
  return req;
};

describe('GraphQL Integration Tests', () => {
  let authToken;
  
  beforeAll(() => {
    authToken = generateToken();
  });
  
  describe('Health Check', () => {
    test('GET /health should return ok', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });
  
  describe('Authentication', () => {
    test('POST /api/login should return token', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ email: 'test@example.com' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
    });
    
    test('queries should fail without authentication', async () => {
      const query = `
        query {
          getCart {
            id
          }
        }
      `;
      
      const response = await graphqlRequest(query);
      
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('logged in');
    });
  });
  
  describe('Product Queries', () => {
    test('getProducts should return products', async () => {
      const query = `
        query GetProducts($limit: Int) {
          getProducts(limit: $limit) {
            id
            name
            price
            stock
          }
        }
      `;
      
      const response = await graphqlRequest(
        query,
        { limit: 2 },
        authToken
      );
      
      expect(response.status).toBe(200);
      expect(response.body.data.getProducts).toBeDefined();
      expect(response.body.data.getProducts.length).toBeLessThanOrEqual(2);
      expect(response.body.data.getProducts[0]).toHaveProperty('id');
      expect(response.body.data.getProducts[0]).toHaveProperty('name');
    });
    
    test('getProduct should return single product', async () => {
      const query = `
        query GetProduct($id: ID!) {
          getProduct(id: $id) {
            id
            name
            price
            description
            stock
          }
        }
      `;
      
      const response = await graphqlRequest(
        query,
        { id: '1' },
        authToken
      );
      
      expect(response.status).toBe(200);
      expect(response.body.data.getProduct).toBeDefined();
      expect(response.body.data.getProduct.id).toBe('1');
    });
    
    test('getProduct should return error for non-existent product', async () => {
      const query = `
        query GetProduct($id: ID!) {
          getProduct(id: $id) {
            id
          }
        }
      `;
      
      const response = await graphqlRequest(
        query,
        { id: '999' },
        authToken
      );
      
      expect(response.body.errors).toBeDefined();
    });
  });
  
  describe('Cart Operations', () => {
    test('getCart should return or create cart', async () => {
      const query = `
        query {
          getCart {
            id
            userId
            items {
              id
              productId
              quantity
            }
            subtotal
            total
          }
        }
      `;
      
      const response = await graphqlRequest(query, {}, authToken);
      
      expect(response.status).toBe(200);
      expect(response.body.data.getCart).toBeDefined();
      expect(response.body.data.getCart.userId).toBe('user-1');
    });
    
    test('addToCart should add product', async () => {
      const mutation = `
        mutation AddToCart($input: AddToCartInput!) {
          addToCart(input: $input) {
            id
            items {
              id
              productId
              quantity
              price
            }
            itemCount
            subtotal
          }
        }
      `;
      
      const response = await graphqlRequest(
        mutation,
        {
          input: {
            productId: '1',
            quantity: 2
          }
        },
        authToken
      );
      
      expect(response.status).toBe(200);
      expect(response.body.data.addToCart).toBeDefined();
      expect(response.body.data.addToCart.items.length).toBeGreaterThan(0);
      
      const addedItem = response.body.data.addToCart.items.find(
        item => item.productId === '1'
      );
      expect(addedItem).toBeDefined();
    });
    
    test('addToCart should validate quantity', async () => {
      const mutation = `
        mutation AddToCart($input: AddToCartInput!) {
          addToCart(input: $input) {
            id
          }
        }
      `;
      
      const response = await graphqlRequest(
        mutation,
        {
          input: {
            productId: '1',
            quantity: 1000
          }
        },
        authToken
      );
      
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Quantity');
    });
    
    test('updateCartItem should update quantity', async () => {
      // First add an item
      const addMutation = `
        mutation AddToCart($input: AddToCartInput!) {
          addToCart(input: $input) {
            items {
              id
              quantity
            }
          }
        }
      `;
      
      const addResponse = await graphqlRequest(
        addMutation,
        { input: { productId: '2', quantity: 1 } },
        authToken
      );
      
      const itemId = addResponse.body.data.addToCart.items[0].id;
      
      // Then update it
      const updateMutation = `
        mutation UpdateCartItem($input: UpdateCartItemInput!) {
          updateCartItem(input: $input) {
            items {
              id
              quantity
            }
          }
        }
      `;
      
      const updateResponse = await graphqlRequest(
        updateMutation,
        { input: { itemId, quantity: 5 } },
        authToken
      );
      
      expect(updateResponse.status).toBe(200);
      const updatedItem = updateResponse.body.data.updateCartItem.items.find(
        item => item.id === itemId
      );
      expect(updatedItem.quantity).toBe(5);
    });
    
    test('removeFromCart should remove item', async () => {
      // Add item first
      const addMutation = `
        mutation AddToCart($input: AddToCartInput!) {
          addToCart(input: $input) {
            items {
              id
            }
          }
        }
      `;
      
      const addResponse = await graphqlRequest(
        addMutation,
        { input: { productId: '3', quantity: 1 } },
        authToken
      );
      
      const itemId = addResponse.body.data.addToCart.items[0].id;
      
      // Remove it
      const removeMutation = `
        mutation RemoveFromCart($itemId: ID!) {
          removeFromCart(itemId: $itemId) {
            items {
              id
            }
          }
        }
      `;
      
      const removeResponse = await graphqlRequest(
        removeMutation,
        { itemId },
        authToken
      );
      
      expect(removeResponse.status).toBe(200);
      const remainingItem = removeResponse.body.data.removeFromCart.items.find(
        item => item.id === itemId
      );
      expect(remainingItem).toBeUndefined();
    });
    
    test('clearCart should remove all items', async () => {
      const mutation = `
        mutation {
          clearCart {
            items {
              id
            }
            itemCount
          }
        }
      `;
      
      const response = await graphqlRequest(mutation, {}, authToken);
      
      expect(response.status).toBe(200);
      expect(response.body.data.clearCart.items).toHaveLength(0);
      expect(response.body.data.clearCart.itemCount).toBe(0);
    });
  });
  
  describe('Discount Operations', () => {
    test('validateDiscountCode should validate code', async () => {
      const query = `
        query ValidateDiscount($code: String!) {
          validateDiscountCode(code: $code) {
            valid
            percentage
            message
          }
        }
      `;
      
      const response = await graphqlRequest(
        query,
        { code: 'SAVE10' },
        authToken
      );
      
      expect(response.status).toBe(200);
      expect(response.body.data.validateDiscountCode.valid).toBe(true);
      expect(response.body.data.validateDiscountCode.percentage).toBe(10);
    });
    
    test('applyDiscount should apply valid code', async () => {
      const mutation = `
        mutation ApplyDiscount($input: ApplyDiscountInput!) {
          applyDiscount(input: $input) {
            discount
            discountAmount
          }
        }
      `;
      
      const response = await graphqlRequest(
        mutation,
        { input: { code: 'SAVE20' } },
        authToken
      );
      
      expect(response.status).toBe(200);
      expect(response.body.data.applyDiscount.discount).toBe(20);
    });
    
    test('applyDiscount should reject invalid code', async () => {
      const mutation = `
        mutation ApplyDiscount($input: ApplyDiscountInput!) {
          applyDiscount(input: $input) {
            discount
          }
        }
      `;
      
      const response = await graphqlRequest(
        mutation,
        { input: { code: 'INVALID' } },
        authToken
      );
      
      expect(response.body.errors).toBeDefined();
    });
  });
  
  describe('Checkout Flow', () => {
    test('complete checkout flow', async () => {
      // 1. Add items to cart
      const addMutation = `
        mutation AddToCart($input: AddToCartInput!) {
          addToCart(input: $input) {
            items {
              id
            }
          }
        }
      `;
      
      const addResponse = await graphqlRequest(
        addMutation,
        { input: { productId: '1', quantity: 2 } },
        authToken
      );
      
      const itemIds = addResponse.body.data.addToCart.items.map(item => item.id);
      
      // 2. Apply discount
      const discountMutation = `
        mutation ApplyDiscount($input: ApplyDiscountInput!) {
          applyDiscount(input: $input) {
            discount
          }
        }
      `;
      
      await graphqlRequest(
        discountMutation,
        { input: { code: 'SAVE10' } },
        authToken
      );
      
      // 3. Checkout
      const checkoutMutation = `
        mutation Checkout($input: CheckoutInput!) {
          checkout(input: $input) {
            success
            orderId
            total
            message
          }
        }
      `;
      
      const checkoutResponse = await graphqlRequest(
        checkoutMutation,
        {
          input: {
            cartItemIds: itemIds,
            shippingAddress: '123 Test St, Test City',
            paymentMethod: 'credit_card'
          }
        },
        authToken
      );
      
      expect(checkoutResponse.status).toBe(200);
      expect(checkoutResponse.body.data.checkout.success).toBe(true);
      expect(checkoutResponse.body.data.checkout.orderId).toBeDefined();
    });
    
    test('checkout should validate selected items', async () => {
      const mutation = `
        mutation Checkout($input: CheckoutInput!) {
          checkout(input: $input) {
            success
          }
        }
      `;
      
      const response = await graphqlRequest(
        mutation,
        {
          input: {
            cartItemIds: ['non-existent-id'],
            shippingAddress: '123 Test St',
            paymentMethod: 'credit_card'
          }
        },
        authToken
      );
      
      expect(response.body.errors).toBeDefined();
    });
  });
  
  describe('Field Resolvers', () => {
    test('cart should calculate totals correctly', async () => {
      // Add item with known price
      const addMutation = `
        mutation AddToCart($input: AddToCartInput!) {
          addToCart(input: $input) {
            id
          }
        }
      `;
      
      await graphqlRequest(
        addMutation,
        { input: { productId: '1', quantity: 1 } },
        authToken
      );
      
      // Get cart with all calculations
      const query = `
        query {
          getCart {
            subtotal
            tax
            shipping
            total
            itemCount
          }
        }
      `;
      
      const response = await graphqlRequest(query, {}, authToken);
      
      expect(response.status).toBe(200);
      const cart = response.body.data.getCart;
      
      expect(cart.subtotal).toBeGreaterThan(0);
      expect(cart.tax).toBeGreaterThan(0);
      expect(cart.total).toBe(
        cart.subtotal + cart.tax + cart.shipping
      );
    });
    
    test('cartItem should resolve product', async () => {
      const query = `
        query {
          getCart {
            items {
              id
              product {
                id
                name
                price
              }
            }
          }
        }
      `;
      
      const response = await graphqlRequest(query, {}, authToken);
      
      expect(response.status).toBe(200);
      if (response.body.data.getCart.items.length > 0) {
        const item = response.body.data.getCart.items[0];
        expect(item.product).toBeDefined();
        expect(item.product.name).toBeDefined();
      }
    });
  });
});module.exports = 'test-file-stub';