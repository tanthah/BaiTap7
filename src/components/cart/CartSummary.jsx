import React, { useState } from 'react';
import { Card, Button, Modal } from 'react-bootstrap';
import { useCart } from '../../context/CartContext';

export const CartSummary = ({ onCheckout }) => {
  const { 
    subtotal, 
    discount, 
    discountAmount, 
    tax, 
    shipping, 
    total, 
    itemCount, 
    clearCart 
  } = useCart();
  
  const [showClear, setShowClear] = useState(false);
  
  const handleClearCart = () => {
    clearCart();
    setShowClear(false);
  };
  
  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout({ subtotal, discount, tax, shipping, total, itemCount });
    }
  };
  
  return (
    <>
      <Card>
        <Card.Body>
          <Card.Title>Tổng đơn hàng</Card.Title>
          <hr />
          
          <div className="d-flex justify-content-between mb-2">
            <span>Tạm tính ({itemCount} sản phẩm):</span>
            <strong>${subtotal.toFixed(2)}</strong>
          </div>
          
          {discount > 0 && (
            <div className="d-flex justify-content-between mb-2 text-success">
              <span>Giảm giá ({discount}%):</span>
              <strong>-${discountAmount.toFixed(2)}</strong>
            </div>
          )}
          
          <div className="d-flex justify-content-between mb-2">
            <span>Thuế:</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          
          <div className="d-flex justify-content-between mb-2">
            <span>Phí vận chuyển:</span>
            <span>{shipping === 0 ? 'Miễn phí' : `$${shipping.toFixed(2)}`}</span>
          </div>
          
          <hr />
          
          <div className="d-flex justify-content-between mb-3">
            <strong>Tổng cộng:</strong>
            <h5 className="text-primary mb-0">${total.toFixed(2)}</h5>
          </div>
          
          <div className="d-grid gap-2">
            <Button 
              variant="primary" 
              size="lg"
              onClick={handleCheckout}
              disabled={itemCount === 0}
            >
              Thanh toán
            </Button>
            <Button 
              variant="outline-danger" 
              size="sm"
              onClick={() => setShowClear(true)}
              disabled={itemCount === 0}
            >
              Xóa giỏ hàng
            </Button>
          </div>
        </Card.Body>
      </Card>
      
      <Modal show={showClear} onHide={() => setShowClear(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa giỏ hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc muốn xóa toàn bộ giỏ hàng?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowClear(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleClearCart}>
            Xóa tất cả
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
