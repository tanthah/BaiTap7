import React from 'react';
import { Badge } from 'react-bootstrap';
import { useCart } from '../../context/CartContext';

export const CartBadge = ({ style = {}, className = '' }) => {
  const { itemCount } = useCart();
  
  return (
    <Badge 
      bg="primary" 
      pill 
      style={{ fontSize: '1rem', padding: '8px 16px', ...style }}
      className={className}
    >
      🛒 {itemCount}
    </Badge>
  );
};
