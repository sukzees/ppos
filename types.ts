
export interface ReceiptSettings {
  headerText: string;
  subHeaderText: string;
  address: string;
  phone: string;
  footerText: string;
  showLogo: boolean; // Controls text header visibility
  showImageLogo?: boolean; // Controls image logo visibility
  taxId?: string;
  showQrCode?: boolean;
  showCurrencyExchange?: boolean;
  showPaymentMethod?: boolean;
}

export interface Currency {
  code: string;
  symbol: string;
  rate: number; // Exchange rate relative to base currency (1 Unit = X Base)
  isBase?: boolean;
}

export interface SystemSettings {
  restaurantName: string;
  restaurantLogo?: string; // Base64 or URL of the logo
  vatRate: number; // Added VAT Rate
  currency: string; // Added Currency Symbol (Base)
  currencies: Currency[]; // List of supported currencies
  emailNotifications: boolean;
  inAppNotifications: boolean;
  alertEmail: string;
  receipt: ReceiptSettings;
  paymentQrImage?: string; // Uploaded QR Code Image Data URL
  categoryMapping?: Record<string, 'kitchen' | 'bar'>; // Map categoryId to station
  loyaltyProgram?: {
    enabled: boolean;
    spendRate: number; // Amount needed to earn 1 point
  };
}

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: Date;
}

export type Permission = 
  | 'view_dashboard'
  | 'access_pos'
  | 'view_orders'
  | 'view_bar'
  | 'manage_tables'
  | 'manage_menu'
  | 'manage_inventory'
  | 'manage_promotions'
  | 'manage_bookings'
  | 'manage_customers'
  | 'manage_employees'
  | 'view_reports'
  | 'manage_settings';

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  isSystem?: boolean;
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  roleId: string;
}

export interface Zone {
  id: string;
  name: string;
  color: string;
}

export enum TableStatus {
  AVAILABLE = 'Available',
  OCCUPIED = 'Occupied',
  RESERVED = 'Reserved'
}

export interface Table {
  id: string;
  name: string;
  zone: string;
  seats: number;
  status: TableStatus;
  mergedWith?: string[]; // IDs of other tables merged with this one (if master)
  isCallingStaff?: boolean; // New property for Call Staff feature
}

export interface Category {
  id: string;
  name: string;
  names?: string[]; // Optional names for categorization
}

export interface InventoryLog {
  id: string;
  date: Date;
  changeAmount: number;
  reason: string;
  finalQuantity: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  costPerUnit: number;
  category: string;
  logs: InventoryLog[];
}

export interface RecipeItem {
  inventoryItemId: string;
  quantity: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  description?: string;
  image: string;
  isAvailable: boolean;
  recipe?: RecipeItem[];
  station?: 'kitchen' | 'bar'; // Allow item-specific station override
}

export enum OrderStatus {
  PENDING = 'Pending',
  COOKING = 'Cooking',
  SERVED = 'Served',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  NONE = 'None' // Used when an order has no items for a specific station
}

export interface OrderItem {
  menuId: string;
  name: string;
  quantity: number;
  price: number;
  note?: string;
  status?: OrderStatus;
}

export interface Order {
  id: string;
  tableId: string; // 'takeout' or table ID
  items: OrderItem[];
  status: OrderStatus; // Global status (mainly for payment/history)
  kitchenStatus?: OrderStatus; // Independent status for kitchen items
  barStatus?: OrderStatus; // Independent status for bar items
  total: number;
  timestamp: Date;
  customerName?: string;
  customerId?: string;
  paymentMethod?: 'Cash' | 'QR' | 'Card';
  discount?: number;
  pointsEarned?: number;
  pointsRedeemed?: number;
  voidReason?: string;
}

export type CustomerTier = 'Bronze' | 'Silver' | 'Gold';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  points: number;
  tier: CustomerTier;
  visitCount: number;
  joinDate: Date;
  ownedCoupons?: string[]; // Codes of coupons they have
}

export interface Coupon {
  id: string;
  code: string;
  type: 'amount' | 'percent';
  value: number;
  pointCost: number; // Cost in loyalty points to redeem (0 = public)
  isActive: boolean;
  description?: string;
}

export interface Booking {
  id: string;
  customerName: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  tableId?: string;
}
