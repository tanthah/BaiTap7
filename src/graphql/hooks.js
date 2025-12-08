import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { useState, useCallback } from 'react';
import {
  GET_CART,
  GET_PRODUCTS,
  GET_PRODUCT,
  VALIDATE_DISCOUNT_CODE,
  ADD_TO_CART,
  UPDATE_CART_ITEM,
  REMOVE_FROM_CART,
  REMOVE_MULTIPLE_ITEMS,
  CLEAR_CART,
  APPLY_DISCOUNT,
  REMOVE_DISCOUNT,
  CHECKOUT,
  CART_UPDATED,
} from './operations';

// ==================== CART HOOKS ====================

/**
 * Hook để lấy và quản lý giỏ hàng
 */
export const useCart = () => {
  const { data, loading, error, refetch } = useQuery(GET_CART);
  
  const [addToCartMutation, { loading: adding }] = useMutation(ADD_TO_CART, {
    refetchQueries: [{ query: GET_CART }],
  });
  
  const [updateCartItemMutation, { loading: updating }] = useMutation(UPDATE_CART_ITEM);
  
  const [removeFromCartMutation, { loading: removing }] = useMutation(REMOVE_FROM_CART);
  
  const [removeMultipleItemsMutation] = useMutation(REMOVE_MULTIPLE_ITEMS);
  
  const [clearCartMutation, { loading: clearing }] = useMutation(CLEAR_CART);
  
  const addToCart = useCallback(async (productId, quantity = 1, variant = null) => {
    try {
      const result = await addToCartMutation({
        variables: {
          input: { productId, quantity, variant }
        }
      });
      return { success: true, data: result.data.addToCart };
    } catch (err) {
      console.error('Add to cart error:', err);
      return { success: false, error: err.message };
    }
  }, [addToCartMutation]);
  
  const updateQuantity = useCallback(async (itemId, quantity) => {
    try {
      const result = await updateCartItemMutation({
        variables: {
          input: { itemId, quantity }
        }
      });
      return { success: true, data: result.data.updateCartItem };
    } catch (err) {
      console.error('Update quantity error:', err);
      return { success: false, error: err.message };
    }
  }, [updateCartItemMutation]);
  
  const removeItem = useCallback(async (itemId) => {
    try {
      const result = await removeFromCartMutation({
        variables: { itemId }
      });
      return { success: true, data: result.data.removeFromCart };
    } catch (err) {
      console.error('Remove item error:', err);
      return { success: false, error: err.message };
    }
  }, [removeFromCartMutation]);
  
  const removeMultipleItems = useCallback(async (itemIds) => {
    try {
      const result = await removeMultipleItemsMutation({
        variables: { itemIds }
      });
      return { success: true, data: result.data.removeMultipleItems };
    } catch (err) {
      console.error('Remove multiple items error:', err);
      return { success: false, error: err.message };
    }
  }, [removeMultipleItemsMutation]);
  
  const clearCart = useCallback(async () => {
    try {
      const result = await clearCartMutation();
      return { success: true, data: result.data.clearCart };
    } catch (err) {
      console.error('Clear cart error:', err);
      return { success: false, error: err.message };
    }
  }, [clearCartMutation]);
  
  return {
    cart: data?.getCart || null,
    loading,
    error,
    refetch,
    addToCart,
    updateQuantity,
    removeItem,
    removeMultipleItems,
    clearCart,
    adding,
    updating,
    removing,
    clearing,
  };
};

/**
 * Hook để quản lý discount codes
 */
export const useDiscount = () => {
  const [applyDiscountMutation, { loading: applying }] = useMutation(APPLY_DISCOUNT, {
    refetchQueries: [{ query: GET_CART }],
  });
  
  const [removeDiscountMutation, { loading: removingDiscount }] = useMutation(REMOVE_DISCOUNT, {
    refetchQueries: [{ query: GET_CART }],
  });
  
  const { refetch: validateCode } = useQuery(VALIDATE_DISCOUNT_CODE, {
    skip: true,
  });
  
  const applyDiscount = useCallback(async (code) => {
    try {
      const result = await applyDiscountMutation({
        variables: {
          input: { code }
        }
      });
      return { success: true, data: result.data.applyDiscount };
    } catch (err) {
      console.error('Apply discount error:', err);
      return { success: false, error: err.message };
    }
  }, [applyDiscountMutation]);
  
  const removeDiscount = useCallback(async () => {
    try {
      const result = await removeDiscountMutation();
      return { success: true, data: result.data.removeDiscount };
    } catch (err) {
      console.error('Remove discount error:', err);
      return { success: false, error: err.message };
    }
  }, [removeDiscountMutation]);
  
  const checkDiscountCode = useCallback(async (code) => {
    try {
      const result = await validateCode({ code });
      return result.data.validateDiscountCode;
    } catch (err) {
      console.error('Validate discount error:', err);
      return { valid: false, message: 'Error validating code' };
    }
  }, [validateCode]);
  
  return {
    applyDiscount,
    removeDiscount,
    checkDiscountCode,
    applying,
    removingDiscount,
  };
};

/**
 * Hook để thực hiện checkout
 */
export const useCheckout = () => {
  const [checkoutMutation, { loading, error }] = useMutation(CHECKOUT, {
    refetchQueries: [{ query: GET_CART }],
  });
  
  const checkout = useCallback(async (cartItemIds, shippingAddress, paymentMethod) => {
    try {
      const result = await checkoutMutation({
        variables: {
          input: {
            cartItemIds,
            shippingAddress,
            paymentMethod,
          }
        }
      });
      return { 
        success: true, 
        data: result.data.checkout 
      };
    } catch (err) {
      console.error('Checkout error:', err);
      return { 
        success: false, 
        error: err.message 
      };
    }
  }, [checkoutMutation]);
  
  return {
    checkout,
    loading,
    error,
  };
};

// ==================== PRODUCT HOOKS ====================

/**
 * Hook để lấy danh sách sản phẩm
 */
export const useProducts = (limit = 20, offset = 0) => {
  const { data, loading, error, fetchMore } = useQuery(GET_PRODUCTS, {
    variables: { limit, offset },
  });
  
  const loadMore = useCallback(() => {
    return fetchMore({
      variables: {
        offset: data?.getProducts?.length || 0,
      },
    });
  }, [fetchMore, data]);
  
  return {
    products: data?.getProducts || [],
    loading,
    error,
    loadMore,
  };
};

/**
 * Hook để lấy chi tiết sản phẩm
 */
export const useProduct = (productId) => {
  const { data, loading, error } = useQuery(GET_PRODUCT, {
    variables: { id: productId },
    skip: !productId,
  });
  
  return {
    product: data?.getProduct || null,
    loading,
    error,
  };
};

// ==================== SUBSCRIPTION HOOKS ====================

/**
 * Hook để theo dõi thay đổi giỏ hàng real-time
 */
export const useCartSubscription = (userId) => {
  const { data, loading, error } = useSubscription(CART_UPDATED, {
    variables: { userId },
    skip: !userId,
  });
  
  return {
    cart: data?.cartUpdated || null,
    loading,
    error,
  };
};

// ==================== SELECTION HOOK ====================

/**
 * Hook để quản lý việc chọn items để checkout
 */
export const useCartSelection = () => {
  const [selectedItems, setSelectedItems] = useState(new Set());
  
  const toggleItem = useCallback((itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);
  
  const toggleAll = useCallback((items) => {
    const allIds = items.map(item => item.id);
    setSelectedItems(prev => {
      if (prev.size === items.length) {
        return new Set(); // Deselect all
      }
      return new Set(allIds); // Select all
    });
  }, []);
  
  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);
  
  const isSelected = useCallback((itemId) => {
    return selectedItems.has(itemId);
  }, [selectedItems]);
  
  const selectedCount = selectedItems.size;
  const selectedIds = Array.from(selectedItems);
  
  return {
    selectedItems: selectedIds,
    selectedCount,
    toggleItem,
    toggleAll,
    clearSelection,
    isSelected,
  };
};

export default {
  useCart,
  useDiscount,
  useCheckout,
  useProducts,
  useProduct,
  useCartSubscription,
  useCartSelection,
};