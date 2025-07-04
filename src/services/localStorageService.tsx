// src/services/localStorageService.tsx
import { CartItem } from '../services/types'; // Adjust path as needed

export const KEY_TOKEN = "accessToken";

export const setToken = (token: string) => {
  localStorage.setItem(KEY_TOKEN, token);
};

export const getToken = () => {
  return localStorage.getItem(KEY_TOKEN);
};

export const removeToken = () => {
  console.log("remove");
  return localStorage.removeItem(KEY_TOKEN);
};

export const loadCart = (): CartItem[] => {
  try {
    const savedCart = localStorage.getItem('cart');
    console.log('loadCart: Raw cart data from localStorage:', savedCart);
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      if (
        Array.isArray(parsedCart) &&
        parsedCart.every(
          (item) =>
            item.product &&
            typeof item.product.id === 'string' &&
            typeof item.quantity === 'number' &&
            item.quantity > 0
        )
      ) {
        // Sanitize prices
        const sanitizedCart = parsedCart.map((item: CartItem) => ({
          product: {
            ...item.product,
            salePrice: item.product.salePrice ?? 0,
            finalPrice: item.product.finalPrice ?? null,
            discountPercent: item.product.discountPercent ?? null,
            discountAmount: item.product.discountAmount ?? null,
            discountCode: item.product.discountCode ?? null,
          },
          quantity: item.quantity,
        }));
        console.log('loadCart: Valid cart data loaded:', sanitizedCart);
        return sanitizedCart;
      } else {
        console.warn('loadCart: Invalid cart data format, returning empty array');
        return [];
      }
    }
    console.log('loadCart: No cart data in localStorage, returning empty array');
    return [];
  } catch (error) {
    console.error('loadCart: Error parsing cart from localStorage:', error);
    return [];
  }
};

export const saveCart = (cartItems: CartItem[]): void => {
  try {
    if (
      Array.isArray(cartItems) &&
      (cartItems.length === 0 ||
        cartItems.every(
          (item) =>
            item.product &&
            typeof item.product.id === 'string' &&
            typeof item.quantity === 'number' &&
            item.quantity > 0
        ))
    ) {
      // Sanitize prices
      const sanitizedCart = cartItems.map((item) => ({
        product: {
          ...item.product,
          salePrice: item.product.salePrice ?? 0,
          finalPrice: item.product.finalPrice ?? null,
          discountPercent: item.product.discountPercent ?? null,
          discountAmount: item.product.discountAmount ?? null,
          discountCode: item.product.discountCode ?? null,
        },
        quantity: item.quantity,
      }));
      console.log('saveCart: Saving cart to localStorage:', sanitizedCart);
      localStorage.setItem('cart', JSON.stringify(sanitizedCart));
    } else {
      console.warn('saveCart: Invalid cart data, not saving:', cartItems);
    }
  } catch (error) {
    console.error('saveCart: Error saving cart to localStorage:', error);
  }
};

export const clearCart = (): void => {
  try {
    console.log('clearCart: Clearing cart from localStorage at', new Date().toISOString());
    localStorage.removeItem('cart');
  } catch (error) {
    console.error('clearCart: Error clearing cart from localStorage:', error);
  }
};