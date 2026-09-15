import { Customer, GuestCustomer, MemberCustomer, MembershipLevel, ID } from "./types";

/**
 * Type guard to check if customer is a Member.
 * Uses the 'in' operator to perform runtime type narrowing.
 */
export function isMember(customer: Customer): customer is MemberCustomer {
  return "membershipId" in customer && customer.type === "member";
}

/**
 * Factory function to create a Guest Customer.
 */
export function createGuestCustomer(
  id: ID,
  name: string,
  address: string,
  phone?: string
): GuestCustomer {
  return {
    id,
    name,
    address,
    ...(phone ? { phone } : {}),
    type: "guest",
  };
}

/**
 * Helper to get discount percentage based on membership level.
 */
export function getDiscountForLevel(level: MembershipLevel): number {
  switch (level) {
    case "silver":
      return 5;
    case "gold":
      return 10;
    case "platinum":
      return 15;
  }
}

/**
 * Factory function to create a Member Customer.
 */
export function createMemberCustomer(
  id: ID,
  name: string,
  address: string,
  level: MembershipLevel,
  membershipId: string,
  phone?: string
): MemberCustomer {
  return {
    id,
    name,
    address,
    ...(phone ? { phone } : {}),
    type: "member",
    membershipId,
    membershipLevel: level,
    discountPercentage: getDiscountForLevel(level),
  };
}

/**
 * Returns the customer's discount percentage using type narrowing.
 */
export function getCustomerDiscountPercentage(customer: Customer): number {
  if (isMember(customer)) {
    return customer.discountPercentage;
  }
  return 0;
}
