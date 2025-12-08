import React from 'react';
import { CartProvider } from '../../context/CartContext';
import { AddToCartButton } from './AddToCartButton';
import 'bootstrap/dist/css/bootstrap.min.css';

export default {
  title: 'Cart/AddToCartButton',
  component: AddToCartButton,
  decorators: [(Story) => <CartProvider><Story /></CartProvider>],
};

export const Default = {
  args: {
    product: {
      id: 1,
      name: 'Sample Product',
      price: 99.99,
      image: 'https://via.placeholder.com/150'
    }
  }
};

export const WithoutQuantity = {
  args: {
    product: {
      id: 1,
      name: 'Sample Product',
      price: 99.99
    },
    showQuantity: false
  }
};