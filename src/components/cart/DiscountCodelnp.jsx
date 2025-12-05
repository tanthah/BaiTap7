import React, { useState } from 'react';
import { Form, Button, InputGroup, Alert } from 'react-bootstrap';
import { useCart } from '../../context/CartContext';
import { sanitize } from '../../security/sanitizer';
import XSSProtection from '../../security/xssProtection';

/**
 * Discount Code Input Component with Security
 */
export const DiscountCodeInput = ({ 
  onApply,
  validateCode // Optional: function to validate code with backend
}) => {
  const { discount, applyDiscount, removeDiscount } = useCart();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  /**
   * Validate discount code format
   */
  const validateCodeFormat = (input) => {
    // Sanitize input
    const cleaned = XSSProtection.stripHTML(input).toUpperCase();
    
    // Check length
    if (cleaned.length < 3 || cleaned.length > 20) {
      throw new Error('Mã giảm giá phải có 3-20 ký tự');
    }
    
    // Only allow alphanumeric and dash
    if (!/^[A-Z0-9-]+$/.test(cleaned)) {
      throw new Error('Mã giảm giá chỉ chứa chữ cái, số và dấu gạch ngang');
    }
    
    // Prevent common XSS patterns
    const dangerousPatterns = [
      'SCRIPT',
      'JAVASCRIPT',
      'ONERROR',
      'ONLOAD',
      '<',
      '>',
      '&'
    ];
    
    if (dangerousPatterns.some(pattern => cleaned.includes(pattern))) {
      throw new Error('Mã giảm giá không hợp lệ');
    }
    
    return cleaned;
  };
  
  /**
   * Handle apply discount
   */
  const handleApply = async () => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      // Validate format
      const validatedCode = validateCodeFormat(code);
      
      // If custom validation provided, use it
      if (validateCode) {
        const result = await validateCode(validatedCode);
        
        if (!result.valid) {
          throw new Error(result.message || 'Mã giảm giá không hợp lệ');
        }
        
        // Apply discount from backend
        applyDiscount(validatedCode, result.percentage);
        setSuccess(`Đã áp dụng mã giảm giá ${result.percentage}%`);
        
        // Call onApply callback if provided
        if (onApply) {
          onApply({ code: validatedCode, percentage: result.percentage });
        }
      } else {
        // Default: mock validation for demo
        // In production, ALWAYS validate with backend
        const mockDiscounts = {
          'SAVE10': 10,
          'SAVE20': 20,
          'WELCOME': 15
        };
        
        if (!mockDiscounts[validatedCode]) {
          throw new Error('Mã giảm giá không tồn tại');
        }
        
        applyDiscount(validatedCode, mockDiscounts[validatedCode]);
        setSuccess(`Đã áp dụng mã giảm giá ${mockDiscounts[validatedCode]}%`);
      }
      
      setCode('');
    } catch (err) {
      console.error('Discount code error:', err);
      setError(err.message || 'Không thể áp dụng mã giảm giá');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Handle remove discount
   */
  const handleRemove = () => {
    removeDiscount();
    setCode('');
    setSuccess('');
    setError('');
  };
  
  /**
   * Handle input change with sanitization
   */
  const handleChange = (e) => {
    try {
      const sanitized = XSSProtection.stripHTML(e.target.value);
      setCode(sanitized);
      setError('');
    } catch (err) {
      setError('Ký tự không hợp lệ');
    }
  };
  
  return (
    <div className="mb-3">
      {discount > 0 ? (
        <Alert variant="success" className="d-flex justify-content-between align-items-center">
          <span>Mã giảm giá đã áp dụng: <strong>{discount}%</strong></span>
          <Button 
            variant="outline-danger" 
            size="sm"
            onClick={handleRemove}
          >
            Xóa
          </Button>
        </Alert>
      ) : (
        <>
          <Form.Label>Mã giảm giá</Form.Label>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Nhập mã giảm giá"
              value={code}
              onChange={handleChange}
              disabled={loading}
              maxLength={20}
              autoComplete="off"
            />
            <Button 
              variant="primary"
              onClick={handleApply}
              disabled={loading || !code.trim()}
            >
              {loading ? 'Đang kiểm tra...' : 'Áp dụng'}
            </Button>
          </InputGroup>
          
          {error && (
            <Form.Text className="text-danger d-block mt-2">
              {error}
            </Form.Text>
          )}
          
          {success && (
            <Form.Text className="text-success d-block mt-2">
              {success}
            </Form.Text>
          )}
          
          <Form.Text className="text-muted d-block mt-1">
            Ví dụ: SAVE10, SAVE20, WELCOME
          </Form.Text>
        </>
      )}
    </div>
  );
};

export default DiscountCodeInput;