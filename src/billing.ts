import {
  Customer,
  CartItem,
  Payment,
  OrderStatus,
  BillResult,
  Coupon,
  DiscountBreakdown,
} from "./types";
import { isMember, getCustomerDiscountPercentage } from "./customer";
import { calculateSubtotal } from "./cart";

const GST_RATE = 0.05; // 5% GST
const BULK_THRESHOLD = 2000;
const BULK_DISCOUNT_PERCENT = 5;

/**
 * Calculates discounts based on membership level, bulk threshold (> ₹2000),
 * and any optional coupon applied.
 *
 * Sequence:
 * Subtotal -> Membership Discount -> Additional Bulk Discount -> Coupon Discount
 */
export function calculateDiscount(
  subtotal: number,
  customer: Customer,
  coupon?: Coupon
): DiscountBreakdown {
  if (subtotal <= 0) {
    return {
      membershipDiscount: 0,
      bulkDiscount: 0,
      couponDiscount: 0,
      totalDiscount: 0,
      amountAfterDiscount: 0,
    };
  }

  // 1. Membership Discount
  const membershipPercent = getCustomerDiscountPercentage(customer);
  const membershipDiscount = (subtotal * membershipPercent) / 100;

  // 2. Additional Bulk Discount (5% if subtotal > ₹2000)
  let bulkDiscount = 0;
  if (subtotal > BULK_THRESHOLD) {
    bulkDiscount = (subtotal * BULK_DISCOUNT_PERCENT) / 100;
  }

  // 3. Optional Coupon Discount
  let couponDiscount = 0;
  if (coupon && subtotal >= coupon.minOrderValue) {
    if (coupon.type === "flat") {
      couponDiscount = coupon.value;
    } else if (coupon.type === "percentage") {
      const calculated = (subtotal * coupon.value) / 100;
      couponDiscount = coupon.maxDiscount
        ? Math.min(calculated, coupon.maxDiscount)
        : calculated;
    }
  }

  const rawTotalDiscount = membershipDiscount + bulkDiscount + couponDiscount;
  // Ensure discount does not exceed subtotal
  const totalDiscount = Math.min(rawTotalDiscount, subtotal);
  const amountAfterDiscount = Math.max(0, subtotal - totalDiscount);

  return {
    membershipDiscount: Number(membershipDiscount.toFixed(2)),
    bulkDiscount: Number(bulkDiscount.toFixed(2)),
    couponDiscount: Number(couponDiscount.toFixed(2)),
    totalDiscount: Number(totalDiscount.toFixed(2)),
    amountAfterDiscount: Number(amountAfterDiscount.toFixed(2)),
  };
}

/**
 * Calculates 5% GST on the amount after discount.
 */
export function calculateTax(amountAfterDiscount: number): number {
  if (amountAfterDiscount <= 0) {
    return 0;
  }
  return Number((amountAfterDiscount * GST_RATE).toFixed(2));
}

/**
 * Computes the final amount after all discounts and GST.
 */
export function calculateFinalAmount(
  subtotal: number,
  customer: Customer,
  coupon?: Coupon
): number {
  const { amountAfterDiscount } = calculateDiscount(subtotal, customer, coupon);
  const tax = calculateTax(amountAfterDiscount);
  return Number((amountAfterDiscount + tax).toFixed(2));
}

/**
 * Generates the final bill.
 * Returns a discriminated union:
 *   - { status: "success", ... }
 *   - { status: "error", message: string }
 */
export function generateBill(
  orderId: string,
  customer: Customer | null,
  cart: CartItem[],
  payment: Payment | null,
  orderStatus: OrderStatus = "confirmed",
  coupon?: Coupon
): BillResult {
  if (!customer) {
    return {
      status: "error",
      message: "Cannot generate bill: Customer information is missing.",
    };
  }

  if (cart.length === 0) {
    return {
      status: "error",
      message: "Cannot generate bill: Cart is empty.",
    };
  }

  if (!payment) {
    return {
      status: "error",
      message: "Cannot generate bill: Payment has not been processed.",
    };
  }

  const subtotal = Number(calculateSubtotal(cart).toFixed(2));
  const discountBreakdown = calculateDiscount(subtotal, customer, coupon);
  const tax = calculateTax(discountBreakdown.amountAfterDiscount);
  const finalAmount = Number(
    (discountBreakdown.amountAfterDiscount + tax).toFixed(2)
  );

  return {
    status: "success",
    orderId,
    customer,
    items: [...cart],
    subtotal,
    membershipDiscount: discountBreakdown.membershipDiscount,
    bulkDiscount: discountBreakdown.bulkDiscount,
    couponDiscount: discountBreakdown.couponDiscount,
    totalDiscount: discountBreakdown.totalDiscount,
    amountAfterDiscount: discountBreakdown.amountAfterDiscount,
    tax,
    finalAmount,
    payment,
    orderStatus,
    timestamp: new Date().toLocaleString(),
  };
}
