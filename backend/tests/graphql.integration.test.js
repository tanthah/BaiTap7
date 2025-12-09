// backend/tests/graphql.integration.test.js - WITH PROPER TEARDOWN

const request = require('supertest');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper to generate auth token
const generateToken = (userId = 'user-1') => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
};

describe('GraphQL Integration Tests', () => {
  let app;
  let server;
  let authToken;
  
  // Import app dynamically and start server
  beforeAll((done) => {
    // Import app
    app = require('../src/server');
    
    // Get the server instance if it's exported
    // If server is already running from app, get reference
    server = app.listen(0, () => {
      authToken = generateToken();
      done();
    });
  });
  
  // Properly close server after all tests
  afterAll((done) => {
    if (server && server.close) {
      server.close(() => {
        // Give time for connections to close
        setTimeout(done, 100);
      });
    } else {
      done();
    }
  });
  
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
    });
    
    test('getProduct should return single product', async () => {
      const query = `
        query GetProduct($id: ID!) {
          getProduct(id: $id) {
            id
            name
            price
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
            }
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
            }
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
    });
  });
  
  describe('Discount Operations', () => {
    test('validateDiscountCode should validate code', async () => {
      const query = `
        query ValidateDiscount($code: String!) {
          validateDiscountCode(code: $code) {
            valid
            percentage
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
    });
  });
});