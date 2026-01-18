
import { 
  SystemSettings, Role, User, Zone, Table, TableStatus, Category, 
  InventoryItem, MenuItem, Order, OrderStatus, Customer, Coupon, Booking 
} from '../types';

export const INITIAL_SETTINGS: SystemSettings = {
  restaurantName: 'SiamSavory',
  restaurantLogo: '',
  vatRate: 7,
  currency: '₭',
  currencies: [
    { code: 'LAK', symbol: '₭', rate: 1, isBase: true },
    { code: 'THB', symbol: '฿', rate: 650, isBase: false },
    { code: 'USD', symbol: '$', rate: 22500, isBase: false }
  ],
  emailNotifications: false,
  inAppNotifications: true,
  alertEmail: 'manager@siamsavory.com',
  paymentQrImage: '',
  receipt: {
    headerText: 'SiamSavory',
    subHeaderText: 'Authentic Thai Cuisine',
    address: '123 Sukhumvit Road, Bangkok',
    phone: '02-123-4567',
    footerText: 'Thank you for dining with us!',
    showLogo: true,
    showImageLogo: false,
    taxId: 'TAX-000-123',
    showQrCode: false,
    showCurrencyExchange: false,
    showPaymentMethod: true
  },
  categoryMapping: {
      'c1': 'kitchen', // Appetizers
      'c2': 'kitchen', // Main Course
      'c3': 'kitchen', // Soups
      'c4': 'kitchen', // Desserts
      'c5': 'bar'      // Beverages
  },
  loyaltyProgram: {
      enabled: true,
      spendRate: 100 // 1 Point per 100 Currency Units
  }
};

export const INITIAL_ROLES: Role[] = [
  { 
    id: 'r1', 
    name: 'Admin',
    isSystem: true,
    permissions: [
      'view_dashboard', 'access_pos', 'view_orders', 'view_bar', 'manage_tables', 
      'manage_menu', 'manage_inventory', 'manage_promotions', 
      'manage_bookings', 'manage_customers', 'manage_employees', 
      'view_reports', 'manage_settings'
    ]
  },
  {
    id: 'r2',
    name: 'Manager',
    permissions: [
      'view_dashboard', 'access_pos', 'view_orders', 'view_bar', 'manage_tables', 
      'manage_menu', 'manage_inventory', 'manage_promotions', 
      'manage_bookings', 'manage_customers', 'view_reports'
    ]
  },
  {
    id: 'r3',
    name: 'Staff',
    permissions: [
      'access_pos', 'view_orders', 'view_bar', 'manage_bookings', 'manage_customers'
    ]
  },
  {
    id: 'r4',
    name: 'Kitchen',
    permissions: [
      'view_orders', 'manage_inventory'
    ]
  }
];

export const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Admin User', username: 'admin', password: '123', roleId: 'r1' },
  { id: 'u2', name: 'John Manager', username: 'manager', password: '123', roleId: 'r2' },
  { id: 'u3', name: 'Sarah Staff', username: 'staff', password: '123', roleId: 'r3' },
  { id: 'u4', name: 'Chef Mike', username: 'kitchen', password: '123', roleId: 'r4' },
];

export const INITIAL_ZONES: Zone[] = [
  { id: 'z1', name: 'Main Hall', color: 'bg-blue-100' },
  { id: 'z2', name: 'Patio', color: 'bg-green-100' },
  { id: 'z3', name: 'VIP', color: 'bg-purple-100' },
];

export const INITIAL_TABLES: Table[] = [
  { id: 't1', name: '1', zone: 'Main Hall', seats: 4, status: TableStatus.AVAILABLE },
  { id: 't2', name: '2', zone: 'Main Hall', seats: 4, status: TableStatus.OCCUPIED },
  { id: 't3', name: '3', zone: 'Main Hall', seats: 2, status: TableStatus.AVAILABLE },
  { id: 't4', name: '4', zone: 'Main Hall', seats: 6, status: TableStatus.AVAILABLE },
  { id: 't5', name: '5', zone: 'Patio', seats: 4, status: TableStatus.AVAILABLE },
  { id: 't6', name: '6', zone: 'Patio', seats: 4, status: TableStatus.RESERVED },
  { id: 't7', name: 'V1', zone: 'VIP', seats: 8, status: TableStatus.AVAILABLE },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Appetizers' },
  { id: 'c2', name: 'Main Course' },
  { id: 'c3', name: 'Soups' },
  { id: 'c4', name: 'Desserts' },
  { id: 'c5', name: 'Beverages' },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv1', name: 'Rice', quantity: 50, unit: 'kg', minQuantity: 10, costPerUnit: 20000, category: 'Grains', logs: [] },
  { id: 'inv2', name: 'Chicken Breast', quantity: 20, unit: 'kg', minQuantity: 5, costPerUnit: 80000, category: 'Meat', logs: [] },
  { id: 'inv3', name: 'Shrimp', quantity: 15, unit: 'kg', minQuantity: 5, costPerUnit: 160000, category: 'Seafood', logs: [] },
  { id: 'inv4', name: 'Eggs', quantity: 100, unit: 'pcs', minQuantity: 20, costPerUnit: 3000, category: 'Dairy', logs: [] },
  { id: 'inv5', name: 'Coconut Milk', quantity: 30, unit: 'cans', minQuantity: 10, costPerUnit: 30000, category: 'Pantry', logs: [] },
  { id: 'inv6', name: 'Mango', quantity: 40, unit: 'kg', minQuantity: 5, costPerUnit: 40000, category: 'Fruit', logs: [] },
];

export const INITIAL_MENU: MenuItem[] = [
  { 
    id: 'm1', 
    name: 'Pad Thai', 
    price: 79000, 
    categoryId: 'c2', 
    description: 'Stir-fried rice noodles with eggs, peanuts, and shrimp.',
    image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    recipe: [{ inventoryItemId: 'inv3', quantity: 0.1 }, { inventoryItemId: 'inv4', quantity: 1 }]
  },
  { 
    id: 'm2', 
    name: 'Tom Yum Kung', 
    price: 119000, 
    categoryId: 'c3', 
    description: 'Spicy and sour prawn soup with lemongrass and galangal.',
    image: 'https://images.unsplash.com/photo-1548943487-a2e4e43b485c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    recipe: [{ inventoryItemId: 'inv3', quantity: 0.2 }, { inventoryItemId: 'inv5', quantity: 0.5 }]
  },
  { 
    id: 'm3', 
    name: 'Green Curry', 
    price: 99000, 
    categoryId: 'c2', 
    description: 'Thai chicken green curry with eggplant and basil.',
    image: 'https://images.unsplash.com/photo-1626804475297-411dbe63725e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    recipe: [{ inventoryItemId: 'inv2', quantity: 0.2 }, { inventoryItemId: 'inv5', quantity: 1 }]
  },
  { 
    id: 'm4', 
    name: 'Mango Sticky Rice', 
    price: 79000, 
    categoryId: 'c4', 
    description: 'Sweet sticky rice with fresh mango and coconut cream.',
    image: 'https://images.unsplash.com/photo-1629196911514-cfd8d628b26e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    recipe: [{ inventoryItemId: 'inv1', quantity: 0.1 }, { inventoryItemId: 'inv6', quantity: 0.2 }]
  },
  { 
    id: 'm5', 
    name: 'Thai Iced Tea', 
    price: 39000, 
    categoryId: 'c5', 
    description: 'Authentic Thai tea with condensed milk.',
    image: 'https://images.unsplash.com/photo-1594266063697-30af7f22b0c9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    station: 'bar',
    isAvailable: true
  },
  { 
    id: 'm6', 
    name: 'Spring Rolls', 
    price: 59000, 
    categoryId: 'c1', 
    description: 'Crispy vegetable spring rolls with sweet chili sauce.',
    image: 'https://images.unsplash.com/photo-1544510802-3932e67a577d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    isAvailable: true
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-123456',
    tableId: 't2',
    items: [
      { menuId: 'm1', name: 'Pad Thai', quantity: 2, price: 79000 },
      { menuId: 'm5', name: 'Thai Iced Tea', quantity: 2, price: 39000 }
    ],
    status: OrderStatus.SERVED,
    kitchenStatus: OrderStatus.SERVED,
    barStatus: OrderStatus.SERVED,
    total: 236000,
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    customerName: 'Alice'
  },
  {
    id: 'ord-123457',
    tableId: 't6',
    items: [
      { menuId: 'm3', name: 'Green Curry', quantity: 1, price: 99000 },
      { menuId: 'm1', name: 'Pad Thai', quantity: 1, price: 79000 }
    ],
    status: OrderStatus.PENDING, // Overall pending (maybe waiting for items)
    kitchenStatus: OrderStatus.COOKING, // Kitchen is working
    barStatus: OrderStatus.NONE, // No bar items
    total: 178000,
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
  },
  {
    id: 'ord-123458',
    tableId: 't4',
    items: [
      { menuId: 'm5', name: 'Thai Iced Tea', quantity: 1, price: 39000 }
    ],
    status: OrderStatus.PENDING,
    kitchenStatus: OrderStatus.NONE,
    barStatus: OrderStatus.PENDING, // Bar pending
    total: 39000,
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'cust1', name: 'Alice Johnson', phone: '0812345678', points: 78000, tier: 'Bronze', visitCount: 3, joinDate: new Date('2023-01-01') },
  { id: 'cust2', name: 'Bob Smith', phone: '0898765432', points: 357500, tier: 'Silver', visitCount: 12, joinDate: new Date('2023-02-15') },
  { id: 'cust3', name: 'Charlie Brown', phone: '0855555555', points: 975000, tier: 'Gold', visitCount: 45, joinDate: new Date('2022-11-20') },
];

export const INITIAL_COUPONS: Coupon[] = [
  { id: 'cp1', code: 'WELCOME10', type: 'percent', value: 10, pointCost: 0, isActive: true, description: '10% off for new customers' },
  { id: 'cp2', code: 'LUNCH30K', type: 'amount', value: 30000, pointCost: 0, isActive: true, description: '30,000 LAK off lunch special' },
  { id: 'cp3', code: 'FREE-DESSERT', type: 'amount', value: 79000, pointCost: 325000, isActive: true, description: 'Redeem 325,000 points for a free dessert' },
];

export const INITIAL_BOOKINGS: Booking[] = [
  { id: 'bk1', customerName: 'David Lee', phone: '0811112222', date: '2023-11-01', time: '18:00', guests: 4, status: 'Confirmed', tableId: 't5' },
  { id: 'bk2', customerName: 'Emma Wilson', phone: '0833334444', date: '2023-11-01', time: '19:30', guests: 2, status: 'Pending' },
];
