# Food Ordering & Billing System — Terminal Application
## TypeScript Practice Assignment

A robust, type-safe, terminal-based Food Ordering & Billing System built with **TypeScript** and **Node.js**.

---

## 🚀 Quick Start

### 1. Launch Interactive Terminal Application
```bash
npm run terminal
```

### 2. Run Automated Verification Suite (39 Tests)
```bash
npx tsx src/verify.ts
```

### 3. Run TypeScript Compiler Typecheck
```bash
npx tsc --noEmit
```

---

## 📁 Architecture & File Structure

```text
src/
├── types.ts          # Core interfaces, type aliases, union types, intersection types, discriminated union (BillResult)
├── data.ts           # 12 Food items across 4 categories, sample Guest/Members, and Coupon offers
├── cart.ts           # Cart operations (addToCart, removeFromCart, updateQuantity, calculateItemTotal, calculateSubtotal)
├── customer.ts       # Customer factory functions (Guest & Member: Silver, Gold, Platinum), type narrowing guard
├── payment.ts        # Payment union (Cash, Card, UPI), narrowing validations, change calculation, assertNever
├── billing.ts        # Billing calculations (Membership + ₹2000 bulk discount + coupons + 5% GST), BillResult
├── order.ts          # Order status management, transitions, order history tracking, exhaustive formatting
├── utils.ts          # ANSI styling, ASCII box formatting, Indian Rupee (₹) currency formatter, assertNever helper
├── verify.ts         # Automated test suite with 39 assertions testing all rules and edge cases
└── index.ts          # Interactive terminal workflow and main application loop
```

---

## 📋 Features Implemented

1. **Food Items Menu**:
   - 12 items spanning `"pizza" | "burger" | "drink" | "dessert"`.
   - Categorized viewing, search by keyword, and out-of-stock indicators.
2. **Customer Management**:
   - `Guest` (0% discount) vs `Member` (Silver 5%, Gold 10%, Platinum 15%).
   - Reusable `Customer` union type with type narrowing using the `in` operator.
3. **Cart Operations**:
   - `CartItem` intersection type (`FoodItem & OrderDetail`).
   - Add to cart (merges quantities on duplicates and appends special instructions).
   - Update quantity and remove item.
   - Subtotal calculated with `reduce()`.
4. **Discounts & Billing**:
   - Tiered membership discount (Silver: 5%, Gold: 10%, Platinum: 15%).
   - Additional 5% bulk discount when subtotal exceeds ₹2,000.
   - Sequence: Subtotal -> Membership Discount -> Bulk Discount -> Coupon -> After Discount -> 5% GST -> Final Amount.
5. **Payment Processing**:
   - Discriminated union: `CashPayment | CardPayment | UpiPayment`.
   - Type narrowing via `in` and method check.
   - Cash: validates amount and computes change.
   - Card: validates exactly 4 numeric digits.
   - UPI: validates transaction reference ID.
6. **Order Status & Transitions**:
   - Statuses: `"pending" | "confirmed" | "preparing" | "delivered" | "cancelled"`.
   - Exhaustive handling using `never`-based `assertNever()`.
7. **Discriminated Union Bill Result**:
   - `BillSuccess` with complete receipt information.
   - `BillError` with descriptive error message.
8. **Optional Features Included**:
   - 🎟️ **Coupon Code System**: (`WELCOME50`, `FEAST20`, `SUPER300`) with minimum order value and maximum cap rules.
   - 🔍 **Category Filter & Search**: filter by category or search by item name.
   - 📜 **Order History**: track past orders and their live status.
   - 🎨 **Terminal UI Beautification**: ASCII box borders, ANSI colors, and emojis.

---

## 🛡️ Adherence to All Assignment Restrictions

- ✅ **Strict TypeScript**: Full types for all variables, parameters, and return types.
- ✅ **No `any`**: 0 uses of `any`.
- ✅ **No Classes**: Pure functions and immutable/structural typing.
- ✅ **No Generics**: Only standard built-in arrays `Type[]`.
- ✅ **Modular**: Clean separation of concerns across multiple files.
- ✅ **Exhaustiveness**: `assertNever(value: never): never` enforces compile-time exhaustiveness.
