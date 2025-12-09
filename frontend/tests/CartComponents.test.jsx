// frontend/src/components/__tests__/CartComponents.test.jsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider } from '../src/context/CartContext.enhanced';
import { CartList } from '../src/components/cart/CartList';
import { CartSummary } from '../src/components/cart/CartSummary';
import { AddToCartButton } from '../src/components/cart/AddToCartButton';
import { CartBadge } from '../src/components/cart/CartBadge';
import { QuantitySelector } from '../src/components/ui/QuantitySelector';
import { DiscountCodeInput } from '../src/components/cart/DiscountCodeInput';

// Mock product data
const mockProduct = {
  id: 1,
  name: 'Test Product',
  price: 99.99,
  image: 'https://example.com/image.jpg'
};

// Wrapper component with CartProvider
const Wrapper = ({ children }) => (
  <CartProvider config={{ persistCart: false }}>
    {children}
  </CartProvider>
);

describe('CartBadge Component', () => {
  test('renders with zero items initially', () => {
    render(<CartBadge />, { wrapper: Wrapper });
    
    expect(screen.getByText(/0/)).toBeInTheDocument();
  });
  
  test('updates count when items added', async () => {
    const { rerender } = render(
      <Wrapper>
        <CartBadge />
        <AddToCartButton product={mockProduct} showQuantity={false} />
      </Wrapper>
    );
    
    const addButton = screen.getByRole('button', { name: /thêm vào giỏ/i });
    await userEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText(/1/)).toBeInTheDocument();
    });
  });
});

describe('AddToCartButton Component', () => {
  test('renders add to cart button', () => {
    render(<AddToCartButton product={mockProduct} showQuantity={false} />, {
      wrapper: Wrapper
    });
    
    expect(screen.getByRole('button', { name: /thêm vào giỏ/i })).toBeInTheDocument();
  });
  
  test('shows quantity selector when showQuantity is true', () => {
    render(<AddToCartButton product={mockProduct} showQuantity={true} />, {
      wrapper: Wrapper
    });
    
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
  });
  
  test('adds product to cart when clicked', async () => {
    render(<AddToCartButton product={mockProduct} showQuantity={false} />, {
      wrapper: Wrapper
    });
    
    const addButton = screen.getByRole('button', { name: /thêm vào giỏ/i });
    await userEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText(/đã thêm/i)).toBeInTheDocument();
    });
  });
  
  test('shows loading state while adding', async () => {
    render(<AddToCartButton product={mockProduct} showQuantity={false} />, {
      wrapper: Wrapper
    });
    
    const addButton = screen.getByRole('button', { name: /thêm vào giỏ/i });
    await userEvent.click(addButton);
    
    expect(screen.getByText(/đang thêm/i)).toBeInTheDocument();
  });
});

describe('CartList Component', () => {
  test('shows empty cart message when cart is empty', () => {
    render(<CartList />, { wrapper: Wrapper });
    
    expect(screen.getByText(/giỏ hàng trống/i)).toBeInTheDocument();
  });
  
  test('renders cart items when items exist', async () => {
    render(
      <Wrapper>
        <AddToCartButton product={mockProduct} showQuantity={false} />
        <CartList />
      </Wrapper>
    );
    
    // Add item first
    const addButton = screen.getByRole('button', { name: /thêm vào giỏ/i });
    await userEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
    });
  });
});

describe('CartSummary Component', () => {
  test('renders summary with totals', () => {
    render(<CartSummary />, { wrapper: Wrapper });
    
    expect(screen.getByText(/tổng đơn hàng/i)).toBeInTheDocument();
    expect(screen.getByText(/tạm tính/i)).toBeInTheDocument();
    expect(screen.getByText(/thuế/i)).toBeInTheDocument();
    expect(screen.getByText(/phí vận chuyển/i)).toBeInTheDocument();
  });
  
  test('disables checkout button when cart is empty', () => {
    render(<CartSummary />, { wrapper: Wrapper });
    
    const checkoutButton = screen.getByRole('button', { name: /thanh toán/i });
    expect(checkoutButton).toBeDisabled();
  });
  
  test('enables checkout button when items in cart', async () => {
    render(
      <Wrapper>
        <AddToCartButton product={mockProduct} showQuantity={false} />
        <CartSummary />
      </Wrapper>
    );
    
    // Add item
    const addButton = screen.getByRole('button', { name: /thêm vào giỏ/i });
    await userEvent.click(addButton);
    
    await waitFor(() => {
      const checkoutButton = screen.getByRole('button', { name: /thanh toán/i });
      expect(checkoutButton).not.toBeDisabled();
    });
  });
  
  test('calls onCheckout when checkout button clicked', async () => {
    const handleCheckout = jest.fn();
    
    render(
      <Wrapper>
        <AddToCartButton product={mockProduct} showQuantity={false} />
        <CartSummary onCheckout={handleCheckout} />
      </Wrapper>
    );
    
    // Add item
    const addButton = screen.getByRole('button', { name: /thêm vào giỏ/i });
    await userEvent.click(addButton);
    
    // Click checkout
    await waitFor(() => {
      const checkoutButton = screen.getByRole('button', { name: /thanh toán/i });
      fireEvent.click(checkoutButton);
    });
    
    expect(handleCheckout).toHaveBeenCalled();
  });
  
  test('shows clear cart confirmation dialog', async () => {
    render(<CartSummary />, { wrapper: Wrapper });
    
    const clearButton = screen.getByRole('button', { name: /xóa giỏ hàng/i });
    await userEvent.click(clearButton);
    
    expect(screen.getByText(/xác nhận xóa giỏ hàng/i)).toBeInTheDocument();
  });
});

describe('QuantitySelector Component', () => {
  test('renders with initial value', () => {
    const handleChange = jest.fn();
    render(<QuantitySelector value={5} onChange={handleChange} />);
    
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });
  
  test('increments quantity when + clicked', async () => {
    const handleChange = jest.fn();
    render(<QuantitySelector value={1} onChange={handleChange} />);
    
    const incrementButton = screen.getAllByRole('button')[1]; // + button
    await userEvent.click(incrementButton);
    
    expect(handleChange).toHaveBeenCalledWith(2);
  });
  
  test('decrements quantity when - clicked', async () => {
    const handleChange = jest.fn();
    render(<QuantitySelector value={5} onChange={handleChange} />);
    
    const decrementButton = screen.getAllByRole('button')[0]; // - button
    await userEvent.click(decrementButton);
    
    expect(handleChange).toHaveBeenCalledWith(4);
  });
  
  test('respects minimum value', async () => {
    const handleChange = jest.fn();
    render(<QuantitySelector value={1} onChange={handleChange} min={1} />);
    
    const decrementButton = screen.getAllByRole('button')[0];
    await userEvent.click(decrementButton);
    
    expect(handleChange).not.toHaveBeenCalled();
  });
  
  test('respects maximum value', async () => {
    const handleChange = jest.fn();
    render(<QuantitySelector value={99} onChange={handleChange} max={99} />);
    
    const incrementButton = screen.getAllByRole('button')[1];
    await userEvent.click(incrementButton);
    
    expect(handleChange).not.toHaveBeenCalled();
  });
  
  test('handles manual input', async () => {
    const handleChange = jest.fn();
    render(<QuantitySelector value={1} onChange={handleChange} />);
    
    const input = screen.getByDisplayValue('1');
    await userEvent.clear(input);
    await userEvent.type(input, '10');
    
    expect(handleChange).toHaveBeenCalled();
  });
});

describe('DiscountCodeInput Component', () => {
  test('renders discount input field', () => {
    render(<DiscountCodeInput />, { wrapper: Wrapper });
    
    expect(screen.getByPlaceholderText(/nhập mã giảm giá/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /áp dụng/i })).toBeInTheDocument();
  });
  
  test('validates discount code format', async () => {
    render(<DiscountCodeInput />, { wrapper: Wrapper });
    
    const input = screen.getByPlaceholderText(/nhập mã giảm giá/i);
    const applyButton = screen.getByRole('button', { name: /áp dụng/i });
    
    // Try invalid code (too short)
    await userEvent.type(input, 'AB');
    await userEvent.click(applyButton);
    
    await waitFor(() => {
      expect(screen.getByText(/3-20 ký tự/i)).toBeInTheDocument();
    });
  });
  
  test('applies valid discount code', async () => {
    const mockValidate = jest.fn().mockResolvedValue({
      valid: true,
      percentage: 10,
      message: 'Giảm 10%'
    });
    
    render(
      <DiscountCodeInput validateCode={mockValidate} />,
      { wrapper: Wrapper }
    );
    
    const input = screen.getByPlaceholderText(/nhập mã giảm giá/i);
    const applyButton = screen.getByRole('button', { name: /áp dụng/i });
    
    await userEvent.type(input, 'SAVE10');
    await userEvent.click(applyButton);
    
    await waitFor(() => {
      expect(mockValidate).toHaveBeenCalledWith('SAVE10');
      expect(screen.getByText(/đã áp dụng/i)).toBeInTheDocument();
    });
  });
  
  test('shows error for invalid discount code', async () => {
    const mockValidate = jest.fn().mockResolvedValue({
      valid: false,
      message: 'Mã giảm giá không hợp lệ'
    });
    
    render(
      <DiscountCodeInput validateCode={mockValidate} />,
      { wrapper: Wrapper }
    );
    
    const input = screen.getByPlaceholderText(/nhập mã giảm giá/i);
    const applyButton = screen.getByRole('button', { name: /áp dụng/i });
    
    await userEvent.type(input, 'INVALID');
    await userEvent.click(applyButton);
    
    await waitFor(() => {
      expect(screen.getByText(/không hợp lệ/i)).toBeInTheDocument();
    });
  });
  
  test('removes discount when remove button clicked', async () => {
    render(<DiscountCodeInput />, { wrapper: Wrapper });
    
    // First apply a discount
    const input = screen.getByPlaceholderText(/nhập mã giảm giá/i);
    await userEvent.type(input, 'SAVE10');
    await userEvent.click(screen.getByRole('button', { name: /áp dụng/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/đã áp dụng/i)).toBeInTheDocument();
    });
    
    // Then remove it
    const removeButton = screen.getByRole('button', { name: /xóa/i });
    await userEvent.click(removeButton);
    
    await waitFor(() => {
      expect(screen.queryByText(/đã áp dụng/i)).not.toBeInTheDocument();
    });
  });
  
  test('sanitizes XSS attempts in discount code', async () => {
    render(<DiscountCodeInput />, { wrapper: Wrapper });
    
    const input = screen.getByPlaceholderText(/nhập mã giảm giá/i);
    
    await userEvent.type(input, '<script>alert("xss")</script>');
    
    expect(input.value).not.toContain('<script>');
  });
});

describe('CartItem Integration', () => {
  test('updates quantity in cart', async () => {
    render(
      <Wrapper>
        <AddToCartButton product={mockProduct} showQuantity={false} />
        <CartList />
      </Wrapper>
    );
    
    // Add item
    const addButton = screen.getByRole('button', { name: /thêm vào giỏ/i });
    await userEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
    });
    
    // Update quantity
    const quantityInput = screen.getByDisplayValue('1');
    await userEvent.clear(quantityInput);
    await userEvent.type(quantityInput, '5');
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    });
  });
  
  test('removes item from cart', async () => {
    render(
      <Wrapper>
        <AddToCartButton product={mockProduct} showQuantity={false} />
        <CartList />
      </Wrapper>
    );
    
    // Add item
    const addButton = screen.getByRole('button', { name: /thêm vào giỏ/i });
    await userEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
    });
    
    // Remove item
    const removeButton = screen.getByRole('button', { name: /×/i });
    await userEvent.click(removeButton);
    
    // Confirm removal
    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /xóa/i });
      fireEvent.click(confirmButton);
    });
    
    await waitFor(() => {
      expect(screen.queryByText(mockProduct.name)).not.toBeInTheDocument();
    });
  });
});