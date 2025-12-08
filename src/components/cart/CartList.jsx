import React from 'react';
import { ListGroup, Alert } from 'react-bootstrap';
import { useCart } from '../../context/CartContext.enhanced';
import { CartItem } from './CartItem';

export const EmptyCart = () => (
  <Alert variant="info" className="text-center py-5">
    <h5>🛒 Giỏ hàng trống</h5>
    <p className="text-muted mb-0">Hãy thêm sản phẩm vào giỏ hàng của bạn!</p>
  </Alert>
);

export const CartList = () => {
  const { cart } = useCart();
  
  if (!cart || cart.length === 0) {
    return <EmptyCart />;
  }
  
  return (
    <ListGroup variant="flush">
      {cart.map((item, index) => (
        <CartItem 
          key={`${item.id}-${JSON.stringify(item.variant)}-${index}`} 
          item={item} 
        />
      ))}
    </ListGroup>
  );
};