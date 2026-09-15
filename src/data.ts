import { FoodItem, Customer, Coupon } from "./types";

export const initialFoodItems: FoodItem[] = [
  {
    id: 1,
    name: "Margherita Pizza",
    category: "pizza",
    price: 299,
    isAvailable: true,
  },
  {
    id: 2,
    name: "Farmhouse Deluxe Pizza",
    category: "pizza",
    price: 499,
    isAvailable: true,
  },
  {
    id: 3,
    name: "Spicy Paneer Pizza",
    category: "pizza",
    price: 429,
    isAvailable: true,
  },
  {
    id: 4,
    name: "Classic Veg Burger",
    category: "burger",
    price: 149,
    isAvailable: true,
  },
  {
    id: 5,
    name: "Crispy Cheese Burger",
    category: "burger",
    price: 219,
    isAvailable: true,
  },
  {
    id: 6,
    name: "Double Patty BBQ Burger",
    category: "burger",
    price: 289,
    isAvailable: true,
  },
  {
    id: 7,
    name: "Cold Coffee with Ice Cream",
    category: "drink",
    price: 160,
    isAvailable: true,
  },
  {
    id: 8,
    name: "Fresh Mint Mojito",
    category: "drink",
    price: 130,
    isAvailable: true,
  },
  {
    id: 9,
    name: "Belgian Chocolate Shake",
    category: "drink",
    price: 190,
    isAvailable: true,
  },
  {
    id: 10,
    name: "Warm Choco Lava Cake",
    category: "dessert",
    price: 129,
    isAvailable: true,
  },
  {
    id: 11,
    name: "New York Style Cheesecake",
    category: "dessert",
    price: 249,
    isAvailable: true,
  },
  {
    id: 12,
    name: "Sizzling Brownie with Vanilla Ice Cream",
    category: "dessert",
    price: 199,
    isAvailable: false, // demonstrates out of stock handling
  },
];

export const sampleCustomers: Customer[] = [
  {
    id: 101,
    name: "Aman Sharma",
    phone: "9876543210",
    address: "Flat 402, Green Valley Apartments, Delhi",
    type: "guest",
  },
  {
    id: 102,
    name: "Priya Patel",
    phone: "9123456780",
    address: "B-12, Sunset Boulevard, Mumbai",
    type: "member",
    membershipId: "MEM-SLV-001",
    membershipLevel: "silver",
    discountPercentage: 5,
  },
  {
    id: 103,
    name: "Rahul Verma",
    phone: "9988776655",
    address: "15, Richmond Road, Bengaluru",
    type: "member",
    membershipId: "MEM-GLD-042",
    membershipLevel: "gold",
    discountPercentage: 10,
  },
  {
    id: 104,
    name: "Sneha Reddy",
    phone: "9811223344",
    address: "Plot 88, Jubilee Hills, Hyderabad",
    type: "member",
    membershipId: "MEM-PLT-999",
    membershipLevel: "platinum",
    discountPercentage: 15,
  },
];

export const availableCoupons: Coupon[] = [
  {
    code: "WELCOME50",
    type: "flat",
    value: 50,
    minOrderValue: 200,
    description: "Flat ₹50 OFF on orders above ₹200",
  },
  {
    code: "FEAST20",
    type: "percentage",
    value: 20,
    minOrderValue: 800,
    maxDiscount: 200,
    description: "20% OFF up to ₹200 on orders above ₹800",
  },
  {
    code: "SUPER300",
    type: "flat",
    value: 300,
    minOrderValue: 2500,
    description: "Flat ₹300 OFF on bulk party orders above ₹2500",
  },
];
