import { gql } from '@apollo/client';

// ==================== FRAGMENTS ====================

export const PRODUCT_FRAGMENT = gql`
  fragment ProductFields on Product {
    id
    name
    price
    description
    image
    stock
    createdAt
    updatedAt
  }
`;

export const CART_ITEM_FRAGMENT = gql`
  fragment CartItemFields on CartItem {
    id
    productId
    quantity
    variant
    price
    subtotal
    addedAt
    product {
      ...ProductFields
    }
  }
  ${PRODUCT_FRAGMENT}
`;

export const CART_FRAGMENT = gql`
  fragment CartFields on Cart {
    id
    userId
    items {
      ...CartItemFields
    }
    itemCount
    subtotal
    discount
    discountAmount
    tax
    shipping
    total
    createdAt
    updatedAt
  }
  ${CART_ITEM_FRAGMENT}
`;

// ==================== QUERIES ====================

// Lấy giỏ hàng hiện tại
export const GET_CART = gql`
  query GetCart {
    getCart {
      ...CartFields
    }
  }
  ${CART_FRAGMENT}
`;

// Lấy danh sách sản phẩm
export const GET_PRODUCTS = gql`
  query GetProducts($limit: Int, $offset: Int) {
    getProducts(limit: $limit, offset: $offset) {
      ...ProductFields
    }
  }
  ${PRODUCT_FRAGMENT}
`;

// Lấy chi tiết sản phẩm
export const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    getProduct(id: $id) {
      ...ProductFields
    }
  }
  ${PRODUCT_FRAGMENT}
`;

// Kiểm tra mã giảm giá
export const VALIDATE_DISCOUNT_CODE = gql`
  query ValidateDiscountCode($code: String!) {
    validateDiscountCode(code: $code) {
      valid
      percentage
      message
    }
  }
`;

// ==================== MUTATIONS ====================

// Thêm sản phẩm vào giỏ hàng
export const ADD_TO_CART = gql`
  mutation AddToCart($input: AddToCartInput!) {
    addToCart(input: $input) {
      ...CartFields
    }
  }
  ${CART_FRAGMENT}
`;

// Cập nhật số lượng sản phẩm
export const UPDATE_CART_ITEM = gql`
  mutation UpdateCartItem($input: UpdateCartItemInput!) {
    updateCartItem(input: $input) {
      ...CartFields
    }
  }
  ${CART_FRAGMENT}
`;

// Xóa sản phẩm khỏi giỏ hàng
export const REMOVE_FROM_CART = gql`
  mutation RemoveFromCart($itemId: ID!) {
    removeFromCart(itemId: $itemId) {
      ...CartFields
    }
  }
  ${CART_FRAGMENT}
`;

// Xóa nhiều sản phẩm
export const REMOVE_MULTIPLE_ITEMS = gql`
  mutation RemoveMultipleItems($itemIds: [ID!]!) {
    removeMultipleItems(itemIds: $itemIds) {
      ...CartFields
    }
  }
  ${CART_FRAGMENT}
`;

// Xóa toàn bộ giỏ hàng
export const CLEAR_CART = gql`
  mutation ClearCart {
    clearCart {
      ...CartFields
    }
  }
  ${CART_FRAGMENT}
`;

// Áp dụng mã giảm giá
export const APPLY_DISCOUNT = gql`
  mutation ApplyDiscount($input: ApplyDiscountInput!) {
    applyDiscount(input: $input) {
      ...CartFields
    }
  }
  ${CART_FRAGMENT}
`;

// Xóa mã giảm giá
export const REMOVE_DISCOUNT = gql`
  mutation RemoveDiscount {
    removeDiscount {
      ...CartFields
    }
  }
  ${CART_FRAGMENT}
`;

// Thanh toán
export const CHECKOUT = gql`
  mutation Checkout($input: CheckoutInput!) {
    checkout(input: $input) {
      success
      orderId
      total
      message
    }
  }
`;

// ==================== SUBSCRIPTIONS ====================

// Theo dõi thay đổi giỏ hàng
export const CART_UPDATED = gql`
  subscription OnCartUpdated($userId: ID!) {
    cartUpdated(userId: $userId) {
      ...CartFields
    }
  }
  ${CART_FRAGMENT}
`;