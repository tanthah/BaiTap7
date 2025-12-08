import React from 'react';
import { Button, Form } from 'react-bootstrap';
import { sanitize } from '../../security/sanitizer';

export const QuantitySelector = ({ 
  value, 
  onChange, 
  min = 1, 
  max = 99, 
  size = 'sm',
  disabled = false
}) => {
  const handleDecrease = () => {
    if (value > min && !disabled) {
      onChange(value - 1);
    }
  };
  
  const handleIncrease = () => {
    if (value < max && !disabled) {
      onChange(value + 1);
    }
  };
  
  const handleInputChange = (e) => {
    if (disabled) return;
    
    try {
      const newValue = sanitize.number(e.target.value, min, max);
      onChange(Math.floor(newValue));
    } catch (error) {
      // Invalid input, ignore
      console.warn('Invalid quantity input:', e.target.value);
    }
  };
  
  return (
    <div className="d-flex align-items-center gap-2">
      <Button 
        variant="outline-secondary" 
        size={size}
        onClick={handleDecrease}
        disabled={value <= min || disabled}
      >
        -
      </Button>
      <Form.Control
        type="number"
        value={value}
        onChange={handleInputChange}
        size={size}
        style={{ width: '60px', textAlign: 'center' }}
        min={min}
        max={max}
        disabled={disabled}
      />
      <Button 
        variant="outline-secondary" 
        size={size}
        onClick={handleIncrease}
        disabled={value >= max || disabled}
      >
        +
      </Button>
    </div>
  );
};