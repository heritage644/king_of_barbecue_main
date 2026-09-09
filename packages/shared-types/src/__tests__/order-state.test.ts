import { describe, expect, it } from 'vitest';
import {
  calculateOrderTotals,
  canRoleAccess,
  isValidOrderTransition,
  isValidPaymentTransition,
  OPERATION_ROLES,
  PAYMENT_MANAGEMENT_ROLES
} from '../index.js';

describe('order state machine', () => {
  it('allows the normal fulfillment progression', () => {
    expect(isValidOrderTransition('PENDING', 'APPROVED')).toBe(true);
    expect(isValidOrderTransition('APPROVED', 'IN_PREPARATION')).toBe(true);
    expect(isValidOrderTransition('IN_PREPARATION', 'READY')).toBe(true);
    expect(isValidOrderTransition('READY', 'OUT_FOR_DELIVERY')).toBe(true);
    expect(isValidOrderTransition('OUT_FOR_DELIVERY', 'COMPLETED')).toBe(true);
  });

  it('blocks arbitrary or terminal transitions', () => {
    expect(isValidOrderTransition('PENDING', 'COMPLETED')).toBe(false);
    expect(isValidOrderTransition('COMPLETED', 'CANCELLED')).toBe(false);
    expect(isValidOrderTransition('REJECTED', 'APPROVED')).toBe(false);
  });
});

describe('payment state machine', () => {
  it('supports manual verification without coupling to a payment provider', () => {
    expect(isValidPaymentTransition('UNPAID', 'PAID')).toBe(true);
    expect(isValidPaymentTransition('PAID', 'UNPAID')).toBe(false);
    expect(isValidPaymentTransition('PAID', 'REFUNDED')).toBe(true);
  });
});

describe('authorization helpers', () => {
  it('allows operational roles to access operational capabilities', () => {
    expect(canRoleAccess(['CASHIER'], OPERATION_ROLES)).toBe(true);
    expect(canRoleAccess(['CUSTOMER'], OPERATION_ROLES)).toBe(false);
  });

  it('separates payment-management permissions', () => {
    expect(canRoleAccess(['OPERATIONS_STAFF'], PAYMENT_MANAGEMENT_ROLES)).toBe(false);
    expect(canRoleAccess(['MANAGER'], PAYMENT_MANAGEMENT_ROLES)).toBe(true);
  });
});

describe('pricing calculations', () => {
  it('calculates totals using integer cents', () => {
    expect(calculateOrderTotals([{ unitPriceCents: 125000, quantity: 2 }], 150000)).toEqual({
      subtotalCents: 250000,
      deliveryFeeCents: 150000,
      totalCents: 400000
    });
  });
});
