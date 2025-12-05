# React Bootstrap Cart Library

Thư viện UI Component cho chức năng giỏ hàng, xây dựng với React và React-Bootstrap.

## 📦 Cài đặt

```bash
npm install react-bootstrap-cart-library bootstrap react-bootstrap
```

## 🚀 Sử dụng cơ bản

```jsx
import React from 'react';
import { CartProvider, CartList, CartSummary, AddToCartButton } from 'react-bootstrap-cart-library';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const product = {
    id: 1,
    name: 'iPhone 15',
    price: 999,
    image: 'url-to-image'
  };

  return (
    <CartProvider>
      <AddToCartButton product={product} />
      <CartList />
      <CartSummary onCheckout={(data) => console.log(data)} />
    </CartProvider>
  );
}
```

## 📚 API Reference

### CartProvider
Provider chính để quản lý state giỏ hàng.

**Props:**
- `config` (object, optional):
  - `persistCart` (boolean): Lưu giỏ hàng vào localStorage (default: true)
  - `taxRate` (number): Thuế % (default: 10)
  - `freeShippingThreshold` (number): Ngưỡng miễn phí ship (default: 100)
  - `shippingFee` (number): Phí ship (default: 10)

### useCart Hook
Hook để truy cập cart context.

**Returns:**
- `cart`: Mảng sản phẩm trong giỏ
- `addItem(product)`: Thêm sản phẩm
- `removeItem(id, variant)`: Xóa sản phẩm
- `updateQuantity(id, variant, quantity)`: Cập nhật số lượng
- `clearCart()`: Xóa toàn bộ giỏ
- `subtotal`: Tổng tạm tính
- `total`: Tổng cuối cùng
- `itemCount`: Số lượng sản phẩm

### Components

#### AddToCartButton
```jsx
<AddToCartButton 
  product={productObject} 
  showQuantity={true} 
/>
```

#### CartList
Hiển thị danh sách sản phẩm trong giỏ.

#### CartSummary
```jsx
<CartSummary onCheckout={(data) => {
  // Handle checkout
}} />
```

## 🎨 Customization

Bạn có thể override styles bằng cách sử dụng CSS custom hoặc Bootstrap utilities.

## 📝 License

MIT