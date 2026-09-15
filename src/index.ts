import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import {
  ID,
  FoodItem,
  Customer,
  CartItem,
  Payment,
  OrderStatus,
  Coupon,
  BillResult,
  FoodCategory,
  MembershipLevel,
} from "./types";
import { initialFoodItems, sampleCustomers, availableCoupons } from "./data";
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
  findOrderById,
  updateHistoryOrderStatus,
} from "./order";
import { colors, drawBox, formatCurrency, assertNever } from "./utils";

// Current session state
let currentCustomer: Customer | null = sampleCustomers[2]; // Default to Rahul (Gold Member) for easy testing
let currentCart: CartItem[] = [];
let appliedCoupon: Coupon | null = null;
let activeBill: BillResult | null = null;
let lastOrderId: string | null = null;

// Unique ID generator for new customers and orders
let nextCustomerId = 200;
let nextOrderSeq = 1001;

function generateOrderId(): string {
  const orderId = `ORD-${nextOrderSeq}`;
  nextOrderSeq += 1;
  return orderId;
}

/**
 * Displays a formatted bill result using type narrowing on discriminated union.
 */
export function displayBill(result: BillResult): void {
  if (result.status === "error") {
    console.log(`\n${colors.red}${colors.bold}❌ BILL GENERATION FAILED${colors.reset}`);
    console.log(`${colors.red}Reason: ${result.message}${colors.reset}\n`);
    return;
  }

  // result is narrowed to BillSuccess
  const {
    orderId,
    customer,
    items,
    subtotal,
    membershipDiscount,
    bulkDiscount,
    couponDiscount,
    totalDiscount,
    amountAfterDiscount,
    tax,
    finalAmount,
    payment,
    orderStatus,
    timestamp,
  } = result;

  const membershipInfo = isMember(customer)
    ? `${customer.membershipLevel.toUpperCase()} (${customer.discountPercentage}%)`
    : "GUEST (0%)";

  const lines: string[] = [
    `Order ID   : ${colors.bold}${orderId}${colors.reset} | Date: ${timestamp}`,
    `Customer   : ${colors.bold}${customer.name}${colors.reset} [${membershipInfo}]`,
    `Address    : ${customer.address}`,
    customer.phone ? `Phone      : ${customer.phone}` : "Phone      : Not provided",
    "─".repeat(50),
    `${colors.bold}${"Item Name".padEnd(24)} ${"Qty".padEnd(5)} ${"Price".padEnd(8)} Total${colors.reset}`,
    "─".repeat(50),
  ];

  items.forEach((item) => {
    const itemTotal = calculateItemTotal(item);
    const nameStr = item.name.length > 22 ? item.name.substring(0, 20) + ".." : item.name;
    lines.push(
      `${nameStr.padEnd(24)} x${String(item.quantity).padEnd(4)} ${formatCurrency(item.price).padEnd(8)} ${formatCurrency(itemTotal)}`
    );
    if (item.specialInstruction) {
      lines.push(`   └ Note: ${colors.italic}${colors.gray}${item.specialInstruction}${colors.reset}`);
    }
  });

  lines.push("─".repeat(50));
  lines.push(`Subtotal                       : ${formatCurrency(subtotal)}`);

  if (membershipDiscount > 0) {
    lines.push(`Membership Discount            : -${formatCurrency(membershipDiscount)}`);
  }
  if (bulkDiscount > 0) {
    lines.push(`Bulk Discount (> ₹2000, 5%)    : -${formatCurrency(bulkDiscount)}`);
  }
  if (couponDiscount > 0) {
    lines.push(`Coupon Discount                : -${formatCurrency(couponDiscount)}`);
  }

  if (totalDiscount > 0) {
    lines.push(`Total Discounts                : -${formatCurrency(totalDiscount)}`);
  }

  lines.push(`Amount After Discount          : ${formatCurrency(amountAfterDiscount)}`);
  lines.push(`GST (5%)                       : +${formatCurrency(tax)}`);
  lines.push("═".repeat(50));
  lines.push(`${colors.bold}${colors.brightGreen}FINAL AMOUNT PAYABLE           : ${formatCurrency(finalAmount)}${colors.reset}`);
  lines.push("═".repeat(50));
  lines.push(`Payment Method : ${formatPaymentDetails(payment)}`);
  lines.push(`Order Status   : ${formatOrderStatus(orderStatus)}`);
  lines.push("");
  lines.push(`       ${colors.brightYellow}Thank you for dining with BookMyFood! 🍕🍔${colors.reset}`);

  console.log("\n" + drawBox("🧾 OFFICIAL ORDER BILL & INVOICE", lines, colors.brightGreen) + "\n");
}

/**
 * Prints the food items menu, optionally filtered or searched.
 */
function displayMenu(items: FoodItem[], filterTitle = "FOOD MENU"): void {
  const lines: string[] = [
    `${colors.bold}${"ID".padEnd(4)} ${"Name".padEnd(32)} ${"Category".padEnd(10)} ${"Price".padEnd(10)} Status${colors.reset}`,
    "─".repeat(64),
  ];

  items.forEach((item) => {
    const statusText = item.isAvailable
      ? `${colors.green}Available${colors.reset}`
      : `${colors.red}Out of stock${colors.reset}`;
    lines.push(
      `${String(item.id).padEnd(4)} ${item.name.padEnd(32)} ${item.category.padEnd(10)} ${formatCurrency(item.price).padEnd(10)} ${statusText}`
    );
  });

  console.log("\n" + drawBox(`🍽️  ${filterTitle}`, lines, colors.brightYellow) + "\n");
}

/**
 * Displays the current cart contents.
 */
function displayCart(): void {
  if (currentCart.length === 0) {
    console.log(`\n${colors.yellow}🛒 Your cart is currently empty.${colors.reset}\n`);
    return;
  }

  const subtotal = calculateSubtotal(currentCart);
  const lines: string[] = [
    `${colors.bold}${"ID".padEnd(4)} ${"Item Name".padEnd(28)} ${"Qty".padEnd(5)} ${"Price".padEnd(10)} Total${colors.reset}`,
    "─".repeat(54),
  ];

  currentCart.forEach((item) => {
    const itemTotal = calculateItemTotal(item);
    lines.push(
      `${String(item.id).padEnd(4)} ${item.name.padEnd(28)} x${String(item.quantity).padEnd(4)} ${formatCurrency(item.price).padEnd(10)} ${formatCurrency(itemTotal)}`
    );
    if (item.specialInstruction) {
      lines.push(`   └ Note: ${colors.gray}${item.specialInstruction}${colors.reset}`);
    }
  });

  lines.push("─".repeat(54));
  lines.push(`${colors.bold}Current Subtotal: ${formatCurrency(subtotal)}${colors.reset}`);

  if (currentCustomer) {
    const discount = calculateDiscount(subtotal, currentCustomer, appliedCoupon ?? undefined);
    const tax = calculateTax(discount.amountAfterDiscount);
    const estTotal = calculateFinalAmount(subtotal, currentCustomer, appliedCoupon ?? undefined);
    lines.push(`Estimated Discounts : -${formatCurrency(discount.totalDiscount)}`);
    lines.push(`Estimated GST (5%)  : +${formatCurrency(tax)}`);
    lines.push(`${colors.brightGreen}Estimated Total     : ${formatCurrency(estTotal)}${colors.reset}`);
  }

  if (appliedCoupon) {
    lines.push(`${colors.magenta}Applied Coupon      : ${appliedCoupon.code} (${appliedCoupon.description})${colors.reset}`);
  }

  console.log("\n" + drawBox("🛒 YOUR SHOPPING CART", lines, colors.cyan) + "\n");
}

/**
 * Interactive menu main loop
 */
async function main(): Promise<void> {
  const rl = readline.createInterface({ input, output });

  console.clear();
  console.log(
    colors.brightYellow +
      `
  ██████╗  ██████╗  ██████╗ ██╗  ██╗███╗   ███╗██╗   ██╗███████╗ ██████╗  ██████╗ ██████╗ 
  ██╔══██╗██╔═══██╗██╔═══██╗██║ ██╔╝████╗ ████║╚██╗ ██╔╝██╔════╝██╔═══██╗██╔═══██╗██╔══██╗
  ██████╔╝██║   ██║██║   ██║█████═╝ ██╔████╔██║ ╚████╔╝ █████╗  ██║   ██║██║   ██║██║  ██║
  ██╔══██╗██║   ██║██║   ██║██╔═██╗ ██║╚██╔╝██║  ╚██╔╝  ██╔══╝  ██║   ██║██║   ██║██║  ██║
  ██████╔╝╚██████╔╝╚██████╔╝██║ ╚██╗██║ ╚═╝ ██║   ██║   ██║     ╚██████╔╝╚██████╔╝██████╔╝
  ╚═════╝  ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝   ╚═╝   ╚═╝      ╚═════╝  ╚═════╝ ╚═════╝ 
        🍛 Terminal Food Ordering & Billing System — TypeScript Edition 🍕
` +
      colors.reset
  );

  let running = true;

  while (running) {
    const custDisplay = currentCustomer
      ? `${currentCustomer.name} (${
          isMember(currentCustomer)
            ? `${currentCustomer.membershipLevel.toUpperCase()} Member - ${currentCustomer.discountPercentage}% off`
            : "Guest"
        })`
      : "No customer selected";

    const cartSummary = `Cart: ${currentCart.reduce((sum, item) => sum + item.quantity, 0)} item(s) | Subtotal: ${formatCurrency(
      calculateSubtotal(currentCart)
    )}`;

    console.log(`${colors.dim}───────────────────────────────────────────────────────────────────────────${colors.reset}`);
    console.log(`${colors.brightCyan}👤 Current User : ${custDisplay}${colors.reset}`);
    console.log(`${colors.brightCyan}🛍️  Cart Status : ${cartSummary}${colors.reset}`);
    if (appliedCoupon) {
      console.log(`${colors.magenta}🎟️  Coupon      : ${appliedCoupon.code} (${appliedCoupon.description})${colors.reset}`);
    }
    console.log(`${colors.dim}───────────────────────────────────────────────────────────────────────────${colors.reset}`);

    console.log(`
${colors.bold}MAIN MENU OPTIONS:${colors.reset}
  1.  🍕 View Food Menu (All / Category Filter / Search)
  2.  👤 Select / Create Customer (Guest or Member)
  3.  ➕ Add Item to Cart
  4.  🛒 View Current Cart
  5.  ✏️  Update Item Quantity in Cart
  6.  ❌ Remove Item from Cart
  7.  🎟️  Apply / View Coupon Codes (Bonus Feature)
  8.  💳 Checkout & Process Payment (Cash / Card / UPI)
  9.  🧾 View Latest Bill Receipt
  10. 🔄 Track / Update Order Status
  11. 📜 Order History (Bonus Feature)
  12. 🚪 Exit Application
`);

    const choice = (await rl.question(`${colors.bold}Select an option (1-12): ${colors.reset}`)).trim();

    switch (choice) {
      case "1": {
        // View Food Menu
        console.log(`
  1. Show All Items
  2. Filter by Category (pizza, burger, drink, dessert)
  3. Search Item by Name
`);
        const menuOpt = (await rl.question("Choose filter (1-3): ")).trim();
        if (menuOpt === "1") {
          displayMenu(initialFoodItems, "ALL FOOD ITEMS");
        } else if (menuOpt === "2") {
          const catInput = (
            await rl.question("Enter category (pizza / burger / drink / dessert): ")
          ).trim().toLowerCase();

          if (
            catInput === "pizza" ||
            catInput === "burger" ||
            catInput === "drink" ||
            catInput === "dessert"
          ) {
            const filtered = initialFoodItems.filter((i) => i.category === catInput);
            displayMenu(filtered, `${catInput.toUpperCase()} MENU`);
          } else {
            console.log(`${colors.red}Invalid category.${colors.reset}`);
          }
        } else if (menuOpt === "3") {
          const query = (await rl.question("Enter search term: ")).trim().toLowerCase();
          const searched = initialFoodItems.filter((i) =>
            i.name.toLowerCase().includes(query)
          );
          if (searched.length > 0) {
            displayMenu(searched, `SEARCH RESULTS FOR "${query.toUpperCase()}"`);
          } else {
            console.log(`${colors.yellow}No food items matched "${query}".${colors.reset}`);
          }
        }
        break;
      }

      case "2": {
        // Select or Create Customer
        console.log(`
  1. Choose from Existing Sample Customers
  2. Create New Guest Customer
  3. Create New Member Customer (Silver / Gold / Platinum)
`);
        const custChoice = (await rl.question("Select option (1-3): ")).trim();

        if (custChoice === "1") {
          console.log("\nSample Customers:");
          sampleCustomers.forEach((c, idx) => {
            const typeStr = isMember(c)
              ? `Member [${c.membershipLevel.toUpperCase()} - ${c.discountPercentage}% off]`
              : "Guest";
            console.log(`  ${idx + 1}. ${c.name} (${typeStr}) - Address: ${c.address}`);
          });
          const selIdx = parseInt(await rl.question("Choose customer number: "), 10) - 1;
          if (selIdx >= 0 && selIdx < sampleCustomers.length) {
            currentCustomer = sampleCustomers[selIdx];
            console.log(`${colors.green}Switched customer to: ${currentCustomer.name}${colors.reset}`);
          } else {
            console.log(`${colors.red}Invalid selection.${colors.reset}`);
          }
        } else if (custChoice === "2") {
          const name = (await rl.question("Enter Guest Name: ")).trim();
          const address = (await rl.question("Enter Delivery Address: ")).trim();
          const phone = (await rl.question("Enter Phone Number (optional): ")).trim();

          if (!name || !address) {
            console.log(`${colors.red}Name and address are required.${colors.reset}`);
          } else {
            currentCustomer = createGuestCustomer(
              nextCustomerId++,
              name,
              address,
              phone || undefined
            );
            console.log(`${colors.green}Created and selected Guest: ${name}${colors.reset}`);
          }
        } else if (custChoice === "3") {
          const name = (await rl.question("Enter Member Name: ")).trim();
          const address = (await rl.question("Enter Delivery Address: ")).trim();
          const phone = (await rl.question("Enter Phone Number (optional): ")).trim();
          console.log("Choose Membership Level:");
          console.log("  1. Silver (5% discount)");
          console.log("  2. Gold (10% discount)");
          console.log("  3. Platinum (15% discount)");
          const lvlOpt = (await rl.question("Selection (1-3): ")).trim();

          let level: MembershipLevel = "silver";
          if (lvlOpt === "2") level = "gold";
          else if (lvlOpt === "3") level = "platinum";

          const membershipId = `MEM-${level.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

          if (!name || !address) {
            console.log(`${colors.red}Name and address are required.${colors.reset}`);
          } else {
            currentCustomer = createMemberCustomer(
              nextCustomerId++,
              name,
              address,
              level,
              membershipId,
              phone || undefined
            );
            console.log(
              `${colors.green}Created Member Customer: ${name} [${level.toUpperCase()} - ID: ${membershipId}]${colors.reset}`
            );
          }
        }
        break;
      }

      case "3": {
        // Add item to cart
        displayMenu(initialFoodItems, "AVAILABLE FOOD MENU");
        const idInput = parseInt(await rl.question("Enter Food Item ID to add: "), 10);
        const item = initialFoodItems.find((f) => f.id === idInput);

        if (!item) {
          console.log(`${colors.red}Food item with ID ${idInput} not found.${colors.reset}`);
          break;
        }

        if (!item.isAvailable) {
          console.log(`${colors.red}Sorry, "${item.name}" is currently out of stock!${colors.reset}`);
          break;
        }

        const qtyInput = parseInt(await rl.question(`Enter quantity for ${item.name}: `), 10);
        if (isNaN(qtyInput) || qtyInput <= 0) {
          console.log(`${colors.red}Invalid quantity. Must be at least 1.${colors.reset}`);
          break;
        }

        const instructions = (
          await rl.question("Special instructions (e.g. 'extra cheese', 'less spicy') [optional]: ")
        ).trim();

        currentCart = addToCart(
          currentCart,
          item,
          qtyInput,
          instructions.length > 0 ? instructions : undefined
        );

        console.log(
          `${colors.green}Added ${qtyInput}x "${item.name}" to cart!${colors.reset}`
        );
        displayCart();
        break;
      }

      case "4": {
        // View cart
        displayCart();
        break;
      }

      case "5": {
        // Update item quantity
        displayCart();
        if (currentCart.length === 0) break;

        const idInput = parseInt(await rl.question("Enter Food Item ID to update: "), 10);
        const itemInCart = currentCart.find((i) => i.id === idInput);

        if (!itemInCart) {
          console.log(`${colors.red}Item ID ${idInput} is not in your cart.${colors.reset}`);
          break;
        }

        const newQty = parseInt(
          await rl.question(`Enter new quantity for "${itemInCart.name}" (0 to remove): `),
          10
        );

        if (isNaN(newQty) || newQty < 0) {
          console.log(`${colors.red}Invalid quantity.${colors.reset}`);
          break;
        }

        currentCart = updateQuantity(currentCart, idInput, newQty);
        if (newQty === 0) {
          console.log(`${colors.yellow}Removed "${itemInCart.name}" from cart.${colors.reset}`);
        } else {
          console.log(`${colors.green}Updated "${itemInCart.name}" quantity to ${newQty}.${colors.reset}`);
        }
        displayCart();
        break;
      }

      case "6": {
        // Remove item from cart
        displayCart();
        if (currentCart.length === 0) break;

        const idInput = parseInt(await rl.question("Enter Food Item ID to remove: "), 10);
        const itemToRemove = currentCart.find((i) => i.id === idInput);

        if (!itemToRemove) {
          console.log(`${colors.red}Item not found in cart.${colors.reset}`);
          break;
        }

        currentCart = removeFromCart(currentCart, idInput);
        console.log(`${colors.yellow}Removed "${itemToRemove.name}" from cart.${colors.reset}`);
        displayCart();
        break;
      }

      case "7": {
        // Apply / View coupon codes
        console.log("\nAvailable Coupon Offers:");
        availableCoupons.forEach((c) => {
          console.log(`  🎟️  ${colors.bold}${c.code}${colors.reset} : ${c.description}`);
        });

        if (appliedCoupon) {
          console.log(`\nCurrently applied: ${colors.magenta}${appliedCoupon.code}${colors.reset}`);
          const removeOpt = (await rl.question("Remove current coupon? (y/n): ")).trim().toLowerCase();
          if (removeOpt === "y") {
            appliedCoupon = null;
            console.log(`${colors.yellow}Coupon removed.${colors.reset}`);
            break;
          }
        }

        const codeInput = (await rl.question("\nEnter coupon code to apply: ")).trim().toUpperCase();
        const foundCoupon = availableCoupons.find((c) => c.code === codeInput);

        if (!foundCoupon) {
          console.log(`${colors.red}Invalid coupon code "${codeInput}".${colors.reset}`);
          break;
        }

        const subtotal = calculateSubtotal(currentCart);
        if (subtotal < foundCoupon.minOrderValue) {
          console.log(
            `${colors.red}Cannot apply coupon. Minimum order value of ${formatCurrency(
              foundCoupon.minOrderValue
            )} required (current subtotal: ${formatCurrency(subtotal)}).${colors.reset}`
          );
          break;
        }

        appliedCoupon = foundCoupon;
        console.log(`${colors.green}Coupon "${foundCoupon.code}" applied successfully!${colors.reset}`);
        break;
      }

      case "8": {
        // Checkout & Payment
        if (currentCart.length === 0) {
          console.log(`${colors.red}Cannot checkout: Cart is empty.${colors.reset}`);
          break;
        }

        if (!currentCustomer) {
          console.log(`${colors.red}Please select or create a customer first (Option 2).${colors.reset}`);
          break;
        }

        displayCart();
        const subtotal = calculateSubtotal(currentCart);
        const finalPayable = calculateFinalAmount(subtotal, currentCustomer, appliedCoupon ?? undefined);

        console.log(
          `\n${colors.bold}${colors.brightYellow}Total Payable Amount: ${formatCurrency(
            finalPayable
          )}${colors.reset}\n`
        );

        console.log("Select Payment Method:");
        console.log("  1. 💵 Cash");
        console.log("  2. 💳 Credit/Debit Card");
        console.log("  3. 📱 UPI");

        const payOpt = (await rl.question("Choose payment method (1-3): ")).trim();
        let paymentObj: Payment | null = null;

        if (payOpt === "1") {
          const cashGiven = parseFloat(
            await rl.question(`Enter cash received (payable: ${formatCurrency(finalPayable)}): `)
          );
          paymentObj = {
            method: "cash",
            receivedAmount: cashGiven,
          };
        } else if (payOpt === "2") {
          const digits = (await rl.question("Enter Card Last 4 Digits: ")).trim();
          paymentObj = {
            method: "card",
            last4Digits: digits,
          };
        } else if (payOpt === "3") {
          const txId = (await rl.question("Enter UPI Transaction ID: ")).trim();
          paymentObj = {
            method: "upi",
            transactionId: txId,
          };
        } else {
          console.log(`${colors.red}Invalid payment option.${colors.reset}`);
          break;
        }

        // Process payment with type narrowing
        const payResult = processPayment(paymentObj, finalPayable);
        if (!payResult.success) {
          console.log(`\n${colors.red}❌ Payment Failed: ${payResult.message}${colors.reset}\n`);
          break;
        }

        console.log(`\n${colors.green}✅ ${payResult.message}${colors.reset}`);
        if (typeof payResult.change === "number" && payResult.change > 0) {
          console.log(
            `${colors.brightYellow}💵 Change to return: ${formatCurrency(payResult.change)}${colors.reset}`
          );
        }

        // Generate Bill
        const orderId = generateOrderId();
        const bill = generateBill(
          orderId,
          currentCustomer,
          currentCart,
          paymentObj,
          "confirmed",
          appliedCoupon ?? undefined
        );

        activeBill = bill;
        lastOrderId = orderId;

        // Display bill
        displayBill(bill);

        // Save order to history if successful
        if (bill.status === "success") {
          saveOrderToHistory(bill);
          // Clear cart and coupon for new order
          currentCart = [];
          appliedCoupon = null;
        }
        break;
      }

      case "9": {
        // View Latest Bill
        if (!activeBill) {
          console.log(`${colors.yellow}No recent bill found. Place an order first.${colors.reset}`);
        } else {
          displayBill(activeBill);
        }
        break;
      }

      case "10": {
        // Track / Update Order Status
        const history = getOrderHistory();
        if (history.length === 0) {
          console.log(`${colors.yellow}No orders in history yet.${colors.reset}`);
          break;
        }

        console.log("\nRecent Orders:");
        history.forEach((rec) => {
          console.log(
            `  ${colors.bold}${rec.orderId}${colors.reset} | Customer: ${rec.bill.customer.name} | Items: ${rec.bill.items.length} | Status: ${formatOrderStatus(
              rec.currentStatus
            )}`
          );
        });

        const targetId = (
          await rl.question(`\nEnter Order ID to change status (e.g. ${history[history.length - 1].orderId}): `)
        ).trim();

        const orderRec = findOrderById(targetId);
        if (!orderRec) {
          console.log(`${colors.red}Order ID ${targetId} not found.${colors.reset}`);
          break;
        }

        console.log(`Current status for ${orderRec.orderId}: ${formatOrderStatus(orderRec.currentStatus)}`);
        console.log("\nSelect New Status:");
        console.log("  1. pending");
        console.log("  2. confirmed");
        console.log("  3. preparing");
        console.log("  4. delivered");
        console.log("  5. cancelled");

        const stOpt = (await rl.question("Choose new status (1-5): ")).trim();
        let newStatus: OrderStatus | null = null;

        if (stOpt === "1") newStatus = "pending";
        else if (stOpt === "2") newStatus = "confirmed";
        else if (stOpt === "3") newStatus = "preparing";
        else if (stOpt === "4") newStatus = "delivered";
        else if (stOpt === "5") newStatus = "cancelled";

        if (!newStatus) {
          console.log(`${colors.red}Invalid status selected.${colors.reset}`);
          break;
        }

        const updateRes = updateHistoryOrderStatus(orderRec.orderId, newStatus);
        if (updateRes.success) {
          console.log(`${colors.green}✅ ${updateRes.message}${colors.reset}`);
          console.log(`Updated Status: ${formatOrderStatus(orderRec.currentStatus)}`);
        } else {
          console.log(`${colors.red}❌ ${updateRes.message}${colors.reset}`);
        }
        break;
      }

      case "11": {
        // Order History
        const history = getOrderHistory();
        if (history.length === 0) {
          console.log(`${colors.yellow}No orders have been completed yet.${colors.reset}`);
          break;
        }

        const lines: string[] = [
          `${colors.bold}${"Order ID".padEnd(10)} ${"Customer".padEnd(16)} ${"Items".padEnd(8)} ${"Amount".padEnd(12)} Status${colors.reset}`,
          "─".repeat(60),
        ];

        history.forEach((rec) => {
          const itemCount = `${rec.bill.items.reduce((s, i) => s + i.quantity, 0)} items`;
          lines.push(
            `${rec.orderId.padEnd(10)} ${rec.bill.customer.name.substring(0, 15).padEnd(16)} ${itemCount.padEnd(8)} ${formatCurrency(
              rec.bill.finalAmount
            ).padEnd(12)} ${formatOrderStatus(rec.currentStatus)}`
          );
        });

        console.log("\n" + drawBox("📜 PAST ORDER HISTORY", lines, colors.brightCyan) + "\n");
        break;
      }

      case "12": {
        // Exit
        console.log(`\n${colors.brightYellow}Thank you for using BookMyFood! Goodbye! 👋${colors.reset}\n`);
        running = false;
        rl.close();
        break;
      }

      default:
        console.log(`${colors.red}Invalid option. Please enter a number from 1 to 12.${colors.reset}`);
        break;
    }
  }
}

// Start application if directly executed
if (require.main === module) {
  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
