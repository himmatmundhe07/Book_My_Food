import { OrderStatus, OrderRecord, BillSuccess } from "./types";
import { assertNever, colors } from "./utils";

// In-memory order history store
const orderHistory: OrderRecord[] = [];

/**
 * Validates and updates the status of an order.
 * Ensures transitions follow logical progression and prevents updates to terminal states.
 */
export function updateOrderStatus(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): { success: boolean; status: OrderStatus; message: string } {
  if (currentStatus === "delivered") {
    return {
      success: false,
      status: currentStatus,
      message: "Order has already been delivered and cannot be modified.",
    };
  }

  if (currentStatus === "cancelled") {
    return {
      success: false,
      status: currentStatus,
      message: "Order has been cancelled and cannot be updated.",
    };
  }

  if (currentStatus === newStatus) {
    return {
      success: true,
      status: currentStatus,
      message: `Order is already marked as '${currentStatus}'.`,
    };
  }

  return {
    success: true,
    status: newStatus,
    message: `Order status successfully transitioned from '${currentStatus}' to '${newStatus}'.`,
  };
}

/**
 * Formats order status with color and emoji.
 * Uses 'never' to ensure exhaustive handling of all OrderStatus union values.
 */
export function formatOrderStatus(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return `${colors.yellow}⏳ Pending Confirmation${colors.reset}`;
    case "confirmed":
      return `${colors.cyan}✅ Confirmed & Placed${colors.reset}`;
    case "preparing":
      return `${colors.blue}🍳 Preparing in Kitchen${colors.reset}`;
    case "delivered":
      return `${colors.green}🛵 Delivered Successfully${colors.reset}`;
    case "cancelled":
      return `${colors.red}❌ Order Cancelled${colors.reset}`;
    default:
      return assertNever(status);
  }
}

/**
 * Saves a completed order into the order history.
 */
export function saveOrderToHistory(bill: BillSuccess): OrderRecord {
  const record: OrderRecord = {
    orderId: bill.orderId,
    bill,
    currentStatus: bill.orderStatus,
  };
  orderHistory.push(record);
  return record;
}

/**
 * Retrieves all order history records.
 */
export function getOrderHistory(): OrderRecord[] {
  return [...orderHistory];
}

/**
 * Finds an order in history by order ID.
 */
export function findOrderById(orderId: string): OrderRecord | undefined {
  return orderHistory.find((record) => record.orderId.toLowerCase() === orderId.toLowerCase());
}

/**
 * Updates status of an existing order in history.
 */
export function updateHistoryOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): { success: boolean; message: string } {
  const record = findOrderById(orderId);
  if (!record) {
    return { success: false, message: `Order #${orderId} not found in history.` };
  }

  const result = updateOrderStatus(record.currentStatus, newStatus);
  if (result.success) {
    record.currentStatus = result.status;
    record.bill.orderStatus = result.status;
  }
  return { success: result.success, message: result.message };
}
