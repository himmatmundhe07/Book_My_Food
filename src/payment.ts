import { Payment, CashPayment, CardPayment, UpiPayment, PaymentResult } from "./types";
import { assertNever, formatCurrency } from "./utils";

/**
 * Type guard for CashPayment using the 'in' operator and method discriminator.
 */
export function isCashPayment(payment: Payment): payment is CashPayment {
  return payment.method === "cash" && "receivedAmount" in payment;
}

/**
 * Type guard for CardPayment using the 'in' operator and method discriminator.
 */
export function isCardPayment(payment: Payment): payment is CardPayment {
  return payment.method === "card" && "last4Digits" in payment;
}

/**
 * Type guard for UpiPayment using the 'in' operator and method discriminator.
 */
export function isUpiPayment(payment: Payment): payment is UpiPayment {
  return payment.method === "upi" && "transactionId" in payment;
}

/**
 * Processes a payment using type narrowing to determine the payment method.
 * Validates method-specific details and calculates change if cash is used.
 */
export function processPayment(payment: Payment, finalAmount: number): PaymentResult {
  if (finalAmount <= 0) {
    return {
      success: true,
      message: "Order total is ₹0.00. No payment required.",
      change: 0,
    };
  }

  // Type narrowing using discriminator & 'in' operator checks
  switch (payment.method) {
    case "cash": {
      // payment is narrowed to CashPayment
      if (typeof payment.receivedAmount !== "number" || isNaN(payment.receivedAmount)) {
        return {
          success: false,
          message: "Invalid cash amount provided.",
        };
      }

      if (payment.receivedAmount < finalAmount) {
        const deficit = finalAmount - payment.receivedAmount;
        return {
          success: false,
          message: `Insufficient cash received. Short by ${formatCurrency(deficit)}.`,
        };
      }

      const change = payment.receivedAmount - finalAmount;
      return {
        success: true,
        message: `Cash payment accepted. Received: ${formatCurrency(payment.receivedAmount)}.`,
        change,
      };
    }

    case "card": {
      // payment is narrowed to CardPayment
      const digits = payment.last4Digits.trim();
      if (digits.length !== 4 || !/^\d{4}$/.test(digits)) {
        return {
          success: false,
          message: "Invalid card last 4 digits. Please enter exactly 4 numeric digits.",
        };
      }

      return {
        success: true,
        message: `Card payment approved on card ending in **** ${digits}.`,
      };
    }

    case "upi": {
      // payment is narrowed to UpiPayment
      const txId = payment.transactionId.trim();
      if (txId.length < 6) {
        return {
          success: false,
          message: "Invalid UPI Transaction ID. ID must be at least 6 characters.",
        };
      }

      return {
        success: true,
        message: `UPI payment verified. Transaction Reference: ${txId}.`,
      };
    }

    default:
      // Exhaustiveness check guarantees no unhandled payment methods
      return assertNever(payment);
  }
}

/**
 * Returns a human-readable summary of payment information using type narrowing.
 */
export function formatPaymentDetails(payment: Payment): string {
  if (isCashPayment(payment)) {
    return `Cash (Received: ${formatCurrency(payment.receivedAmount)})`;
  }

  if (isCardPayment(payment)) {
    return `Card ending with **** ${payment.last4Digits}`;
  }

  if (isUpiPayment(payment)) {
    return `UPI (Ref: ${payment.transactionId})`;
  }

  return assertNever(payment);
}
