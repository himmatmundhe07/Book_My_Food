import { FoodItem, CartItem, ID } from "./types";

/**
 * Adds an item to the cart. If the item already exists in the cart,
 * it updates its quantity and appends/updates any special instructions.
 */
export function addToCart(
  cart: CartItem[],
  item: FoodItem,
  quantity: number,
  specialInstruction?: string
): CartItem[] {
  if (quantity <= 0) {
    return cart;
  }

  const existingItemIndex = cart.findIndex((cartItem) => cartItem.id === item.id);

  if (existingItemIndex !== -1) {
    return cart.map((cartItem, index) => {
      if (index === existingItemIndex) {
        const combinedInstruction = specialInstruction
          ? cartItem.specialInstruction
            ? `${cartItem.specialInstruction}; ${specialInstruction}`
            : specialInstruction
          : cartItem.specialInstruction;

        return {
          ...cartItem,
          quantity: cartItem.quantity + quantity,
          specialInstruction: combinedInstruction,
        };
      }
      return cartItem;
    });
  }

  const newCartItem: CartItem = {
    ...item,
    quantity,
    ...(specialInstruction ? { specialInstruction } : {}),
  };

  return [...cart, newCartItem];
}

/**
 * Removes an item from the cart by its ID.
 */
export function removeFromCart(cart: CartItem[], itemId: ID): CartItem[] {
  return cart.filter((cartItem) => cartItem.id !== itemId);
}

/**
 * Updates the quantity of a specific item in the cart.
 * If newQuantity is 0 or negative, the item is removed.
 */
export function updateQuantity(
  cart: CartItem[],
  itemId: ID,
  newQuantity: number
): CartItem[] {
  if (newQuantity <= 0) {
    return removeFromCart(cart, itemId);
  }

  return cart.map((cartItem) => {
    if (cartItem.id === itemId) {
      return {
        ...cartItem,
        quantity: newQuantity,
      };
    }
    return cartItem;
  });
}

/**
 * Calculates the total cost for a single cart item.
 */
export function calculateItemTotal(item: CartItem): number {
  return item.price * item.quantity;
}

/**
 * Calculates the subtotal for the entire cart using reduce().
 */
export function calculateSubtotal(cart: CartItem[]): number {
  return cart.reduce((total, item) => total + calculateItemTotal(item), 0);
}
