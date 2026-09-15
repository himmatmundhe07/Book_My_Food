import {
  initialFoodItems,
  sampleCustomers,
  availableCoupons,
} from "./data";
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  calculateItemTotal,
  calculateSubtotal,
} from "./cart";
import {
  createGuestCustomer,
  createMemberCustomer,
  isMember,
  getCustomerDiscountPercentage,
} from "./customer";
import { processPayment, formatPaymentDetails } from "./payment";
import {
  calculateDiscount,
  calculateTax,
  calculateFinalAmount,
  generateBill,
} from "./billing";
import {
  updateOrderStatus,
  formatOrderStatus,
  saveOrderToHistory,
  getOrderHistory,
} from "./order";
import {
  Customer,
  FoodItem,
  CartItem,
  Payment,
  OrderStatus,
  BillResult,
} from "./types";

function runAllVerifications(): void {
  console.log("=== STARTING COMPREHENSIVE TS PRACTICE VERIFICATION ===");
  let passedCount = 0;

  function assert(condition: boolean, testName: string): void {
    if (!condition) {
      console.error(`❌ FAILED: ${testName}`);
      process.exit(1);
    } else {
      console.log(`✅ PASSED: ${testName}`);
      passedCount += 1;
    }
  }

  // 1. Food items requirements: at least 8 items, correct categories
  assert(initialFoodItems.length >= 8, `Food items count >= 8 (actual: ${initialFoodItems.length})`);
  const validCategories = ["pizza", "burger", "drink", "dessert"];
  const allCategoriesValid = initialFoodItems.every((item) =>
    validCategories.includes(item.category)
  );
  assert(allCategoriesValid, "All food items belong to valid categories");

  // 2. Customer types & discounts
  const guest = createGuestCustomer(1, "John Guest", "123 Street");
  const silverMember = createMemberCustomer(2, "Alice Silver", "456 Ave", "silver", "MEM-001");
  const goldMember = createMemberCustomer(3, "Bob Gold", "789 Blvd", "gold", "MEM-002");
  const platMember = createMemberCustomer(4, "Carol Plat", "101 Road", "platinum", "MEM-003");

  assert(!isMember(guest), "Guest is correctly narrowed as not a member");
  assert(isMember(silverMember), "Silver member is correctly narrowed as member");
  assert(getCustomerDiscountPercentage(guest) === 0, "Guest discount is 0%");
  assert(getCustomerDiscountPercentage(silverMember) === 5, "Silver discount is 5%");
  assert(getCustomerDiscountPercentage(goldMember) === 10, "Gold discount is 10%");
  assert(getCustomerDiscountPercentage(platMember) === 15, "Platinum discount is 15%");

  // 3. Cart operations
  let cart: CartItem[] = [];
  const pizza = initialFoodItems[0]; // Margherita ₹299
  const burger = initialFoodItems[3]; // Classic Veg Burger ₹149

  cart = addToCart(cart, pizza, 2, "extra oregano");
  assert(cart.length === 1, "Added 1 item type to cart");
  assert(cart[0].quantity === 2, "Cart item quantity is 2");
  assert(cart[0].specialInstruction === "extra oregano", "Special instruction preserved");

  // Adding same item increases quantity
  cart = addToCart(cart, pizza, 1, "crispy crust");
  assert(cart.length === 1, "Cart item merged on duplicate addition");
  assert(cart[0].quantity === 3, "Cart item quantity updated to 3");
  assert(Boolean(cart[0].specialInstruction?.includes("extra oregano")), "Special instructions combined");

  // Add another item
  cart = addToCart(cart, burger, 2);
  assert(cart.length === 2, "Cart now has 2 distinct items");

  // Subtotal check: 3 * 299 + 2 * 149 = 897 + 298 = 1195
  const subtotal = calculateSubtotal(cart);
  assert(subtotal === 1195, `Cart subtotal correctly calculated (expected 1195, got ${subtotal})`);

  // Update quantity
  cart = updateQuantity(cart, burger.id, 1);
  assert(cart.find((i) => i.id === burger.id)?.quantity === 1, "Burger quantity updated to 1");

  // Remove item
  cart = removeFromCart(cart, burger.id);
  assert(cart.length === 1 && !cart.some((i) => i.id === burger.id), "Burger removed from cart");

  // 4. Discount rules & GST calculations
  // Test case: Subtotal ₹2500 for Gold Member (10% = 250) + Bulk discount (>2000: 5% = 125)
  const discountGold = calculateDiscount(2500, goldMember);
  assert(discountGold.membershipDiscount === 250, "Gold membership discount on 2500 is 250");
  assert(discountGold.bulkDiscount === 125, "Bulk discount on 2500 is 125 (5%)");
  assert(discountGold.totalDiscount === 375, "Total discount on 2500 is 375");
  assert(discountGold.amountAfterDiscount === 2125, "Amount after discount is 2125");

  const tax = calculateTax(discountGold.amountAfterDiscount);
  // 5% of 2125 = 106.25
  assert(tax === 106.25, `5% GST correctly calculated (expected 106.25, got ${tax})`);

  const finalAmt = calculateFinalAmount(2500, goldMember);
  assert(finalAmt === 2231.25, `Final amount after discount and GST is 2231.25 (got ${finalAmt})`);

  // 5. Payments & Type Narrowing
  const cashPay: Payment = { method: "cash", receivedAmount: 2500 };
  const cashRes = processPayment(cashPay, 2231.25);
  assert(cashRes.success && cashRes.change === 268.75, "Cash payment processes change properly");

  const cardPay: Payment = { method: "card", last4Digits: "4242" };
  const cardRes = processPayment(cardPay, 500);
  assert(cardRes.success, "Valid card payment succeeds");

  const badCardPay: Payment = { method: "card", last4Digits: "12" };
  const badCardRes = processPayment(badCardPay, 500);
  assert(!badCardRes.success, "Invalid card (not 4 digits) fails");

  const upiPay: Payment = { method: "upi", transactionId: "UPI987654321" };
  const upiRes = processPayment(upiPay, 500);
  assert(upiRes.success, "Valid UPI payment succeeds");

  // 6. Bill Generation & Discriminated Union
  const validBill = generateBill("ORD-001", goldMember, cart, cashPay, "confirmed");
  assert(validBill.status === "success", "Bill generated successfully with status 'success'");
  if (validBill.status === "success") {
    assert(validBill.orderId === "ORD-001", "Order ID correctly set");
    assert(validBill.customer.name === "Bob Gold", "Customer name verified");
    assert(validBill.payment.method === "cash", "Payment method verified");
  }

  // Error case: empty cart
  const emptyCartBill = generateBill("ORD-002", goldMember, [], cashPay);
  assert(emptyCartBill.status === "error", "Empty cart produces status 'error'");

  // Error case: missing customer
  const noCustBill = generateBill("ORD-003", null, cart, cashPay);
  assert(noCustBill.status === "error", "Missing customer produces status 'error'");

  // 7. Order Status Transitions & History
  const statusRes = updateOrderStatus("pending", "confirmed");
  assert(statusRes.success && statusRes.status === "confirmed", "Pending to confirmed transition allowed");

  const deliverRes = updateOrderStatus("delivered", "cancelled");
  assert(!deliverRes.success, "Transitioning from delivered is disallowed");

  if (validBill.status === "success") {
    const saved = saveOrderToHistory(validBill);
    assert(saved.orderId === "ORD-001", "Order saved in history");
    const history = getOrderHistory();
    assert(history.length > 0, "Order history contains recorded order");
  }

  // 8. Optional Feature: Coupon Discount
  const coupon = availableCoupons[0]; // WELCOME50: flat 50 off on >= 200
  const couponDiscount = calculateDiscount(500, guest, coupon);
  assert(couponDiscount.couponDiscount === 50, "Coupon WELCOME50 applies 50 discount");

  console.log(`\n🎉 ALL ${passedCount} VERIFICATIONS PASSED SUCCESSFULLY!`);
}

runAllVerifications();
