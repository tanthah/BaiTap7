import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { useCart } from '../../context/CartContext.enhanced';
import { QuantitySelector } from '../ui/QuantitySelector';

export const AddToCartButton = ({ product, showQuantity = true }) => {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const handleAdd = async () => {
    setLoading(true);
    
    try {
      const result = await addItem({ ...product, quantity });
      
      if (result !== false) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
        setQuantity(1);
      }
    } catch (error) {
      console.error('Add to cart error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (!showQuantity) {
    return (
      <Button 
        variant={success ? "success" : "primary"}
        onClick={handleAdd}
        disabled={loading || success}
        className="w-100"
      >
        {loading ? '⏳ Đang thêm...' : success ? '✓ Đã thêm' : '🛒 Thêm vào giỏ'}
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
        className="flex-grow-1"
      >
        {loading ? '⏳ Đang thêm...' : success ? '✓ Đã thêm' : '🛒 Thêm'}
      </Button>
    </div>
  );
};