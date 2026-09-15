// Reusable Type Aliases
export type ID = number;

export type FoodCategory = "pizza" | "burger" | "drink" | "dessert";

export type MembershipLevel = "silver" | "gold" | "platinum";

export type OrderStatus = "pending" | "confirmed" | "preparing" | "delivered" | "cancelled";

// Food Item Contract
export interface FoodItem {
  id: ID;
  name: string;
  category: FoodCategory;
  price: number;
  isAvailable: boolean;
}

// Customer Contracts & Union Type
export interface BaseCustomer {
  id: ID;
  name: string;
  phone?: string;
  address: string;
}

export interface GuestCustomer extends BaseCustomer {
  type: "guest";
}

export interface MemberCustomer extends BaseCustomer {
  type: "member";
  membershipId: string;
  discountPercentage: number;
  membershipLevel: MembershipLevel;
}

export type Customer = GuestCustomer | MemberCustomer;

// Order Details & Intersection Type for CartItem
export interface OrderDetail {
  quantity: number;
  specialInstruction?: string;
}

export type CartItem = FoodItem & OrderDetail;

// Payment Contracts & Union Type
export interface CashPayment {
  method: "cash";
  receivedAmount: number;
}

export interface CardPayment {
  method: "card";
  last4Digits: string;
}

export interface UpiPayment {
  method: "upi";
  transactionId: string;
}

export type Payment = CashPayment | CardPayment | UpiPayment;

export interface PaymentResult {
  success: boolean;
  message: string;
  change?: number;
}

// Optional Feature: Coupons
export interface Coupon {
  code: string;
  type: "percentage" | "flat";
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  description: string;
}

// Discount Breakdown Structure
export interface DiscountBreakdown {
  membershipDiscount: number;
  bulkDiscount: number;
  couponDiscount: number;
  totalDiscount: number;
  amountAfterDiscount: number;
}

// Bill Result: Discriminated Union
export interface BillSuccess {
  status: "success";
  orderId: string;
  customer: Customer;
  items: CartItem[];
  subtotal: number;
  membershipDiscount: number;
  bulkDiscount: number;
  couponDiscount: number;
  totalDiscount: number;
  amountAfterDiscount: number;
  tax: number;
  finalAmount: number;
  payment: Payment;
  orderStatus: OrderStatus;
  timestamp: string;
}

export interface BillError {
  status: "error";
  message: string;
}

export type BillResult = BillSuccess | BillError;

// Order History Tracking
export interface OrderRecord {
  orderId: string;
  bill: BillSuccess;
  currentStatus: OrderStatus;
}
