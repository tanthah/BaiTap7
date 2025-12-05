import React from 'react';
import { Alert } from 'react-bootstrap';
import { useCart } from '../../context/CartContext';

export const ErrorAlert = () => {
  const { error, clearError } = useCart();
  
  if (!error) return null;
  
  return (
    <Alert 
      variant="danger" 
      dismissible 
      onClose={clearError}
      className="mb-3"
    >
      <Alert.Heading>Lỗi</Alert.Heading>
      <p className="mb-0">{error}</p>
    </Alert>
  );
};
