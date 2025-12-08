const { AuthenticationError, UserInputError, ForbiddenError } = require('apollo-server-express');
const { PubSub } = require('graphql-subscriptions');

const pubsub = new PubSub();
const CART_UPDATED = 'CART_UPDATED';

// Helper function to check authentication
const requireAuth = (context) => {
  if (!context.user) {
    throw new AuthenticationError('You must be logged in');
  }
  return context.user;
};

// Helper function to validate and sanitize input
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim().replace(/<[^>]*>/g, '');
  }
  return input;
};

const resolvers = {
  Query: {
    // Lấy giỏ hàng của user hiện tại
    getCart: async (_, __, context) => {
      const user = requireAuth(context);
      
      try {
        let cart = await context.db.carts.findByUserId(user.id);
        
        // Nếu chưa có giỏ hàng, tạo mới
        if (!cart) {
          cart = await context.db.carts.create({ userId: user.id });
        }
        
        return cart;
      } catch (error) {
        console.error('Error fetching cart:', error);
        throw new Error('Failed to fetch cart');
      }
    },
    
    // Lấy danh sách sản phẩm
    getProducts: async (_, { limit = 20, offset = 0 }, context) => {
      try {
        const products = await context.db.products.findAll({ limit, offset });
        return products;
      } catch (error) {
        console.error('Error fetching products:', error);
        throw new Error('Failed to fetch products');
      }
    },
    
    // Lấy chi tiết sản phẩm
    getProduct: async (_, { id }, context) => {
      try {
        const product = await context.db.products.findById(id);
        
        if (!product) {
          throw new UserInputError('Product not found');
        }
        
        return product;
      } catch (error) {
        console.error('Error fetching product:', error);
        throw new Error('Failed to fetch product');
      }
    },
    
    // Kiểm tra mã giảm giá
    validateDiscountCode: async (_, { code }, context) => {
      const user = requireAuth(context);
      
      try {
        const sanitizedCode = sanitizeInput(code).toUpperCase();
        
        const discount = await context.db.discounts.findByCode(sanitizedCode);
        
        if (!discount) {
          return {
            valid: false,
            message: 'Mã giảm giá không tồn tại',
          };
        }
        
        // Kiểm tra thời hạn
        if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
          return {
            valid: false,
            message: 'Mã giảm giá đã hết hạn',
          };
        }
        
        // Kiểm tra số lần sử dụng
        if (discount.maxUses && discount.usedCount >= discount.maxUses) {
          return {
            valid: false,
            message: 'Mã giảm giá đã hết lượt sử dụng',
          };
        }
        
        return {
          valid: true,
          percentage: discount.percentage,
          message: `Giảm ${discount.percentage}%`,
        };
      } catch (error) {
        console.error('Error validating discount:', error);
        throw new Error('Failed to validate discount code');
      }
    },
  },
  
  Mutation: {
    // Thêm sản phẩm vào giỏ hàng
    addToCart: async (_, { input }, context) => {
      const user = requireAuth(context);
      
      try {
        const { productId, quantity, variant } = input;
        
        // Validate quantity
        if (quantity < 1 || quantity > 999) {
          throw new UserInputError('Quantity must be between 1 and 999');
        }
        
        // Kiểm tra sản phẩm tồn tại
        const product = await context.db.products.findById(productId);
        if (!product) {
          throw new UserInputError('Product not found');
        }
        
        // Kiểm tra tồn kho
        if (product.stock < quantity) {
          throw new UserInputError('Insufficient stock');
        }
        
        // Lấy hoặc tạo giỏ hàng
        let cart = await context.db.carts.findByUserId(user.id);
        if (!cart) {
          cart = await context.db.carts.create({ userId: user.id });
        }
        
        // Thêm sản phẩm vào giỏ
        cart = await context.db.carts.addItem(cart.id, {
          productId,
          quantity,
          variant,
          price: product.price,
        });
        
        // Publish update
        pubsub.publish(CART_UPDATED, { 
          cartUpdated: cart,
          userId: user.id 
        });
        
        return cart;
      } catch (error) {
        console.error('Error adding to cart:', error);
        throw error;
      }
    },
    
    // Cập nhật số lượng sản phẩm
    updateCartItem: async (_, { input }, context) => {
      const user = requireAuth(context);
      
      try {
        const { itemId, quantity } = input;
        
        // Validate quantity
        if (quantity < 1 || quantity > 999) {
          throw new UserInputError('Quantity must be between 1 and 999');
        }
        
        const cart = await context.db.carts.findByUserId(user.id);
        if (!cart) {
          throw new UserInputError('Cart not found');
        }
        
        // Kiểm tra item thuộc về user
        const item = cart.items.find(i => i.id === itemId);
        if (!item) {
          throw new UserInputError('Item not found in cart');
        }
        
        // Kiểm tra tồn kho
        const product = await context.db.products.findById(item.productId);
        if (product.stock < quantity) {
          throw new UserInputError('Insufficient stock');
        }
        
        // Cập nhật số lượng
        const updatedCart = await context.db.carts.updateItemQuantity(
          cart.id, 
          itemId, 
          quantity
        );
        
        // Publish update
        pubsub.publish(CART_UPDATED, { 
          cartUpdated: updatedCart,
          userId: user.id 
        });
        
        return updatedCart;
      } catch (error) {
        console.error('Error updating cart item:', error);
        throw error;
      }
    },
    
    // Xóa sản phẩm khỏi giỏ hàng
    removeFromCart: async (_, { itemId }, context) => {
      const user = requireAuth(context);
      
      try {
        const cart = await context.db.carts.findByUserId(user.id);
        if (!cart) {
          throw new UserInputError('Cart not found');
        }
        
        const updatedCart = await context.db.carts.removeItem(cart.id, itemId);
        
        // Publish update
        pubsub.publish(CART_UPDATED, { 
          cartUpdated: updatedCart,
          userId: user.id 
        });
        
        return updatedCart;
      } catch (error) {
        console.error('Error removing from cart:', error);
        throw error;
      }
    },
    
    // Xóa nhiều sản phẩm
    removeMultipleItems: async (_, { itemIds }, context) => {
      const user = requireAuth(context);
      
      try {
        const cart = await context.db.carts.findByUserId(user.id);
        if (!cart) {
          throw new UserInputError('Cart not found');
        }
        
        const updatedCart = await context.db.carts.removeMultipleItems(
          cart.id, 
          itemIds
        );
        
        // Publish update
        pubsub.publish(CART_UPDATED, { 
          cartUpdated: updatedCart,
          userId: user.id 
        });
        
        return updatedCart;
      } catch (error) {
        console.error('Error removing multiple items:', error);
        throw error;
      }
    },
    
    // Xóa toàn bộ giỏ hàng
    clearCart: async (_, __, context) => {
      const user = requireAuth(context);
      
      try {
        const cart = await context.db.carts.findByUserId(user.id);
        if (!cart) {
          throw new UserInputError('Cart not found');
        }
        
        const updatedCart = await context.db.carts.clear(cart.id);
        
        // Publish update
        pubsub.publish(CART_UPDATED, { 
          cartUpdated: updatedCart,
          userId: user.id 
        });
        
        return updatedCart;
      } catch (error) {
        console.error('Error clearing cart:', error);
        throw error;
      }
    },
    
    // Áp dụng mã giảm giá
    applyDiscount: async (_, { input }, context) => {
      const user = requireAuth(context);
      
      try {
        const { code } = input;
        const sanitizedCode = sanitizeInput(code).toUpperCase();
        
        // Validate discount code
        const discount = await context.db.discounts.findByCode(sanitizedCode);
        if (!discount || !discount.valid) {
          throw new UserInputError('Invalid discount code');
        }
        
        const cart = await context.db.carts.findByUserId(user.id);
        if (!cart) {
          throw new UserInputError('Cart not found');
        }
        
        const updatedCart = await context.db.carts.applyDiscount(
          cart.id, 
          discount.percentage
        );
        
        // Increment usage count
        await context.db.discounts.incrementUsage(discount.id);
        
        // Publish update
        pubsub.publish(CART_UPDATED, { 
          cartUpdated: updatedCart,
          userId: user.id 
        });
        
        return updatedCart;
      } catch (error) {
        console.error('Error applying discount:', error);
        throw error;
      }
    },
    
    // Xóa mã giảm giá
    removeDiscount: async (_, __, context) => {
      const user = requireAuth(context);
      
      try {
        const cart = await context.db.carts.findByUserId(user.id);
        if (!cart) {
          throw new UserInputError('Cart not found');
        }
        
        const updatedCart = await context.db.carts.removeDiscount(cart.id);
        
        // Publish update
        pubsub.publish(CART_UPDATED, { 
          cartUpdated: updatedCart,
          userId: user.id 
        });
        
        return updatedCart;
      } catch (error) {
        console.error('Error removing discount:', error);
        throw error;
      }
    },
    
    // Thanh toán
    checkout: async (_, { input }, context) => {
      const user = requireAuth(context);
      
      try {
        const { cartItemIds, shippingAddress, paymentMethod } = input;
        
        // Validate input
        if (!cartItemIds || cartItemIds.length === 0) {
          throw new UserInputError('No items selected for checkout');
        }
        
        const cart = await context.db.carts.findByUserId(user.id);
        if (!cart) {
          throw new UserInputError('Cart not found');
        }
        
        // Lọc các items được chọn
        const selectedItems = cart.items.filter(item => 
          cartItemIds.includes(item.id)
        );
        
        if (selectedItems.length === 0) {
          throw new UserInputError('Selected items not found in cart');
        }
        
        // Kiểm tra tồn kho cho tất cả items
        for (const item of selectedItems) {
          const product = await context.db.products.findById(item.productId);
          if (product.stock < item.quantity) {
            throw new UserInputError(
              `Insufficient stock for ${product.name}`
            );
          }
        }
        
        // Tính tổng tiền
        const subtotal = selectedItems.reduce(
          (sum, item) => sum + item.subtotal, 
          0
        );
        
        const tax = subtotal * 0.1; // 10% tax
        const shipping = subtotal >= 100 ? 0 : 10;
        const total = subtotal + tax + shipping;
        
        // Tạo đơn hàng
        const order = await context.db.orders.create({
          userId: user.id,
          items: selectedItems,
          subtotal,
          tax,
          shipping,
          total,
          shippingAddress: sanitizeInput(shippingAddress),
          paymentMethod: sanitizeInput(paymentMethod),
        });
        
        // Cập nhật tồn kho
        for (const item of selectedItems) {
          await context.db.products.decreaseStock(
            item.productId, 
            item.quantity
          );
        }
        
        // Xóa items đã checkout khỏi giỏ hàng
        await context.db.carts.removeMultipleItems(cart.id, cartItemIds);
        
        return {
          success: true,
          orderId: order.id,
          total,
          message: 'Order placed successfully',
        };
      } catch (error) {
        console.error('Error during checkout:', error);
        throw error;
      }
    },
  },
  
  Subscription: {
    cartUpdated: {
      subscribe: (_, { userId }, context) => {
        // Chỉ cho phép user subscribe vào cart của chính họ
        if (context.user?.id !== userId) {
          throw new ForbiddenError('Cannot subscribe to other user\'s cart');
        }
        
        return pubsub.asyncIterator([CART_UPDATED]);
      },
    },
  },
  
  // Field resolvers
  Cart: {
    items: async (cart, _, context) => {
      return cart.items || [];
    },
    
    itemCount: (cart) => {
      return cart.items.reduce((sum, item) => sum + item.quantity, 0);
    },
    
    subtotal: (cart) => {
      return cart.items.reduce((sum, item) => sum + item.subtotal, 0);
    },
    
    discountAmount: (cart) => {
      if (!cart.discount) return 0;
      const subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
      return subtotal * (cart.discount / 100);
    },
    
    tax: (cart) => {
      const subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
      const discountAmount = cart.discount 
        ? subtotal * (cart.discount / 100) 
        : 0;
      return (subtotal - discountAmount) * 0.1; // 10% tax
    },
    
    shipping: (cart) => {
      const subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
      return subtotal >= 100 ? 0 : 10;
    },
    
    total: (cart) => {
      const subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
      const discountAmount = cart.discount 
        ? subtotal * (cart.discount / 100) 
        : 0;
      const afterDiscount = subtotal - discountAmount;
      const tax = afterDiscount * 0.1;
      const shipping = subtotal >= 100 ? 0 : 10;
      return afterDiscount + tax + shipping;
    },
  },
  
  CartItem: {
    product: async (cartItem, _, context) => {
      return await context.db.products.findById(cartItem.productId);
    },
    
    subtotal: (cartItem) => {
      return cartItem.price * cartItem.quantity;
    },
  },
};

module.exports = resolvers;