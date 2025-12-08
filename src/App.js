import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { CartProvider, useCart } from './context/CartContext.enhanced';
import { CartList } from './components/cart/CartList';
import { CartSummary } from './components/cart/CartSummary';
import { AddToCartButton } from './components/cart/AddToCartButton';
import { CartBadge } from './components/cart/CartBadge';
import { ErrorAlert } from './components/ui/ErrorAlert';
import { DiscountCodeInput } from './components/cart/DiscountCodeInput'; // Sửa tên file
import { SecurityMetaTags } from './security/securityHeader'; // Sửa từ securityHeaders thành securityHeader
import 'bootstrap/dist/css/bootstrap.min.css';

// Sample products
const products = [
  {
    id: 1,
    name: 'iPhone 15 Pro',
    price: 999,
    image: 'https://via.placeholder.com/200x200?text=iPhone+15+Pro',
    description: 'Latest iPhone with A17 Pro chip'
  },
  {
    id: 2,
    name: 'MacBook Air M3',
    price: 1299,
    image: 'https://via.placeholder.com/200x200?text=MacBook+Air',
    description: 'Powerful and portable'
  },
  {
    id: 3,
    name: 'AirPods Pro',
    price: 249,
    image: 'https://via.placeholder.com/200x200?text=AirPods+Pro',
    description: 'Active noise cancellation'
  },
  {
    id: 4,
    name: 'Apple Watch Series 9',
    price: 399,
    image: 'https://via.placeholder.com/200x200?text=Apple+Watch',
    description: 'Advanced health features'
  }
];

/**
 * Product Card Component
 */
const ProductCard = ({ product }) => {
  return (
    <Card className="h-100 shadow-sm">
      <Card.Img 
        variant="top" 
        src={product.image} 
        alt={product.name}
        style={{ height: '200px', objectFit: 'cover' }}
      />
      <Card.Body className="d-flex flex-column">
        <Card.Title>{product.name}</Card.Title>
        <Card.Text className="text-muted flex-grow-1">
          {product.description}
        </Card.Text>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="text-primary mb-0">${product.price}</h4>
        </div>
        <AddToCartButton product={product} showQuantity={false} />
      </Card.Body>
    </Card>
  );
};

/**
 * Header Component
 */
const Header = () => {
  return (
    <header className="bg-primary text-white py-3 mb-4">
      <Container>
        <div className="d-flex justify-content-between align-items-center">
          <h1 className="h3 mb-0">🛒 Secure Cart Demo</h1>
          <CartBadge />
        </div>
      </Container>
    </header>
  );
};

/**
 * Main App Content
 */
const AppContent = () => {
  const { itemCount } = useCart();
  
  /**
   * Mock discount validation function
   * In production, this should call your backend API
   */
  const validateDiscountCode = async (code) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock discount codes
    const discounts = {
      'SAVE10': { valid: true, percentage: 10, message: 'Giảm 10%' },
      'SAVE20': { valid: true, percentage: 20, message: 'Giảm 20%' },
      'WELCOME': { valid: true, percentage: 15, message: 'Chào mừng - Giảm 15%' }
    };
    
    if (discounts[code]) {
      return discounts[code];
    }
    
    return { valid: false, message: 'Mã giảm giá không hợp lệ' };
  };
  
  /**
   * Handle checkout
   */
  const handleCheckout = (orderData) => {
    console.log('Processing checkout:', orderData);
    
    // In production, send to backend API
    alert(`Checkout successful!\nTotal: $${orderData.total.toFixed(2)}`);
  };
  
  return (
    <div className="App">
      <Header />
      
      <Container>
        <ErrorAlert />
        
        <Row className="mb-4">
          <Col>
            <h2>Sản phẩm</h2>
            <p className="text-muted">
              Demo thư viện giỏ hàng với các tính năng bảo mật
            </p>
          </Col>
        </Row>
        
        {/* Products Grid */}
        <Row className="mb-5">
          {products.map(product => (
            <Col key={product.id} xs={12} sm={6} md={4} lg={3} className="mb-4">
              <ProductCard product={product} />
            </Col>
          ))}
        </Row>
        
        {/* Cart Section */}
        <Row>
          <Col lg={8} className="mb-4">
            <Card className="shadow-sm">
              <Card.Header>
                <h4 className="mb-0">
                  Giỏ hàng ({itemCount} sản phẩm)
                </h4>
              </Card.Header>
              <Card.Body className="p-0">
                <CartList />
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={4} className="mb-4">
            <div className="sticky-top" style={{ top: '20px' }}>
              {/* Discount Code */}
              {itemCount > 0 && (
                <Card className="shadow-sm mb-3">
                  <Card.Body>
                    <DiscountCodeInput 
                      validateCode={validateDiscountCode}
                    />
                  </Card.Body>
                </Card>
              )}
              
              {/* Cart Summary */}
              <CartSummary onCheckout={handleCheckout} />
            </div>
          </Col>
        </Row>
        
        {/* Security Info */}
        <Row className="mt-5">
          <Col>
            <Card className="bg-light">
              <Card.Body>
                <h5>🔒 Tính năng bảo mật</h5>
                <ul className="mb-0">
                  <li>XSS Protection với DOMPurify</li>
                  <li>Input validation và sanitization</li>
                  <li>CSRF token protection</li>
                  <li>Rate limiting (20 requests/phút)</li>
                  <li>Secure storage với size limits</li>
                  <li>Error handling</li>
                </ul>
                <hr />
                <small className="text-muted">
                  <strong>Lưu ý:</strong> Đây chỉ là frontend security. 
                  Production cần triển khai bảo mật backend đầy đủ.
                </small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      
      <footer className="bg-dark text-white py-4 mt-5">
        <Container>
          <Row>
            <Col className="text-center">
              <p className="mb-0">
                React Bootstrap Cart Library - Demo với Security Features
              </p>
              <small className="text-muted">
                Xem SECURITY.md để biết chi tiết về bảo mật
              </small>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
};

/**
 * Main App Component with Security Configuration
 */
function App() {
  return (
    <>
      {/* Security Meta Tags */}
      <SecurityMetaTags />
      
      {/* Cart Provider with enhanced security */}
      <CartProvider 
        config={{
          persistCart: true,
          taxRate: 10,
          freeShippingThreshold: 100,
          shippingFee: 10,
          enableRateLimit: true,
          maxRequestsPerMinute: 20
        }}
      >
        <AppContent />
      </CartProvider>
    </>
  );
}

export default App;