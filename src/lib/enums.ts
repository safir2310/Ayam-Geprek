// Centralized enum definitions matching Prisma schema

export const OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  DELIVERED: 'DELIVERED',
} as const

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus]

export const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  EXPIRED: 'EXPIRED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const

export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus]

export const PaymentMethod = {
  CASH: 'CASH',
  QRIS_CPM: 'QRIS_CPM',
  DEBIT: 'DEBIT',
  CREDIT: 'CREDIT',
  TRANSFER: 'TRANSFER',
  E_WALLET: 'E_WALLET',
  SPLIT: 'SPLIT',
} as const

export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod]

export const UserRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
  STAFF: 'STAFF',
  USER: 'USER',
} as const

export type UserRole = typeof UserRole[keyof typeof UserRole]

export const ShiftStatus = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
} as const

export type ShiftStatus = typeof ShiftStatus[keyof typeof ShiftStatus]

export const VoidType = {
  ITEM: 'ITEM',
  TRANSACTION: 'TRANSACTION',
} as const

export type VoidType = typeof VoidType[keyof typeof VoidType]

export const PointType = {
  EARNED: 'EARNED',
  REDEEMED: 'REDEEMED',
  ADJUSTMENT: 'ADJUSTMENT',
} as const

export type PointType = typeof PointType[keyof typeof PointType]

export const StockType = {
  IN: 'IN',
  OUT: 'OUT',
  ADJUSTMENT: 'ADJUSTMENT',
  INITIAL: 'INITIAL',
} as const

export type StockType = typeof StockType[keyof typeof StockType]

export const PromoType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
  BUY_1_GET_1: 'BUY_1_GET_1',
  BUNDLE: 'BUNDLE',
} as const

export type PromoType = typeof PromoType[keyof typeof PromoType]

export const NotificationType = {
  ORDER_NEW: 'ORDER_NEW',
  ORDER_CONFIRMED: 'ORDER_CONFIRMED',
  ORDER_COMPLETED: 'ORDER_COMPLETED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  STOCK_LOW: 'STOCK_LOW',
  STOCK_EMPTY: 'STOCK_EMPTY',
} as const

export type NotificationType = typeof NotificationType[keyof typeof NotificationType]

export const NotificationStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
} as const

export type NotificationStatus = typeof NotificationStatus[keyof typeof NotificationStatus]

export const QRISPaymentGateway = {
  MIDTRANS: 'MIDTRANS',
  XENDIT: 'XENDIT',
  TRIPAY: 'TRIPAY',
} as const

export type QRISPaymentGateway = typeof QRISPaymentGateway[keyof typeof QRISPaymentGateway]
