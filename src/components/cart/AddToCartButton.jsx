import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { useCart } from '../../context/CartContext';
import { QuantitySelector } from '../ui/QuantitySelector';

export const AddToCartButton = ({ product, showQuantity = true }) => {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const handleAdd = () => {
    setLoading(true);
    setTimeout(() => {
      addItem({ ...product, quantity });
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      setQuantity(1);
    }, 300);
  };
  
  if (!showQuantity) {
    return (
      <Button 
        variant={success ? "success" : "primary"}
        onClick={handleAdd}
        disabled={loading || success}
      >
        {loading ? 'Đang thêm...' : success ? '✓ Đã thêm' : 'Thêm vào giỏ'}
      </Button>
    );
  }
  
  return (
    <div className="d-flex gap-2 align-items-center">
      <QuantitySelector value={quantity} onChange={setQuantity} />
      <Button 
        variant={success ? "success" : "primary"}
        onClick={handleAdd}
        disabled={loading || success}
      >
        {loading ? 'Đang thêm...' : success ? '✓ Đã thêm' : 'Thêm vào giỏ'}
      </Button>
    </div>
  );
};
