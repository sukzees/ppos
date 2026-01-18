
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MenuItem, InventoryItem, Order, Table, Customer, OrderStatus, TableStatus, InventoryLog, SystemSettings, AppNotification, Booking, User, Role, Permission, Zone, Category, CustomerTier, Coupon, OrderItem } from '../types';
import { INITIAL_MENU, INITIAL_INVENTORY, INITIAL_ORDERS, INITIAL_TABLES, INITIAL_CUSTOMERS, INITIAL_SETTINGS, INITIAL_BOOKINGS, INITIAL_USERS, INITIAL_ROLES, INITIAL_ZONES, INITIAL_CATEGORIES, INITIAL_COUPONS } from '../services/mockData';

interface StoreContextType {
  menu: MenuItem[];
  categories: Category[];
  inventory: InventoryItem[];
  orders: Order[];
  tables: Table[];
  zones: Zone[];
  customers: Customer[];
  coupons: Coupon[];
  settings: SystemSettings;
  notifications: AppNotification[];
  bookings: Booking[];
  users: User[];
  roles: Role[];
  currentUser: User | null;
  
  // Actions
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateOrderStationStatus: (orderId: string, station: 'kitchen' | 'bar', status: OrderStatus) => void;
  updateOrderItemStatus: (orderId: string, itemIndex: number, status: OrderStatus) => void;
  updateOrderDiscount: (orderId: string, discount: number) => void; 
  voidOrder: (orderId: string, reason: string) => void;
  updateInventory: (item: InventoryItem, reason?: string) => void;
  addInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (id: string) => void;
  
  updateMenuItem: (item: MenuItem) => void;
  addMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (id: string) => void;
  
  // Category Actions
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;

  // Table Actions
  addTable: (table: Table) => void;
  updateTable: (table: Table) => void;
  deleteTable: (id: string) => void;
  updateTableStatus: (id: string, status: TableStatus) => void;
  mergeTables: (masterId: string, slaveId: string) => void;
  unmergeTables: (masterId: string, slaveId: string) => void;
  unmergeAllTables: (masterId: string) => void; 
  transferTable: (fromId: string, toId: string) => void;
  toggleTableCall: (tableId: string, status: boolean) => void;
  
  // Zone Actions
  addZone: (zone: Zone) => void;
  updateZone: (zone: Zone) => void;
  deleteZone: (id: string) => void;

  updateSettings: (settings: SystemSettings) => void;
  removeNotification: (id: string) => void;
  addNotification: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
  removeOrderItem: (orderId: string, itemIndex: number) => void;
  addBooking: (booking: Booking) => void;
  updateBooking: (booking: Booking) => void;
  deleteBooking: (id: string) => void;
  
  // Customer Actions
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  updateCustomerLoyalty: (customerId: string, pointsToAdd: number, incrementVisit: boolean) => void;
  deleteCustomer: (id: string) => void;
  redeemCouponForCustomer: (customerId: string, couponId: string) => boolean;

  // Coupon Actions
  addCoupon: (coupon: Coupon) => void;
  updateCoupon: (coupon: Coupon) => void;
  deleteCoupon: (id: string) => void;

  // User Actions
  login: (username: string, pin: string) => boolean;
  logout: () => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
  
  // Role Actions
  addRole: (role: Role) => void;
  updateRole: (role: Role) => void;
  deleteRole: (id: string) => void;
  hasPermission: (permission: Permission) => boolean;
  getRole: (id: string) => Role | undefined;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [menu, setMenu] = useState<MenuItem[]>(INITIAL_MENU);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Helper to add notification
  const addNotification = (type: 'info' | 'success' | 'warning' | 'error', message: string) => {
    const newNotif: AppNotification = {
      id: Date.now().toString() + Math.random(),
      type,
      message,
      timestamp: new Date()
    };
    setNotifications(prev => [newNotif, ...prev]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const checkLowStock = (item: InventoryItem, oldQty: number, newQty: number) => {
    if (oldQty > item.minQuantity && newQty <= item.minQuantity) {
      if (settings.inAppNotifications) {
        addNotification('warning', `Low Stock Alert: ${item.name} is down to ${newQty} ${item.unit}.`);
      }
    }
  };

  const calculateTier = (points: number): CustomerTier => {
    if (points >= 500000) return 'Gold';
    if (points >= 100000) return 'Silver';
    return 'Bronze';
  };

  const addOrder = (order: Order) => {
    // Determine Station Statuses based on items
    const hasKitchenItems = order.items.some(item => {
        const menuItem = menu.find(m => m.id === item.menuId);
        if (!menuItem) return true; // Default to kitchen
        if (menuItem.station) return menuItem.station === 'kitchen';
        const station = settings.categoryMapping?.[menuItem.categoryId];
        return station !== 'bar';
    });

    const hasBarItems = order.items.some(item => {
        const menuItem = menu.find(m => m.id === item.menuId);
        if (!menuItem) return false;
        if (menuItem.station) return menuItem.station === 'bar';
        return settings.categoryMapping?.[menuItem.categoryId] === 'bar';
    });

    const isCompleted = order.status === OrderStatus.COMPLETED;

    const newOrder: Order = {
        ...order,
        // Initialize item statuses
        items: order.items.map(item => ({
            ...item,
            status: item.status || (isCompleted ? OrderStatus.SERVED : OrderStatus.PENDING)
        })),
        kitchenStatus: isCompleted ? OrderStatus.COMPLETED : (hasKitchenItems ? OrderStatus.PENDING : OrderStatus.NONE),
        barStatus: isCompleted ? OrderStatus.COMPLETED : (hasBarItems ? OrderStatus.PENDING : OrderStatus.NONE)
    };

    setOrders(prev => [newOrder, ...prev]);
    
    if (newOrder.tableId && newOrder.tableId !== 'takeout' && 
        ![OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(newOrder.status)) {
      updateTableStatus(newOrder.tableId, TableStatus.OCCUPIED);
    }
    
    if (newOrder.status === OrderStatus.COMPLETED && newOrder.customerId) {
        setCustomers(prev => prev.map(c => {
            if (c.id === newOrder.customerId) {
                const earned = newOrder.pointsEarned || 0;
                const redeemed = newOrder.pointsRedeemed || 0;
                const newPoints = Math.max(0, c.points + earned - redeemed);
                return { ...c, points: newPoints, visitCount: c.visitCount + 1, tier: calculateTier(newPoints) };
            }
            return c;
        }));
    }
  };

  // Helper to deduct inventory for a single item
  const deductInventoryForOrderItem = (orderId: string, item: OrderItem) => {
      setInventory(currentInventory => {
          const newInventory = [...currentInventory];
          const menuItem = menu.find(m => m.id === item.menuId);
          if (menuItem && menuItem.recipe) {
              menuItem.recipe.forEach(recipeItem => {
                  const invIndex = newInventory.findIndex(inv => inv.id === recipeItem.inventoryItemId);
                  if (invIndex !== -1) {
                      const amountToDeduct = recipeItem.quantity * item.quantity;
                      const currentQty = newInventory[invIndex].quantity;
                      const newQty = currentQty - amountToDeduct;

                      if (currentQty !== newQty) {
                          checkLowStock(newInventory[invIndex], currentQty, newQty);
                          const log: InventoryLog = {
                              id: `log-${Date.now()}-${Math.random()}`,
                              date: new Date(),
                              changeAmount: -amountToDeduct,
                              reason: `Order #${orderId.slice(-4)}: ${item.name}`,
                              finalQuantity: newQty
                          };
                          newInventory[invIndex] = {
                              ...newInventory[invIndex],
                              quantity: newQty,
                              logs: [log, ...newInventory[invIndex].logs]
                          };
                      }
                  }
              });
          }
          return newInventory;
      });
  };

  // Helper to restore inventory for a single item (e.g. un-serve or void item)
  const restoreInventoryForOrderItem = (orderId: string, item: OrderItem) => {
      setInventory(currentInventory => {
          const newInventory = [...currentInventory];
          const menuItem = menu.find(m => m.id === item.menuId);
          if (menuItem && menuItem.recipe) {
              menuItem.recipe.forEach(recipeItem => {
                  const invIndex = newInventory.findIndex(inv => inv.id === recipeItem.inventoryItemId);
                  if (invIndex !== -1) {
                      const amountToRestore = recipeItem.quantity * item.quantity;
                      const newQty = newInventory[invIndex].quantity + amountToRestore;
                      const log: InventoryLog = {
                          id: `log-restore-${Date.now()}-${Math.random()}`,
                          date: new Date(),
                          changeAmount: amountToRestore,
                          reason: `Restore Order #${orderId.slice(-4)}: ${item.name}`,
                          finalQuantity: newQty
                      };
                      newInventory[invIndex] = {
                          ...newInventory[invIndex],
                          quantity: newQty,
                          logs: [log, ...newInventory[invIndex].logs]
                      };
                  }
              });
          }
          return newInventory;
      });
  };

  // Updates specific item status and recalculates aggregated station status
  const updateOrderItemStatus = (orderId: string, itemIndex: number, status: OrderStatus) => {
      setOrders(prev => prev.map(o => {
          if (o.id !== orderId) return o;

          const newItems = [...o.items];
          const currentItem = newItems[itemIndex];
          
          if (!currentItem || currentItem.status === status) return o;

          // Handle Inventory
          if (status === OrderStatus.SERVED && currentItem.status !== OrderStatus.SERVED) {
              deductInventoryForOrderItem(o.id, currentItem);
          } else if (currentItem.status === OrderStatus.SERVED && status !== OrderStatus.SERVED) {
              restoreInventoryForOrderItem(o.id, currentItem);
          }

          newItems[itemIndex] = { ...currentItem, status };

          // Re-calculate Aggregates
          const getAggStatus = (items: OrderItem[]) => {
              if (items.length === 0) return OrderStatus.NONE;
              if (items.every(i => i.status === OrderStatus.SERVED)) return OrderStatus.SERVED;
              if (items.every(i => !i.status || i.status === OrderStatus.PENDING)) return OrderStatus.PENDING;
              return OrderStatus.COOKING;
          };

          const kitchenItems = newItems.filter(i => {
              const m = menu.find(mu => mu.id === i.menuId);
              if (m?.station) return m.station === 'kitchen';
              return settings.categoryMapping?.[m?.categoryId || ''] !== 'bar';
          });

          const barItems = newItems.filter(i => {
              const m = menu.find(mu => mu.id === i.menuId);
              if (m?.station) return m.station === 'bar';
              return settings.categoryMapping?.[m?.categoryId || ''] === 'bar';
          });

          let newKitchenStatus = o.kitchenStatus;
          let newBarStatus = o.barStatus;

          if (kitchenItems.length > 0) newKitchenStatus = getAggStatus(kitchenItems);
          if (barItems.length > 0) newBarStatus = getAggStatus(barItems);

          // Update Global Status
          let newGlobalStatus = o.status;
          const kDone = newKitchenStatus === OrderStatus.SERVED || newKitchenStatus === OrderStatus.NONE;
          const bDone = newBarStatus === OrderStatus.SERVED || newBarStatus === OrderStatus.NONE;

          if (kDone && bDone && newGlobalStatus !== OrderStatus.COMPLETED && newGlobalStatus !== OrderStatus.CANCELLED) {
              newGlobalStatus = OrderStatus.SERVED;
          } else if ((newKitchenStatus === OrderStatus.COOKING || newBarStatus === OrderStatus.COOKING) && newGlobalStatus === OrderStatus.PENDING) {
              newGlobalStatus = OrderStatus.COOKING;
          }

          return { ...o, items: newItems, kitchenStatus: newKitchenStatus, barStatus: newBarStatus, status: newGlobalStatus };
      }));
  };

  // Updates global status (usually for Payment or Void)
  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    const orderToUpdate = orders.find(o => o.id === orderId);
    if (!orderToUpdate) return;

    let updatedOrder = { ...orderToUpdate, status };

    // If completing the order (Payment), mark stations as completed too
    if (status === OrderStatus.COMPLETED) {
        if (updatedOrder.kitchenStatus !== OrderStatus.NONE) updatedOrder.kitchenStatus = OrderStatus.COMPLETED;
        if (updatedOrder.barStatus !== OrderStatus.NONE) updatedOrder.barStatus = OrderStatus.COMPLETED;
        // Mark all items as served if not already
        updatedOrder.items = updatedOrder.items.map(i => ({...i, status: OrderStatus.SERVED}));
        checkAndFreeTable(orderToUpdate.tableId, orderId);
    }

    setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
  };

  // Updates specific station status (Bulk Action)
  const updateOrderStationStatus = (orderId: string, station: 'kitchen' | 'bar', status: OrderStatus) => {
      setOrders(prev => {
          const o = prev.find(ord => ord.id === orderId);
          if (!o) return prev;

          // Identify items belonging to this station
          const isKitchen = station === 'kitchen';
          const stationItems = o.items.filter(item => {
              const m = menu.find(mu => mu.id === item.menuId);
              const isItemBar = m?.station === 'bar' || settings.categoryMapping?.[m?.categoryId || ''] === 'bar';
              return isKitchen ? !isItemBar : isItemBar;
          });

          // Update items status if we are serving
          if (status === OrderStatus.SERVED) {
              stationItems.forEach(item => {
                  if (item.status !== OrderStatus.SERVED) {
                      deductInventoryForOrderItem(orderId, item);
                  }
              });
          }

          const newItems = o.items.map(item => {
              // If this item belongs to the station being updated, update its status
              const m = menu.find(mu => mu.id === item.menuId);
              const isItemBar = m?.station === 'bar' || settings.categoryMapping?.[m?.categoryId || ''] === 'bar';
              const belongsToStation = isKitchen ? !isItemBar : isItemBar;
              
              if (belongsToStation) {
                  return { ...item, status };
              }
              return item;
          });

          const newOrder = {
              ...o,
              items: newItems,
              [station === 'kitchen' ? 'kitchenStatus' : 'barStatus']: status
          };

          // Auto-update global status logic
          if (newOrder.status !== OrderStatus.COMPLETED && newOrder.status !== OrderStatus.CANCELLED) {
              const kDone = !newOrder.kitchenStatus || newOrder.kitchenStatus === OrderStatus.SERVED || newOrder.kitchenStatus === OrderStatus.NONE;
              const bDone = !newOrder.barStatus || newOrder.barStatus === OrderStatus.SERVED || newOrder.barStatus === OrderStatus.NONE;

              if (kDone && bDone) {
                  newOrder.status = OrderStatus.SERVED;
              }
          }
          return prev.map(ord => ord.id === orderId ? newOrder : ord);
      });
  };

  const updateOrderDiscount = (orderId: string, discount: number) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, discount: Math.min(discount, o.total) } : o));
    addNotification('info', `Discount updated`);
  };

  const voidOrder = (orderId: string, reason: string) => {
      const order = orders.find(o => o.id === orderId);
      if(!order) return;

      // Restore inventory for all served items
      order.items.forEach(item => {
          if (item.status === OrderStatus.SERVED) {
              restoreInventoryForOrderItem(orderId, item);
          }
      });
      
      if (order.status === OrderStatus.COMPLETED && order.customerId) {
           setCustomers(prev => prev.map(c => {
               if (c.id === order.customerId) {
                   const earned = order.pointsEarned || 0;
                   const redeemed = order.pointsRedeemed || 0;
                   const newPoints = Math.max(0, c.points - earned + redeemed);
                   return { ...c, points: newPoints, visitCount: Math.max(0, c.visitCount - 1), tier: calculateTier(newPoints) };
               }
               return c;
           }));
      }

      setOrders(prev => prev.map(o => o.id === orderId ? { 
          ...o, 
          status: OrderStatus.CANCELLED, 
          kitchenStatus: OrderStatus.CANCELLED,
          barStatus: OrderStatus.CANCELLED,
          voidReason: reason,
          items: o.items.map(i => ({...i, status: OrderStatus.CANCELLED}))
      } : o));
      
      checkAndFreeTable(order.tableId, orderId);
      addNotification('warning', `Order #${orderId.slice(-4)} VOIDED. Reason: ${reason}`);
  };

  const checkAndFreeTable = (tableId: string, currentOrderId: string) => {
       if (tableId && tableId !== 'takeout') {
           const hasOtherActiveOrders = orders.some(o => 
             o.id !== currentOrderId && 
             o.tableId === tableId && 
             ![OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(o.status)
           );

           if (!hasOtherActiveOrders) {
               updateTableStatus(tableId, TableStatus.AVAILABLE);
               const table = tables.find(t => t.id === tableId);
               if (table && table.mergedWith) {
                   table.mergedWith.forEach(childId => updateTableStatus(childId, TableStatus.AVAILABLE));
               }
           }
       }
  };

  const updateInventory = (updatedItem: InventoryItem, reason?: string) => {
    setInventory(prev => prev.map(item => {
      if (item.id === updatedItem.id) {
        const diff = updatedItem.quantity - item.quantity;
        if (diff !== 0) {
           checkLowStock(updatedItem, item.quantity, updatedItem.quantity);
           const log: InventoryLog = {
             id: `log-${Date.now()}`,
             date: new Date(),
             changeAmount: diff,
             reason: reason || 'Manual Update',
             finalQuantity: updatedItem.quantity
           };
           return { ...updatedItem, logs: [log, ...item.logs] };
        }
        return { ...updatedItem, logs: item.logs };
      }
      return item;
    }));
  };

  const addInventoryItem = (item: InventoryItem) => {
    const log: InventoryLog = {
      id: `log-${Date.now()}`,
      date: new Date(),
      changeAmount: item.quantity,
      reason: 'Initial Stock',
      finalQuantity: item.quantity
    };
    setInventory(prev => [...prev, { ...item, logs: [log] }]);
  };

  const deleteInventoryItem = (id: string) => setInventory(prev => prev.filter(i => i.id !== id));
  const updateMenuItem = (item: MenuItem) => setMenu(prev => prev.map(m => m.id === item.id ? item : m));
  const addMenuItem = (item: MenuItem) => setMenu(prev => [...prev, item]);
  const deleteMenuItem = (id: string) => setMenu(prev => prev.filter(m => m.id !== id));
  const addCategory = (category: Category) => setCategories(prev => [...prev, category]);
  const updateCategory = (category: Category) => setCategories(prev => prev.map(c => c.id === category.id ? category : c));
  
  const deleteCategory = (id: string) => {
    if (menu.some(m => m.categoryId === id)) {
      addNotification('error', 'Cannot delete category with items');
      return;
    }
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const addTable = (table: Table) => setTables(prev => [...prev, table]);
  const updateTable = (table: Table) => setTables(prev => prev.map(t => t.id === table.id ? table : t));
  const deleteTable = (id: string) => setTables(prev => prev.filter(t => t.id !== id));
  
  const updateTableStatus = (id: string, status: TableStatus) => {
    setTables(prev => prev.map(t => {
      if (t.id === id) {
        if (status === TableStatus.AVAILABLE) return { ...t, status, mergedWith: [], isCallingStaff: false }; 
        return { ...t, status };
      }
      return t;
    }));
  };

  const toggleTableCall = (tableId: string, status: boolean) => {
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, isCallingStaff: status } : t));
      if (status) {
          const table = tables.find(t => t.id === tableId);
          addNotification('warning', `Table ${table?.name || tableId} is calling for service!`);
      }
  };

  const addZone = (zone: Zone) => setZones(prev => [...prev, zone]);
  const updateZone = (zone: Zone) => setZones(prev => prev.map(z => z.id === zone.id ? zone : z));
  
  const deleteZone = (id: string) => {
    if (tables.some(t => t.zone === zones.find(z => z.id === id)?.name)) {
        addNotification('error', 'Cannot delete zone with assigned tables');
        return;
    }
    setZones(prev => prev.filter(z => z.id !== id));
  };
  
  const updateSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    addNotification('success', 'Settings updated');
  };

  const removeOrderItem = (orderId: string, itemIndex: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    // Restore inventory if item was served
    const itemToRemove = order.items[itemIndex];
    if (itemToRemove && itemToRemove.status === OrderStatus.SERVED) {
       restoreInventoryForOrderItem(orderId, itemToRemove);
    }

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const newItems = [...o.items];
        if (itemIndex < 0 || itemIndex >= newItems.length) return o;
        
        newItems.splice(itemIndex, 1);
        
        if (newItems.length === 0) {
           setTimeout(() => checkAndFreeTable(o.tableId, o.id), 0);
           return { ...o, items: [], total: 0, status: OrderStatus.CANCELLED, kitchenStatus: OrderStatus.CANCELLED, barStatus: OrderStatus.CANCELLED, voidReason: 'All items removed' };
        }
        
        // Correctly recalculate total from remaining items using settings.vatRate
        const newSubtotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const vatMultiplier = 1 + (settings.vatRate / 100);
        const newTotal = newSubtotal * vatMultiplier;

        return { ...o, items: newItems, total: newTotal };
      }
      return o;
    }));
    addNotification('info', 'Item removed from order');
  };

  const addBooking = (booking: Booking) => {
    setBookings(prev => [booking, ...prev]);
    if (booking.status === 'Confirmed' && booking.tableId) updateTableStatus(booking.tableId, TableStatus.RESERVED);
  };

  const updateBooking = (updatedBooking: Booking) => {
    setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
    if (updatedBooking.status === 'Confirmed' && updatedBooking.tableId) updateTableStatus(updatedBooking.tableId, TableStatus.RESERVED);
    if ((updatedBooking.status === 'Cancelled') && updatedBooking.tableId) {
       const table = tables.find(t => t.id === updatedBooking.tableId);
       if (table && table.status === TableStatus.RESERVED) updateTableStatus(updatedBooking.tableId, TableStatus.AVAILABLE);
    }
  };

  const deleteBooking = (id: string) => {
    const booking = bookings.find(b => b.id === id);
    if (booking && booking.status === 'Confirmed' && booking.tableId) {
        const table = tables.find(t => t.id === booking.tableId);
        if (table && table.status === TableStatus.RESERVED) {
            updateTableStatus(booking.tableId, TableStatus.AVAILABLE);
        }
    }
    setBookings(prev => prev.filter(b => b.id !== id));
  };

  const mergeTables = (masterId: string, slaveId: string) => {
    setTables(prev => prev.map(t => {
      if (t.id === masterId) return { ...t, mergedWith: [...(t.mergedWith || []), slaveId] };
      if (t.id === slaveId) return { ...t, status: TableStatus.OCCUPIED };
      return t;
    }));
  };

  const unmergeTables = (masterId: string, slaveId: string) => {
    setTables(prev => prev.map(t => {
      if (t.id === masterId) return { ...t, mergedWith: (t.mergedWith || []).filter(id => id !== slaveId) };
      if (t.id === slaveId) {
        const hasOrders = orders.some(o => o.tableId === slaveId && ![OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(o.status));
        return { ...t, status: hasOrders ? TableStatus.OCCUPIED : TableStatus.AVAILABLE };
      }
      return t;
    }));
  };

  const unmergeAllTables = (masterId: string) => {
    setTables(prev => {
        const masterTable = prev.find(t => t.id === masterId);
        if (!masterTable || !masterTable.mergedWith || masterTable.mergedWith.length === 0) return prev;
        const slaveIds = masterTable.mergedWith;
        return prev.map(t => {
            if (t.id === masterId) return { ...t, mergedWith: [] };
            if (slaveIds.includes(t.id)) {
                 const hasOrders = orders.some(o => o.tableId === t.id && ![OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(o.status));
                 return { ...t, status: hasOrders ? TableStatus.OCCUPIED : TableStatus.AVAILABLE };
            }
            return t;
        });
    });
  };

  const transferTable = (fromId: string, toId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.tableId === fromId && ![OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(o.status)) return { ...o, tableId: toId };
      return o;
    }));
    setTables(prev => {
       const fromTable = prev.find(t => t.id === fromId);
       if (!fromTable) return prev;
       return prev.map(t => {
          if (t.id === fromId) return { ...t, status: TableStatus.AVAILABLE, mergedWith: [] }; 
          if (t.id === toId) return { ...t, status: TableStatus.OCCUPIED, mergedWith: fromTable.mergedWith }; 
          return t;
       });
    });
  };

  const addCustomer = (c: Customer) => setCustomers(prev => [...prev, c]);
  const updateCustomer = (c: Customer) => setCustomers(prev => prev.map(cus => cus.id === c.id ? c : cus));
  const deleteCustomer = (id: string) => setCustomers(prev => prev.filter(c => c.id !== id));
  
  const updateCustomerLoyalty = (customerId: string, pointsToAdd: number, incrementVisit: boolean) => {
      setCustomers(prev => prev.map(c => {
          if (c.id === customerId) {
              const newPoints = Math.max(0, c.points + pointsToAdd);
              const newVisitCount = incrementVisit ? c.visitCount + 1 : c.visitCount;
              return { ...c, points: newPoints, visitCount: newVisitCount, tier: calculateTier(newPoints) };
          }
          return c;
      }));
  };

  const redeemCouponForCustomer = (customerId: string, couponId: string): boolean => {
      const customer = customers.find(c => c.id === customerId);
      const coupon = coupons.find(c => c.id === couponId);
      if (!customer || !coupon || customer.points < coupon.pointCost) return false;
      const newPoints = customer.points - coupon.pointCost;
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, points: newPoints, tier: calculateTier(newPoints), ownedCoupons: [...(c.ownedCoupons || []), coupon.code] } : c));
      return true;
  };

  const addCoupon = (c: Coupon) => setCoupons(prev => [...prev, c]);
  const updateCoupon = (c: Coupon) => setCoupons(prev => prev.map(coup => coup.id === c.id ? c : coup));
  const deleteCoupon = (id: string) => setCoupons(prev => prev.filter(c => c.id !== id));

  const login = (u: string, p: string) => {
    const user = users.find(usr => usr.username === u && usr.password === p);
    if (user) { setCurrentUser(user); return true; }
    return false;
  };
  const logout = () => setCurrentUser(null);
  
  const addUser = (u: User) => setUsers(prev => [...prev, u]);
  const updateUser = (u: User) => setUsers(prev => prev.map(user => user.id === u.id ? u : user));
  const deleteUser = (id: string) => setUsers(prev => prev.filter(u => u.id !== id));
  
  const addRole = (r: Role) => setRoles(prev => [...prev, r]);
  const updateRole = (r: Role) => setRoles(prev => prev.map(role => role.id === r.id ? r : role));
  const deleteRole = (id: string) => {
    const role = roles.find(r => r.id === id);
    if (role?.isSystem) return;
    setRoles(prev => prev.filter(r => r.id !== id));
  };
  const getRole = (id: string) => roles.find(r => r.id === id);
  const hasPermission = (permission: Permission) => {
     if (!currentUser) return false;
     const role = roles.find(r => r.id === currentUser.roleId);
     return role ? role.permissions.includes(permission) : false;
  };

  return (
    <StoreContext.Provider value={{
      menu, inventory, orders, tables, zones, categories, customers, settings, notifications, bookings, users, roles, currentUser, coupons,
      addOrder, updateOrderStatus, updateOrderStationStatus, updateOrderItemStatus, voidOrder, updateOrderDiscount, updateInventory, addInventoryItem, deleteInventoryItem,
      updateMenuItem, addMenuItem, deleteMenuItem, 
      addCategory, updateCategory, deleteCategory,
      addTable, updateTable, deleteTable, updateTableStatus, mergeTables, unmergeTables, unmergeAllTables, transferTable, toggleTableCall,
      addZone, updateZone, deleteZone,
      updateSettings, removeNotification, addNotification, removeOrderItem,
      addBooking, updateBooking, deleteBooking,
      addCustomer, updateCustomer, updateCustomerLoyalty, deleteCustomer, redeemCouponForCustomer,
      addCoupon, updateCoupon, deleteCoupon,
      login, logout, addUser, updateUser, deleteUser,
      addRole, updateRole, deleteRole, hasPermission, getRole
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
