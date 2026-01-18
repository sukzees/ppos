
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Table, TableStatus, MenuItem, Order, OrderStatus, Customer, Coupon, Category } from '../../types';
import { 
  Search, Grid, List, Plus, Minus, Trash2, 
  ChefHat, CreditCard, QrCode, Users, 
  ArrowLeft, ArrowRightLeft, Link as LinkIcon, Unlink, UserCheck, 
  Coffee, Utensils, Percent, RotateCcw, Save, LogOut, Receipt,
  User, CheckCircle, Smartphone, Banknote, ShoppingBag, Clock, Delete,
  TicketPercent, X, Download, Bell
} from 'lucide-react';

const POS: React.FC = () => {
  const { 
    tables, zones, menu, categories, orders, customers, coupons, settings, bookings,
    addOrder, updateOrderStatus, updateTableStatus, mergeTables, unmergeTables, unmergeAllTables, transferTable,
    addNotification, updateOrderDiscount, addCustomer, redeemCouponForCustomer, updateCustomerLoyalty, toggleTableCall
  } = useStore();

  // --- State ---
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{item: MenuItem, quantity: number, note?: string}[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Modes
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [isTransferMode, setIsTransferMode] = useState(false);
  const [isQrMode, setIsQrMode] = useState(false);
  
  // View State (Tables vs Takeout)
  const [posView, setPosView] = useState<'tables' | 'takeout'>('tables');

  // Payment / Checkout State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'QR'>('Cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Discount Input State
  const [discountInput, setDiscountInput] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');

  // Coupon Input State
  const [couponInput, setCouponInput] = useState('');
  const [showCouponList, setShowCouponList] = useState(false);

  // QR Modal State
  const [qrTable, setQrTable] = useState<Table | null>(null);

  // Customer Search
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');

  // --- Derived State ---
  
  // Active Orders for the selected table (excluding completed/cancelled)
  const activeOrders = useMemo(() => {
    if (!selectedTable) return [];
    return orders.filter(o => 
      o.tableId === selectedTable.id && 
      ![OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(o.status)
    );
  }, [selectedTable, orders]);

  // Combined Existing Items from active orders
  const existingItems = useMemo(() => {
    return activeOrders.flatMap(o => o.items);
  }, [activeOrders]);

  // Totals
  const existingTotal = activeOrders.reduce((acc, o) => acc + (o.total - (o.discount || 0)), 0);
  const cartTotal = cart.reduce((acc, line) => acc + (line.item.price * line.quantity), 0);
  
  // Calculate VAT for Cart
  const vatMultiplier = 1 + (settings.vatRate / 100);
  const cartTotalWithTax = cartTotal * vatMultiplier;
  
  // Grand Total (Existing Orders + New Cart)
  const subTotalBeforeDiscount = existingTotal + cartTotalWithTax;
  
  // Apply Discount/Coupon
  let discountAmount = discount;
  if (appliedCoupon) {
      if (appliedCoupon.type === 'percent') {
          discountAmount += (subTotalBeforeDiscount * appliedCoupon.value / 100);
      } else {
          discountAmount += appliedCoupon.value;
      }
  }
  
  const finalTotal = Math.max(0, subTotalBeforeDiscount - discountAmount);

  // Filtered Menu
  const filteredMenu = useMemo(() => {
    return menu.filter(item => {
      const matchesCategory = activeCategory === 'All' || item.categoryId === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch && item.isAvailable;
    });
  }, [menu, activeCategory, searchQuery]);

  // Active Takeout Orders Grouped
  const takeoutOrdersList = useMemo(() => {
      const takeouts = orders.filter(o => 
          o.tableId.startsWith('takeout') && 
          ![OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(o.status)
      );
      
      // Group by tableId (which represents a unique takeout session)
      const grouped: Record<string, Order[]> = {};
      takeouts.forEach(o => {
          if (!grouped[o.tableId]) grouped[o.tableId] = [];
          grouped[o.tableId].push(o);
      });
      
      return Object.entries(grouped).map(([tableId, orders]) => ({
          tableId,
          orders,
          customerName: orders[0]?.customerName || 'Guest',
          startTime: orders.sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime())[0]?.timestamp,
          total: orders.reduce((sum, o) => sum + o.total, 0)
      })).sort((a,b) => b.startTime.getTime() - a.startTime.getTime());
  }, [orders]);

  // --- Effects ---

  // Auto-Update Discount when Subtotal changes (if percentage)
  useEffect(() => {
      if (discountType === 'percent' && discountInput) {
          const num = parseFloat(discountInput);
          if (!isNaN(num)) {
              setDiscount(subTotalBeforeDiscount * (Math.min(num, 100) / 100));
          }
      }
  }, [subTotalBeforeDiscount, discountType, discountInput]);

  // Auto-Assign Customer from Incoming Orders (e.g., Self-Order with login)
  useEffect(() => {
    if (selectedTable && activeOrders.length > 0) {
        // Find if any active order has a customer ID attached
        const orderWithCustomer = activeOrders.find(o => o.customerId);
        if (orderWithCustomer && orderWithCustomer.customerId) {
            // Only update if not already set or different to avoid flicker
            if (!selectedCustomer || selectedCustomer.id !== orderWithCustomer.customerId) {
                const customer = customers.find(c => c.id === orderWithCustomer.customerId);
                if (customer) {
                    setSelectedCustomer(customer);
                }
            }
        }
    }
  }, [selectedTable, activeOrders, customers, selectedCustomer]);

  // --- Handlers ---

  const handleDiscountChange = (val: string, type = discountType) => {
      setDiscountInput(val);
      const num = parseFloat(val);
      if (isNaN(num) || num < 0) {
          setDiscount(0);
          return;
      }
      if (type === 'percent') {
          const safePct = Math.min(num, 100);
          setDiscount(subTotalBeforeDiscount * (safePct / 100));
      } else {
          setDiscount(num);
      }
  };

  const handleApplyCoupon = () => {
        if(!couponInput.trim()) return;
        const code = couponInput.trim().toUpperCase();
        const coupon = coupons.find(c => c.code === code && c.isActive);
        if(coupon) {
            setAppliedCoupon(coupon);
            addNotification('success', 'Coupon Applied!');
        } else {
            addNotification('error', 'Invalid Coupon');
        }
  };

  const handleTableClick = (table: Table) => {
    // 0. QR Mode
    if (isQrMode) {
        setQrTable(table);
        return;
    }

    // 1. Acknowledge Call
    if (table.isCallingStaff) {
        toggleTableCall(table.id, false);
    }

    // 2. Merge Mode Logic
    if (isMergeMode && selectedTable) {
        if (table.id === selectedTable.id) { setIsMergeMode(false); return; }
        if (table.mergedWith && table.mergedWith.length > 0) { addNotification('error', 'Cannot merge into a table that already has merged tables.'); return; }
        const isChild = tables.some(t => t.mergedWith?.includes(table.id));
        if (isChild) { addNotification('error', 'This table is already merged into another.'); return; }
        
        mergeTables(selectedTable.id, table.id);
        const updatedMaster = tables.find(t => t.id === selectedTable.id);
        if(updatedMaster) { 
             const newMerged = [...(updatedMaster.mergedWith || []), table.id]; 
             setSelectedTable({ ...updatedMaster, mergedWith: newMerged }); 
        }
        setIsMergeMode(false); 
        addNotification('success', `Table ${table.name} merged into ${selectedTable.name}`);
        return;
    }

    // 3. Transfer Mode Logic
    if (isTransferMode && selectedTable) {
        if (table.id === selectedTable.id) { setIsTransferMode(false); return; }
        if (table.status !== TableStatus.AVAILABLE) { addNotification('error', 'Target table must be available.'); return; }
        
        transferTable(selectedTable.id, table.id);
        setIsTransferMode(false);
        setSelectedTable({ ...table, status: TableStatus.OCCUPIED, mergedWith: selectedTable.mergedWith });
        addNotification('success', `Transferred to Table ${table.name}`);
        return;
    }

    // 4. Handle Slave Table Click (Redirect to Master)
    const parentTable = tables.find(t => t.mergedWith?.includes(table.id));
    if (parentTable) { 
        addNotification('info', `Opened Master Table ${parentTable.name}`); 
        setSelectedCustomer(null); 
        setSelectedTable(parentTable); 
        return; 
    }

    // 5. Handle Reservation Check-in
    if (table.status === TableStatus.RESERVED) {
       if (confirm(`Table ${table.name} is reserved. Check in customer now?`)) {
          updateTableStatus(table.id, TableStatus.OCCUPIED);
          addNotification('success', `Table ${table.name} checked in.`);
          setSelectedCustomer(null);
          setSelectedTable({ ...table, status: TableStatus.OCCUPIED });
          setCart([]);
       }
    } else { 
        // 6. Normal Selection
        setSelectedCustomer(null);
        setSelectedTable(table); 
        setCart([]);
        setDiscount(0);
        setDiscountInput('');
    }
  };

  const handleCreateTakeout = () => {
      const takeoutId = `takeout-${Date.now()}`;
      const takeoutTable: Table = {
          id: takeoutId,
          name: `Takeout #${takeoutId.slice(-4)}`,
          zone: 'Counter',
          seats: 0,
          status: TableStatus.OCCUPIED
      };
      setSelectedCustomer(null);
      setSelectedTable(takeoutTable);
      setCart([]);
      setDiscount(0);
      setDiscountInput('');
  };

  const handleOpenTakeout = (tableId: string, customerName?: string) => {
      const takeoutTable: Table = {
          id: tableId,
          name: `Takeout #${tableId.slice(-4)}`,
          zone: 'Counter',
          seats: 0,
          status: TableStatus.OCCUPIED
      };
      // Try to find customer object if exists
      const existingCustomer = customers.find(c => c.name === customerName);
      setSelectedCustomer(existingCustomer || null);
      setSelectedTable(takeoutTable);
      setCart([]);
      setDiscount(0); // Reset discount when switching table/order
      setDiscountInput('');
  };

  const addToCart = (item: MenuItem) => {
      setCart(prev => {
          const existing = prev.find(line => line.item.id === item.id);
          if (existing) {
              return prev.map(line => line.item.id === item.id ? { ...line, quantity: line.quantity + 1 } : line);
          }
          return [...prev, { item, quantity: 1 }];
      });
  };

  const updateCartQty = (itemId: string, delta: number) => {
      setCart(prev => prev.reduce((acc, line) => {
          if (line.item.id === itemId) {
              const newQty = line.quantity + delta;
              if (newQty > 0) acc.push({ ...line, quantity: newQty });
          } else {
              acc.push(line);
          }
          return acc;
      }, [] as typeof cart));
  };

  const updateCartNote = (itemId: string, note: string) => {
      setCart(prev => prev.map(line => line.item.id === itemId ? { ...line, note } : line));
  };

  const handleSendToKitchen = () => {
      if (!selectedTable || cart.length === 0) return;

      const newOrder: Order = {
          id: `ord-${Date.now()}`,
          tableId: selectedTable.id,
          items: cart.map(line => ({
              menuId: line.item.id,
              name: line.item.name,
              quantity: line.quantity,
              price: line.item.price,
              note: line.note
          })),
          status: OrderStatus.PENDING,
          total: cartTotalWithTax,
          timestamp: new Date(),
          customerName: selectedCustomer?.name,
          customerId: selectedCustomer?.id
      };

      addOrder(newOrder);
      setCart([]);
      addNotification('success', 'Order sent to kitchen');
  };

  const handleCheckout = () => {
      if (!selectedTable) return;
      if (activeOrders.length === 0 && cart.length === 0) {
          addNotification('warning', 'No items to checkout');
          return;
      }
      setShowPaymentModal(true);
      setCashReceived('');
      setCouponInput('');
      setAppliedCoupon(null);
      // Do not reset discount here to persist from sidebar
  };

  const handleFinalizePayment = () => {
      if (!selectedTable) return;

      const spendRate = settings.loyaltyProgram?.spendRate || 100;
      const pointsToAward = settings.loyaltyProgram?.enabled ? Math.floor(finalTotal / spendRate) : 0;

      // 1. If there are items in cart, create an order for them first (auto-send)
      if (cart.length > 0) {
          const newOrder: Order = {
            id: `ord-${Date.now()}`,
            tableId: selectedTable.id,
            items: cart.map(line => ({
                menuId: line.item.id,
                name: line.item.name,
                quantity: line.quantity,
                price: line.item.price,
                note: line.note
            })),
            status: OrderStatus.COMPLETED, // Mark as immediately completed
            total: cartTotalWithTax,
            timestamp: new Date(),
            customerName: selectedCustomer?.name,
            customerId: selectedCustomer?.id,
            paymentMethod: paymentMethod,
            pointsEarned: 0, // Set to 0 because we will award total points manually via updateCustomerLoyalty
          };
          addOrder(newOrder);
          
          // Since addOrder will handle visitCount increment if ID is present, we only add points
          if (selectedCustomer) {
             updateCustomerLoyalty(selectedCustomer.id, pointsToAward, false);
          }
      } else {
          // No cart items, only existing orders.
          // We need to manually add points and increment visit count since addOrder is not called.
          if (selectedCustomer) {
             updateCustomerLoyalty(selectedCustomer.id, pointsToAward, true);
          }
      }

      // 2. Mark existing active orders as completed
      activeOrders.forEach(order => {
          updateOrderStatus(order.id, OrderStatus.COMPLETED);
      });

      // 3. Redeem Coupon if any
      if (appliedCoupon && selectedCustomer) {
          redeemCouponForCustomer(selectedCustomer.id, appliedCoupon.id);
      }

      // 4. Close Modal and Reset
      setShowPaymentModal(false);
      setCart([]);
      setSelectedTable(null);
      setDiscount(0);
      setDiscountInput('');
      setCouponInput('');
      addNotification('success', `Payment Successful. Table ${selectedTable.name} cleared. Points Earned: ${pointsToAward}`);
  };

  const handleUnmergeAll = () => {
      if (selectedTable) {
          unmergeAllTables(selectedTable.id);
          const updated = tables.find(t => t.id === selectedTable.id);
          if (updated) setSelectedTable(updated);
          addNotification('info', 'All tables unmerged');
      }
  };

  const handleCustomerSelect = (customer: Customer) => {
      setSelectedCustomer(customer);
      setShowCustomerSearch(false);
      setCustomerSearchTerm('');
  };

  const getQrUrl = (tableId: string, size: number = 250) => {
    const appUrl = `${window.location.origin}/#/customer/table/${tableId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(appUrl)}`;
  };

  // --- Helper Functions ---
  const getCashSuggestions = (total: number) => {
      if (total <= 0) return [];
      const suggestions = new Set<number>();
      suggestions.add(total);
      
      const factors = [10, 20, 50, 100, 500, 1000, 5000, 10000, 20000, 50000, 100000, 500000, 1000000];
      factors.forEach(f => {
          const next = Math.ceil(total / f) * f;
          if (next > total) suggestions.add(next);
          if (next + f > total) suggestions.add(next + f);
      });
      
      return Array.from(suggestions)
        .sort((a,b) => a-b)
        .filter(v => v >= total)
        .slice(0, 4); // Take top 4 suggestions
  };

  const handleNumPad = (val: number | string) => {
      if (val === 'BS') {
          setCashReceived(prev => prev.slice(0, -1));
      } else if (val === '.') {
          if (!cashReceived.includes('.')) setCashReceived(prev => prev + '.');
      } else {
          setCashReceived(prev => prev + val);
      }
  };

  // --- Render Sections ---

  const renderTableGrid = () => (
      <div className="flex-1 bg-slate-100 flex flex-col h-full overflow-hidden">
          {/* Header Actions / Tabs */}
          <div className="bg-white px-6 py-4 border-b flex justify-between items-center shadow-sm z-10 shrink-0">
              <div className="flex items-center gap-2">
                  <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                      <button 
                        onClick={() => setPosView('tables')}
                        className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${
                            posView === 'tables' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                          <Grid size={18} /> Tables
                      </button>
                      <button 
                        onClick={() => setPosView('takeout')}
                        className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${
                            posView === 'takeout' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                          <ShoppingBag size={18} /> Takeout
                      </button>
                  </div>
                  {posView === 'tables' && (
                      <button 
                        onClick={() => { setIsQrMode(!isQrMode); setIsMergeMode(false); setIsTransferMode(false); }}
                        className={`p-2 rounded-lg font-bold transition-all border ${isQrMode ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-gray-200 hover:border-slate-300'}`}
                        title="Generate QR Code"
                      >
                        <QrCode size={20} />
                      </button>
                  )}
              </div>

              {isMergeMode && (
                 <div className="bg-amber-100 px-4 py-2 rounded text-amber-800 text-sm font-bold flex items-center gap-2 animate-pulse">
                    <span>Select table to merge</span>
                    <button onClick={() => setIsMergeMode(false)} className="bg-white/50 p-1 rounded hover:bg-white"><ArrowLeft size={14}/></button>
                 </div>
              )}
               {isTransferMode && (
                 <div className="bg-blue-100 px-4 py-2 rounded text-blue-800 text-sm font-bold flex items-center gap-2 animate-pulse">
                    <span>Select destination table</span>
                    <button onClick={() => setIsTransferMode(false)} className="bg-white/50 p-1 rounded hover:bg-white"><ArrowLeft size={14}/></button>
                 </div>
              )}
              {isQrMode && (
                 <div className="bg-slate-800 px-4 py-2 rounded text-white text-sm font-bold flex items-center gap-2 animate-pulse">
                    <span>Select table to generate QR</span>
                    <button onClick={() => setIsQrMode(false)} className="bg-white/20 p-1 rounded hover:bg-white/30"><X size={14}/></button>
                 </div>
              )}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
              {posView === 'tables' ? (
                  /* --- TABLE VIEW --- */
                  zones.map(zone => (
                    <div key={zone.id} className="mb-8">
                       <h3 className={`text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-1 ${zone.color} inline-block px-2 rounded`}>Zone {zone.name}</h3>
                       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {tables.filter(t => t.zone === zone.name).map(table => {
                            const parentTable = tables.find(t => t.mergedWith?.includes(table.id));
                            const isMaster = table.mergedWith && table.mergedWith.length > 0;
                            const isSelf = selectedTable?.id === table.id;
                            const isInvalidMergeTarget = isMergeMode && (!!parentTable || isMaster || isSelf);
                            const isInvalidTransferTarget = isTransferMode && (table.status !== TableStatus.AVAILABLE || isSelf);
                            const isDisabled = (isMergeMode && isInvalidMergeTarget) || (isTransferMode && isInvalidTransferTarget);
                            
                            // Check calling staff
                            const isCalling = table.isCallingStaff;

                            // Determine Styles
                            let statusColor = "bg-white border-gray-200";
                            if (table.status === TableStatus.OCCUPIED) statusColor = "bg-red-50 border-red-200";
                            if (table.status === TableStatus.RESERVED) statusColor = "bg-yellow-50 border-yellow-200";
                            if (isSelf) statusColor = "bg-amber-100 border-amber-500 ring-2 ring-amber-300";
                            if (parentTable) statusColor = "bg-gray-100 border-gray-300 border-dashed opacity-70";
                            if (isMergeMode && !isInvalidMergeTarget && !isSelf) statusColor = "bg-green-50 border-green-400 cursor-pointer hover:bg-green-100";
                            if (isTransferMode && !isInvalidTransferTarget && !isSelf) statusColor = "bg-blue-50 border-blue-400 cursor-pointer hover:bg-blue-100";
                            if (isQrMode) statusColor = "bg-white border-slate-300 cursor-pointer hover:bg-slate-50 ring-2 ring-transparent hover:ring-slate-300";
                            
                            // Staff Call Override Style
                            if (isCalling) statusColor = "bg-red-50 animate-blink-red border-red-500 shadow-xl z-20";

                            // Get Reservation Info if Reserved
                            const reservation = table.status === TableStatus.RESERVED 
                                ? bookings.find(b => b.tableId === table.id && b.status === 'Confirmed') 
                                : null;

                            return (
                                <button
                                    key={table.id}
                                    disabled={isDisabled && !isQrMode}
                                    onClick={() => handleTableClick(table)}
                                    className={`relative p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all shadow-sm h-32 justify-center ${statusColor} ${isDisabled && !isQrMode ? 'opacity-30' : 'hover:shadow-md'}`}
                                >
                                    {isMaster && <LinkIcon size={16} className="absolute top-2 left-2 text-blue-600" />}
                                    {parentTable && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
                                            <LinkIcon size={24} className="text-gray-400" />
                                        </div>
                                    )}
                                    
                                    {!parentTable && (
                                        <span className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                            isCalling ? 'bg-red-500 text-white flex items-center gap-1 animate-pulse' :
                                            table.status === TableStatus.RESERVED ? 'bg-yellow-200 text-yellow-800' :
                                            table.status === TableStatus.OCCUPIED ? 'bg-red-200 text-red-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                            {isCalling ? <><Bell size={10} fill="currentColor"/> CALLING</> : table.status}
                                        </span>
                                    )}
                                    
                                    <span className="font-bold text-xl text-slate-800 mt-2">{table.name}</span>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Users size={12} /> {table.seats}
                                    </div>

                                    {/* Reservation Name */}
                                    {reservation && (
                                        <div className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-1 max-w-[90%] truncate">
                                            {reservation.customerName}
                                        </div>
                                    )}
                                    
                                    {/* Overlay Text for Modes */}
                                    {isMergeMode && !isDisabled && !isSelf && <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 text-green-800 font-bold rounded-xl">Merge Here</div>}
                                    {isTransferMode && !isDisabled && !isSelf && <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 text-blue-800 font-bold rounded-xl">Move Here</div>}
                                    {isQrMode && <div className="absolute bottom-2 right-2 text-slate-400"><QrCode size={16}/></div>}
                                </button>
                            );
                          })}
                       </div>
                    </div>
                  ))
              ) : (
                  /* --- TAKEOUT VIEW --- */
                  <div className="max-w-5xl mx-auto">
                      <div className="flex justify-between items-center mb-6">
                          <h2 className="text-xl font-bold text-slate-800">Active Takeout Orders</h2>
                          <button 
                            onClick={handleCreateTakeout}
                            className="bg-amber-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-amber-700 flex items-center gap-2 transition-transform active:scale-95"
                          >
                              <Plus size={20} /> New Takeout Order
                          </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {takeoutOrdersList.map((group) => (
                              <button 
                                key={group.tableId}
                                onClick={() => handleOpenTakeout(group.tableId, group.customerName)}
                                className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-amber-400 transition-all text-left flex flex-col gap-3 group relative overflow-hidden"
                              >
                                  <div className="absolute top-0 right-0 p-2 bg-amber-50 rounded-bl-xl">
                                      <ShoppingBag size={16} className="text-amber-600" />
                                  </div>
                                  <div>
                                      <h3 className="font-bold text-lg text-slate-800">{group.customerName || 'Guest'}</h3>
                                      <p className="text-xs text-gray-500 font-mono">#{group.tableId.slice(-6)}</p>
                                  </div>
                                  <div className="flex justify-between items-end border-t pt-3 mt-auto w-full">
                                      <span className="text-xs text-gray-500 flex items-center gap-1">
                                          <Clock size={12} /> {group.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                      </span>
                                      <span className="font-bold text-amber-600 text-lg">
                                          {settings.currency}{group.total.toLocaleString()}
                                      </span>
                                  </div>
                              </button>
                          ))}
                          
                          {takeoutOrdersList.length === 0 && (
                              <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-gray-400">
                                  <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
                                  <p className="text-lg font-medium">No active takeout orders</p>
                                  <p className="text-sm">Click "New Takeout Order" to start one.</p>
                              </div>
                          )}
                      </div>
                  </div>
              )}
          </div>
      </div>
  );

  const renderMenuGrid = () => (
      <div className="flex-1 flex flex-col h-full bg-slate-50">
          {/* Top Bar: Table Info & Actions */}
          <div className="bg-white p-3 border-b flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedTable(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <ArrowLeft size={20} />
                  </button>
                  <div>
                      <h2 className="font-bold text-lg flex items-center gap-2">
                          {selectedTable?.id.startsWith('takeout') ? (
                              <span className="text-amber-600 flex items-center gap-2"><ShoppingBag size={20}/> Takeout Order</span>
                          ) : (
                              <>Table {selectedTable?.name}</>
                          )}
                          {selectedTable?.mergedWith?.length ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded flex items-center gap-1"><LinkIcon size={10}/> Merged</span> : null}
                      </h2>
                      {!selectedTable?.id.startsWith('takeout') && (
                          <p className="text-xs text-gray-500">Zone {selectedTable?.zone} • {selectedTable?.seats} Seats</p>
                      )}
                  </div>
              </div>
              
              {!selectedTable?.id.startsWith('takeout') && (
                  <div className="flex gap-2">
                      {selectedTable?.mergedWith?.length ? (
                          <button onClick={handleUnmergeAll} className="px-3 py-2 text-xs font-bold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center gap-1 border border-red-200"><Unlink size={14}/> Unmerge All</button>
                      ) : null}
                      <button onClick={() => setIsTransferMode(true)} className="px-3 py-2 text-xs font-bold bg-white border text-slate-600 rounded-lg hover:bg-gray-50 flex items-center gap-1"><ArrowRightLeft size={14}/> Transfer</button>
                      <button onClick={() => setIsMergeMode(true)} className="px-3 py-2 text-xs font-bold bg-white border text-slate-600 rounded-lg hover:bg-gray-50 flex items-center gap-1"><LinkIcon size={14}/> Merge</button>
                  </div>
              )}
          </div>

          {/* Categories */}
          <div className="bg-white border-b px-4 py-2 flex gap-2 overflow-x-auto">
             <button 
                onClick={() => setActiveCategory('All')} 
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${activeCategory === 'All' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
             >
                 All
             </button>
             {categories.map(cat => (
                 <button 
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)} 
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${activeCategory === cat.id ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                 >
                     {cat.name}
                 </button>
             ))}
          </div>

          {/* Search */}
          <div className="p-4">
              <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search menu items..." 
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
             {filteredMenu.map(item => (
                 <button 
                    key={item.id} 
                    onClick={() => addToCart(item)}
                    className="bg-white border rounded-xl p-3 shadow-sm hover:shadow-md transition text-left flex flex-col h-full group"
                 >
                    <div className="h-24 w-full bg-gray-100 rounded-lg mb-3 overflow-hidden">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1">{item.name}</h4>
                    <p className="text-amber-600 font-bold text-sm mt-auto">{settings.currency}{item.price.toLocaleString()}</p>
                 </button>
             ))}
          </div>
      </div>
  );

  const renderCart = () => (
      <div className="w-96 bg-white border-l flex flex-col h-full shadow-xl z-20">
          {/* Customer Section */}
          <div className="p-4 border-b bg-gray-50">
              {selectedCustomer ? (
                  <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                              {selectedCustomer.name.charAt(0)}
                          </div>
                          <div>
                              <p className="font-bold text-sm text-slate-800">{selectedCustomer.name}</p>
                              <p className="text-xs text-gray-500">{selectedCustomer.points} pts</p>
                          </div>
                      </div>
                      <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
              ) : (
                  <div className="relative">
                      {showCustomerSearch ? (
                           <div className="absolute top-0 left-0 w-full bg-white z-20 border rounded-lg shadow-lg">
                               <input 
                                 autoFocus
                                 type="text" 
                                 placeholder="Search customer..." 
                                 className="w-full p-2 text-sm border-b focus:outline-none"
                                 value={customerSearchTerm}
                                 onChange={e => setCustomerSearchTerm(e.target.value)}
                               />
                               <div className="max-h-48 overflow-y-auto">
                                   {customers.filter(c => c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) || c.phone.includes(customerSearchTerm)).map(c => (
                                       <button key={c.id} onClick={() => handleCustomerSelect(c)} className="w-full text-left p-2 hover:bg-gray-50 text-sm flex justify-between">
                                           <span>{c.name}</span>
                                           <span className="text-gray-400">{c.phone}</span>
                                       </button>
                                   ))}
                                   <button onClick={() => { setShowCustomerSearch(false); /* Add Logic to create new */ }} className="w-full text-left p-2 text-amber-600 font-bold text-sm hover:bg-gray-50 border-t">
                                       + Create New Customer
                                   </button>
                                   <button onClick={() => setShowCustomerSearch(false)} className="w-full text-center p-2 text-gray-400 text-xs hover:bg-gray-50 border-t">Close</button>
                               </div>
                           </div>
                      ) : (
                        <button onClick={() => setShowCustomerSearch(true)} className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 text-sm hover:bg-white hover:border-amber-500 hover:text-amber-600 flex items-center justify-center gap-2 transition-all">
                            <Plus size={16} /> Assign Customer
                        </button>
                      )}
                  </div>
              )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Active Orders Section */}
              {activeOrders.length > 0 && (
                  <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider sticky top-0 bg-white py-1">Sent to Kitchen</h4>
                      {activeOrders.map(order => (
                          <div key={order.id} className="bg-gray-50 p-2 rounded border border-gray-100">
                             <div className="flex justify-between items-center mb-1">
                                 <span className="text-xs font-mono text-gray-400">#{order.id.slice(-4)}</span>
                                 <span className={`text-[10px] px-1.5 rounded uppercase font-bold ${
                                     order.status === OrderStatus.SERVED ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                 }`}>{order.status}</span>
                             </div>
                             {order.items.map((item, i) => (
                                 <div key={i} className="flex justify-between text-sm py-0.5 text-gray-600">
                                     <span>{item.quantity}x {item.name}</span>
                                     <span>{settings.currency}{(item.price * item.quantity).toLocaleString()}</span>
                                 </div>
                             ))}
                          </div>
                      ))}
                  </div>
              )}

              {/* New Items Section */}
              {cart.length > 0 && (
                  <div className="space-y-2 mt-4">
                      <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider sticky top-0 bg-white py-1 flex items-center gap-1"><ChefHat size={12}/> New Items</h4>
                      {cart.map((line, idx) => (
                          <div key={idx} className="flex flex-col border-b pb-2">
                              <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                      <p className="font-medium text-slate-800 text-sm">{line.item.name}</p>
                                      <p className="text-amber-600 text-xs font-bold">{settings.currency}{line.item.price.toLocaleString()}</p>
                                  </div>
                                  <div className="flex items-center gap-2 bg-gray-100 rounded p-1">
                                      <button onClick={() => updateCartQty(line.item.id, -1)} className="hover:text-red-500"><Minus size={14}/></button>
                                      <span className="text-sm font-bold w-4 text-center">{line.quantity}</span>
                                      <button onClick={() => updateCartQty(line.item.id, 1)} className="hover:text-green-500"><Plus size={14}/></button>
                                  </div>
                              </div>
                              <input 
                                type="text" 
                                placeholder="Note..." 
                                className="text-xs border-b border-dashed border-gray-300 focus:border-amber-500 focus:outline-none mt-1 py-1 w-full bg-transparent"
                                value={line.note || ''}
                                onChange={e => updateCartNote(line.item.id, e.target.value)}
                              />
                          </div>
                      ))}
                  </div>
              )}
              
              {cart.length === 0 && activeOrders.length === 0 && (
                  <div className="h-32 flex flex-col items-center justify-center text-gray-400">
                      <Coffee size={32} className="mb-2 opacity-50" />
                      <p className="text-sm">Order is empty</p>
                  </div>
              )}
          </div>

          {/* Footer Totals & Actions */}
          <div className="p-4 bg-white border-t shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
               <div className="mb-3">
                   <div className="flex items-center gap-2 mb-2">
                       <div className="relative flex-1">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold">
                               {discountType === 'amount' ? settings.currency : <Percent size={14} />}
                           </div>
                           <input 
                               type="number"
                               min="0"
                               placeholder="Discount"
                               className="block w-full pl-8 pr-3 py-2 border border-slate-600 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500 font-bold bg-slate-700 text-white placeholder-slate-400"
                               value={discountInput}
                               onChange={(e) => handleDiscountChange(e.target.value)}
                           />
                       </div>
                       <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
                           <button 
                               onClick={() => { setDiscountType('percent'); handleDiscountChange(discountInput, 'percent'); }}
                               className={`p-1.5 rounded-md transition-all ${discountType === 'percent' ? 'bg-white shadow text-amber-600' : 'text-gray-500'}`}
                           >
                               <Percent size={16} />
                           </button>
                           <button 
                               onClick={() => { setDiscountType('amount'); handleDiscountChange(discountInput, 'amount'); }}
                               className={`p-1.5 rounded-md transition-all ${discountType === 'amount' ? 'bg-white shadow text-green-600' : 'text-gray-500'}`}
                           >
                               <span className="font-bold text-xs">{settings.currency}</span>
                           </button>
                       </div>
                   </div>
               </div>

               <div className="space-y-1 mb-4 text-sm">
                   <div className="flex justify-between text-gray-500">
                       <span>Subtotal</span>
                       <span>{settings.currency}{subTotalBeforeDiscount.toLocaleString()}</span>
                   </div>
                   {discount > 0 && (
                        <div className="flex justify-between text-green-600 font-medium">
                            <span>Discount {discountType === 'percent' ? `(${discountInput}%)` : ''}</span>
                            <span>-{settings.currency}{discount.toLocaleString()}</span>
                        </div>
                   )}
                   <div className="flex justify-between font-bold text-lg text-slate-800 border-t pt-2 mt-2 border-dashed">
                       <span>Total</span>
                       <span>{settings.currency}{finalTotal.toLocaleString()}</span>
                   </div>
               </div>

               <div className="grid grid-cols-2 gap-2">
                   <button 
                      onClick={handleSendToKitchen}
                      disabled={cart.length === 0}
                      className="bg-amber-100 text-amber-800 py-3 rounded-xl font-bold hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition flex flex-col items-center justify-center gap-1"
                   >
                       <ChefHat size={18} />
                       <span className="text-xs">Send to Kitchen</span>
                   </button>
                   <button 
                      onClick={handleCheckout}
                      disabled={activeOrders.length === 0 && cart.length === 0}
                      className="bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex flex-col items-center justify-center gap-1"
                   >
                       <Receipt size={18} />
                       <span className="text-xs">Checkout</span>
                   </button>
               </div>
          </div>
      </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
        {/* Main Area: Table Grid OR Menu Grid */}
        <div className="flex-1 flex flex-col relative">
            {!selectedTable || isMergeMode || isTransferMode || isQrMode ? renderTableGrid() : renderMenuGrid()}
        </div>

        {/* Right Sidebar: Cart */}
        {selectedTable && !isMergeMode && !isTransferMode && !isQrMode && renderCart()}

        {/* Payment Modal */}
        {showPaymentModal && selectedTable && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Checkout</h2>
                            <p className="text-sm text-gray-500">
                                {selectedTable.id.startsWith('takeout') ? 'Takeout' : `Table ${selectedTable.name}`} • {selectedCustomer ? selectedCustomer.name : 'Walk-in'}
                            </p>
                        </div>
                        <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-200 rounded-full"><ArrowLeft size={24} /></button>
                    </div>
                    
                    <div className="flex-1 flex overflow-hidden">
                        {/* Summary */}
                        <div className="w-1/2 p-6 border-r overflow-y-auto bg-gray-50/50">
                            <h3 className="font-bold text-gray-500 text-xs uppercase mb-4">Order Summary</h3>
                            <div className="space-y-2 mb-6">
                                {existingItems.map((item, i) => (
                                    <div key={`exist-${i}`} className="flex justify-between text-sm text-gray-600">
                                        <span>{item.quantity}x {item.name}</span>
                                        <span>{settings.currency}{(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                ))}
                                {cart.map((line, i) => (
                                    <div key={`new-${i}`} className="flex justify-between text-sm text-green-700 font-medium">
                                        <span>{line.quantity}x {line.item.name} (New)</span>
                                        <span>{settings.currency}{(line.item.price * line.quantity).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="border-t pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal</span>
                                    <span>{settings.currency}{subTotalBeforeDiscount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>VAT ({settings.vatRate}%)</span>
                                    <span>Included</span> 
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600 font-medium">
                                        <span>Discount {discountType === 'percent' ? `(${discountInput}%)` : ''}</span>
                                        <span>-{settings.currency}{discount.toLocaleString()}</span>
                                    </div>
                                )}
                                {appliedCoupon && (
                                    <div className="flex justify-between text-sm text-blue-600 font-medium">
                                        <span>Coupon ({appliedCoupon.code})</span>
                                        <span>
                                            -{settings.currency}{
                                                (appliedCoupon.type === 'percent' 
                                                ? (subTotalBeforeDiscount * appliedCoupon.value / 100) 
                                                : appliedCoupon.value).toLocaleString()
                                            }
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between text-2xl font-bold text-slate-900 pt-2 border-t border-dashed">
                                    <span>Total</span>
                                    <span>{settings.currency}{finalTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Actions */}
                        <div className="w-1/2 p-6 flex flex-col">
                             <div className="grid grid-cols-3 gap-3 mb-6">
                                 <button 
                                    onClick={() => setPaymentMethod('Cash')}
                                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${paymentMethod === 'Cash' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 hover:border-gray-300'}`}
                                 >
                                     <Banknote size={24} />
                                     <span className="text-xs font-bold">Cash</span>
                                 </button>
                                 <button 
                                    onClick={() => setPaymentMethod('Card')}
                                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${paymentMethod === 'Card' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                                 >
                                     <CreditCard size={24} />
                                     <span className="text-xs font-bold">Card</span>
                                 </button>
                                 <button 
                                    onClick={() => setPaymentMethod('QR')}
                                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${paymentMethod === 'QR' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-gray-300'}`}
                                 >
                                     <QrCode size={24} />
                                     <span className="text-xs font-bold">QR</span>
                                 </button>
                             </div>

                             {paymentMethod === 'Cash' && (
                                 <div className="mb-6 flex gap-3 animate-fade-in">
                                     <div className="flex-1 space-y-3">
                                         <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Cash Received</label>
                                            <input 
                                                type="number" 
                                                className="w-full text-2xl font-bold p-3 border border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-700 text-white placeholder-slate-400"
                                                value={cashReceived}
                                                onChange={e => setCashReceived(e.target.value)}
                                                placeholder="0.00"
                                                autoFocus
                                            />
                                         </div>
                                         <div className="grid grid-cols-2 gap-2">
                                             {getCashSuggestions(finalTotal).map(amount => (
                                                 <button
                                                    key={amount}
                                                    onClick={() => setCashReceived(amount.toString())}
                                                    className="py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-bold text-xs"
                                                 >
                                                     {settings.currency}{amount.toLocaleString()}
                                                 </button>
                                             ))}
                                         </div>
                                         <div className="bg-gray-50 p-2 rounded-lg border border-dashed border-gray-200 flex justify-between items-center text-sm">
                                             <span className="text-gray-500">Change:</span>
                                             <span className={`font-bold text-lg ${Number(cashReceived) >= finalTotal ? 'text-green-600' : 'text-red-400'}`}>
                                                 {settings.currency}{Math.max(0, Number(cashReceived) - finalTotal).toLocaleString()}
                                             </span>
                                         </div>
                                     </div>
                                     <div className="w-24 grid grid-cols-2 gap-1 content-start">
                                         {[1,2,3,4,5,6,7,8,9, '.', 0].map(n => (
                                             <button 
                                                key={n}
                                                onClick={() => handleNumPad(n)}
                                                className="h-10 bg-white border border-gray-200 rounded hover:bg-gray-50 font-bold text-sm"
                                             >
                                                 {n}
                                             </button>
                                         ))}
                                         <button 
                                            onClick={() => handleNumPad('BS')}
                                            className="h-10 bg-red-50 border border-red-100 text-red-500 rounded hover:bg-red-100 flex items-center justify-center"
                                         >
                                             <Delete size={16} />
                                         </button>
                                     </div>
                                 </div>
                             )}

                             {paymentMethod === 'QR' && (
                                 <div className="mb-6 flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-dashed">
                                     {settings.paymentQrImage ? (
                                         <img src={settings.paymentQrImage} alt="Payment QR" className="w-40 h-40 object-contain" />
                                     ) : (
                                         <div className="w-40 h-40 bg-gray-200 rounded flex items-center justify-center text-gray-400"><QrCode size={40}/></div>
                                     )}
                                     <p className="text-sm font-bold mt-2">Scan to Pay</p>
                                 </div>
                             )}

                             {/* Discounts & Coupons */}
                             <div className="mb-6 space-y-2">
                                 <div className="relative flex gap-2">
                                     <input 
                                        type="text" 
                                        placeholder="Enter Coupon Code"
                                        className="flex-1 border border-slate-600 rounded-lg px-3 py-2 text-sm uppercase font-bold bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                                        value={couponInput}
                                        onChange={(e) => setCouponInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if(e.key === 'Enter') handleApplyCoupon();
                                        }}
                                     />
                                     <button onClick={handleApplyCoupon} className="bg-gray-200 px-3 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-300">Apply</button>
                                     
                                     <button 
                                        onClick={() => setShowCouponList(!showCouponList)} 
                                        className={`px-3 py-2 rounded-lg text-sm font-bold border transition-colors ${showCouponList ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                        title="Select Coupon"
                                     >
                                        <TicketPercent size={18} />
                                     </button>

                                     {showCouponList && (
                                         <div className="absolute bottom-full right-0 w-full mb-2 bg-white border rounded-xl shadow-xl z-30 max-h-64 overflow-y-auto animate-fade-in p-2">
                                             <div className="flex justify-between items-center px-2 mb-2">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Available Coupons</h4>
                                                <button onClick={() => setShowCouponList(false)} className="text-gray-400 hover:text-gray-600"><X size={14}/></button>
                                             </div>
                                             
                                             {coupons.filter(c => c.isActive).length === 0 ? (
                                                 <div className="text-center p-4 text-gray-400 text-sm">No active coupons available</div>
                                             ) : (
                                                 <div className="space-y-1">
                                                     {coupons.filter(c => c.isActive).map(coupon => (
                                                         <button
                                                             key={coupon.id}
                                                             onClick={() => {
                                                                 setAppliedCoupon(coupon);
                                                                 setCouponInput(coupon.code);
                                                                 setShowCouponList(false);
                                                                 addNotification('success', `Coupon ${coupon.code} applied!`);
                                                             }}
                                                             className="w-full text-left p-3 hover:bg-amber-50 rounded-lg border border-transparent hover:border-amber-100 flex justify-between items-center transition-all group"
                                                         >
                                                             <div>
                                                                 <div className="flex items-center gap-2">
                                                                     <span className="font-bold text-slate-800 text-sm">{coupon.code}</span>
                                                                     {coupon.pointCost > 0 && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded font-bold">Reward</span>}
                                                                 </div>
                                                                 <p className="text-xs text-gray-500 line-clamp-1">{coupon.description || 'No description'}</p>
                                                             </div>
                                                             <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded whitespace-nowrap">
                                                                 -{coupon.type === 'percent' ? `${coupon.value}%` : `${settings.currency}${coupon.value}`}
                                                             </span>
                                                         </button>
                                                     ))}
                                                 </div>
                                             )}
                                         </div>
                                     )}
                                 </div>
                                 <div className="flex gap-2">
                                     {[5, 10, 20].map(pct => (
                                         <button 
                                            key={pct}
                                            onClick={() => setDiscount(subTotalBeforeDiscount * pct / 100)}
                                            className="flex-1 bg-gray-100 hover:bg-gray-200 py-1.5 rounded text-xs font-medium text-gray-700"
                                         >
                                             {pct}% Off
                                         </button>
                                     ))}
                                     <button 
                                        onClick={() => {
                                            setDiscount(0); 
                                            setAppliedCoupon(null); 
                                            setCouponInput('');
                                        }} 
                                        className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-1.5 rounded text-xs font-medium"
                                     >
                                        Reset
                                     </button>
                                 </div>
                             </div>

                             <button 
                                onClick={handleFinalizePayment}
                                disabled={paymentMethod === 'Cash' && Number(cashReceived) < finalTotal}
                                className="mt-auto w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                             >
                                 <CheckCircle size={24} /> Confirm Payment
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* QR Code Modal */}
        {qrTable && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
                <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-lg text-slate-800">Table {qrTable.name} QR</h3>
                        <button onClick={() => setQrTable(null)} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-8 flex flex-col items-center justify-center text-center space-y-6 bg-white">
                        <div className="bg-white p-2 border-4 border-slate-900 rounded-xl shadow-lg">
                            <img 
                                src={getQrUrl(qrTable.id)} 
                                alt={`QR for ${qrTable.name}`}
                                className="w-48 h-48"
                            />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-xl">Scan to Order</p>
                            <p className="text-sm text-gray-500 mt-1">Zone {qrTable.zone} • {qrTable.seats} Seats</p>
                        </div>
                        
                        <a 
                            href={getQrUrl(qrTable.id, 500)}
                            download={`Table-${qrTable.name}-QR.png`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-slate-800 transition w-full justify-center shadow-lg"
                        >
                            <Download size={18} /> Download High Res
                        </a>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default POS;
