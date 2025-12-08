const { gql } = require('apollo-server-express');

/**
 * GraphQL Schema Type Definitions
 */
const typeDefs = gql`
  # Scalar types
  scalar JSON
  scalar DateTime
  
  # ==================== TYPES ====================
  
  # Product type
  type Product {
    id: ID!
    name: String!
    price: Float!
    description: String
    image: String
    stock: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  
  # Cart item type
  type CartItem {
    id: ID!
    productId: ID!
    quantity: Int!
    variant: JSON
    price: Float!
    subtotal: Float!
    addedAt: DateTime!
    product: Product!
  }
  
  # Cart type
  type Cart {
    id: ID!
    userId: ID!
    items: [CartItem!]!
    itemCount: Int!
    subtotal: Float!
    discount: Float!
    discountAmount: Float!
    tax: Float!
    shipping: Float!
    total: Float!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  
  # Discount validation result
  type DiscountValidation {
    valid: Boolean!
    percentage: Float
    message: String!
  }
  
  # Checkout result
  type CheckoutResult {
    success: Boolean!
    orderId: ID
    total: Float!
    message: String!
  }
  
  # Order type
  type Order {
    id: ID!
    userId: ID!
    items: [CartItem!]!
    subtotal: Float!
    tax: Float!
    shipping: Float!
    total: Float!
    shippingAddress: String!
    paymentMethod: String!
    status: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  
  # User type (basic)
  type User {
    id: ID!
    email: String!
    name: String
    createdAt: DateTime!
  }
  
  # ==================== INPUTS ====================
  
  # Add to cart input
  input AddToCartInput {
    productId: ID!
    quantity: Int!
    variant: JSON
  }
  
  # Update cart item input
  input UpdateCartItemInput {
    itemId: ID!
    quantity: Int!
  }
  
  # Apply discount input
  input ApplyDiscountInput {
    code: String!
  }
  
  # Checkout input
  input CheckoutInput {
    cartItemIds: [ID!]!
    shippingAddress: String!
    paymentMethod: String!
  }
  
  # ==================== QUERIES ====================
  
  type Query {
    # Get current user's cart
    getCart: Cart!
    
    # Get all products
    getProducts(limit: Int, offset: Int): [Product!]!
    
    # Get single product
    getProduct(id: ID!): Product
    
    # Validate discount code
    validateDiscountCode(code: String!): DiscountValidation!
    
    # Get user's orders
    getOrders: [Order!]!
    
    # Get single order
    getOrder(id: ID!): Order
  }
  
  # ==================== MUTATIONS ====================
  
  type Mutation {
    # Cart operations
    addToCart(input: AddToCartInput!): Cart!
    updateCartItem(input: UpdateCartItemInput!): Cart!
    removeFromCart(itemId: ID!): Cart!
    removeMultipleItems(itemIds: [ID!]!): Cart!
    clearCart: Cart!
    
    # Discount operations
    applyDiscount(input: ApplyDiscountInput!): Cart!
    removeDiscount: Cart!
    
    # Checkout
    checkout(input: CheckoutInput!): CheckoutResult!
  }
  
  # ==================== SUBSCRIPTIONS ====================
  
  type Subscription {
    # Subscribe to cart updates
    cartUpdated(userId: ID!): Cart!
    
    # Subscribe to order updates
    orderUpdated(userId: ID!): Order!
  }
`;

module.exports = typeDefs;