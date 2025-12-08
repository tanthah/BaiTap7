import React, { useState } from 'react';
import { Row, Col, ListGroup, Button, Modal } from 'react-bootstrap';
import { useCart } from '../../context/CartContext.enhanced';
import { QuantitySelector } from '../ui/QuantitySelector';
import { sanitize } from '../../security/sanitizer';

export const CartItem = ({ item }) => {
  const { updateQuantity, removeItem, loading } = useCart();
  const [showConfirm, setShowConfirm] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  
  const handleQuantityChange = async (newQuantity) => {
    try {
      setLocalLoading(true);
      updateQuantity(item.id, item.variant, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setLocalLoading(false);
    }
  };
  
  const handleRemove = () => {
    removeItem(item.id, item.variant);
    setShowConfirm(false);
  };
  
  // Sanitize display values
  const displayName = sanitize.text(item.name);
  const displayPrice = sanitize.number(item.price, 0);
  const displayQuantity = sanitize.number(item.quantity, 1, 999);
  const displayImage = sanitize.url(item.image) || 'https://via.placeholder.com/80';
  
  return (
    <>
      <ListGroup.Item>
        <Row className="align-items-center">
          <Col xs={3} md={2}>
            <img 
              src={displayImage} 
              alt={displayName}
              className="img-fluid rounded"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/80';
              }}
            />
          </Col>
          
          <Col xs={9} md={4}>
            <h6 className="mb-1">{displayName}</h6>
            {item.variant && (
              <small className="text-muted">
                {Object.entries(sanitize.object(item.variant))
                  .map(([key, val]) => `${sanitize.text(key)}: ${sanitize.text(String(val))}`)
                  .join(', ')}
              </small>
            )}
          </Col>
          
          <Col xs={12} md={3} className="mt-2 mt-md-0">
            <QuantitySelector 
              value={displayQuantity}
              onChange={handleQuantityChange}
              disabled={loading || localLoading}
            />
          </Col>
          
          <Col xs={6} md={2} className="mt-2 mt-md-0">
            <strong>${(displayPrice * displayQuantity).toFixed(2)}</strong>
            <div className="text-muted small">${displayPrice.toFixed(2)} each</div>
          </Col>
          
          <Col xs={6} md={1} className="mt-2 mt-md-0 text-end">
            <Button 
              variant="outline-danger" 
              size="sm"
              onClick={() => setShowConfirm(true)}
              disabled={loading}
            >
              <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>×</span>
            </Button>
          </Col>
        </Row>
      </ListGroup.Item>
      
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc muốn xóa <strong>{displayName}</strong> khỏi giỏ hàng?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleRemove}>
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};