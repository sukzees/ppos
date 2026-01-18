
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { MenuItem, Order, OrderStatus, Customer } from '../../types';
import { ShoppingBag, X, Plus, Minus, ChefHat, CheckCircle2, ArrowLeft, MessageSquare, User, LogIn, Phone, Bell } from 'lucide-react';

const SelfOrder: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const { menu, categories, tables, addOrder, settings, customers, addCustomer, toggleTableCall } = useStore();
  
  // State
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [cart, setCart] = useState<{ item: MenuItem; qty: number; note?: string }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState(''); // Fallback for guest name input in cart
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Login State
  const [loggedInCustomer, setLoggedInCustomer] = useState<Customer | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginStep, setLoginStep] = useState<'phone' | 'register'>('phone');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginName, setLoginName] = useState('');

  const currentTable = tables.find(t => t.id === tableId);

  // Filter Menu
  const filteredMenu = menu.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.categoryId === activeCategory;
    return matchesCategory && item.isAvailable;
  });

  // Cart Logic
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.item.id === item.id);
      if (existing) {
        return prev.map(i => i.item.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const updateQty = (itemId: string, delta: number) => {
    setCart(prev => prev.reduce((acc, curr) => {
      if (curr.item.id === itemId) {
        const newQty = curr.qty + delta;
        if (newQty > 0) acc.push({ ...curr, qty: newQty });
      } else {
        acc.push(curr);
      }
      return acc;
    }, [] as typeof cart));
  };

  const updateNote = (itemId: string, note: string) => {
    setCart(prev => prev.map(i => i.item.id === itemId ? { ...i, note } : i));
  };

  const cartTotal = cart.reduce((acc, curr) => acc + (curr.item.price * curr.qty), 0);
  const cartCount = cart.reduce((acc, curr) => acc + curr.qty, 0);

  const handlePlaceOrder = () => {
    if (!tableId || cart.length === 0) return;

    // Use logged in name, or manual name, or Guest
    const finalName = loggedInCustomer ? loggedInCustomer.name : (customerName || 'Guest (Self-Order)');

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      tableId: tableId,
      items: cart.map(c => ({
        menuId: c.item.id,
        name: c.item.name,
        quantity: c.qty,
        price: c.item.price,
        note: c.note
      })),
      status: OrderStatus.PENDING, // Sends to Kitchen
      total: cartTotal,
      timestamp: new Date(),
      customerName: finalName,
      customerId: loggedInCustomer?.id, // Attach ID so POS can auto-assign
      paymentMethod: undefined // Payment happens at POS later
    };

    addOrder(newOrder);
    setOrderPlaced(true);
    setCart([]);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (loginStep === 'phone') {
          const existing = customers.find(c => c.phone === loginPhone);
          if (existing) {
              setLoggedInCustomer(existing);
              setIsLoginModalOpen(false);
          } else {
              setLoginStep('register');
          }
      } else {
          // Register
          const newCustomer: Customer = {
              id: `c-${Date.now()}`,
              name: loginName,
              phone: loginPhone,
              points: 0,
              tier: 'Bronze',
              visitCount: 1,
              joinDate: new Date()
          };
          addCustomer(newCustomer);
          setLoggedInCustomer(newCustomer);
          setIsLoginModalOpen(false);
      }
  };

  const handleCallStaff = () => {
      if (currentTable && tableId) {
          if (!currentTable.isCallingStaff) {
              toggleTableCall(tableId, true);
          } else {
              // Optional: Let user cancel? Or just say notified. 
              // Usually once called, only staff cancels. 
              // But for UX feedback, we can show status.
          }
      }
  };

  // ---------------- Render Views ----------------

  // 1. Success View
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Order Received!</h1>
        <p className="text-slate-600 mb-8">
          The kitchen has received your order for <span className="font-bold">Table {currentTable?.name || tableId}</span>.
          <br />Please sit back and relax.
        </p>
        <button 
          onClick={() => { setOrderPlaced(false); setIsCartOpen(false); }}
          className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg"
        >
          Order More Items
        </button>
      </div>
    );
  }

  // 2. Invalid Table View
  if (!currentTable && tableId !== 'takeout') {
     // For mock purposes we allow 'takeout' or valid IDs. In real app, strict check.
     if (!tableId) return <div className="p-10 text-center">Invalid Table URL</div>;
  }

  // 3. Main Menu View
  return (
    <div className="bg-gray-50 min-h-screen pb-24 relative">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 shadow-sm px-4 py-3 flex justify-between items-center">
        <div>
          <h1 className="font-bold text-lg text-slate-800">SiamSavory</h1>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Table {currentTable?.name || 'Self-Service'}
          </p>
        </div>
        <div className="flex gap-2">
            {/* Call Staff Button */}
            {currentTable && (
                <button 
                    onClick={handleCallStaff}
                    disabled={currentTable.isCallingStaff}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        currentTable.isCallingStaff 
                        ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    <Bell size={14} fill={currentTable.isCallingStaff ? "currentColor" : "none"} /> 
                    {currentTable.isCallingStaff ? 'Staff Notified' : 'Call Staff'}
                </button>
            )}

            {loggedInCustomer ? (
                <button 
                    onClick={() => { setLoginPhone(loggedInCustomer.phone); setLoginStep('phone'); setIsLoginModalOpen(true); }}
                    className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold border border-amber-200"
                >
                    <User size={14} /> {loggedInCustomer.name.split(' ')[0]}
                </button>
            ) : (
                <button 
                    onClick={() => { setLoginStep('phone'); setLoginPhone(''); setIsLoginModalOpen(true); }}
                    className="flex items-center gap-2 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-xs font-bold"
                >
                    <LogIn size={14} /> Login
                </button>
            )}
            
            {cartCount > 0 && (
                <button 
                    onClick={() => setIsCartOpen(true)}
                    className="bg-slate-900 text-white p-2 rounded-full relative"
                >
                    <ShoppingBag size={20} />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                        {cartCount}
                    </span>
                </button>
            )}
        </div>
      </div>

      {/* Categories */}
      <div className="sticky top-[60px] z-10 bg-gray-50/95 backdrop-blur py-2 px-4 border-b overflow-x-auto flex gap-2 no-scrollbar">
        <button
            onClick={() => setActiveCategory('All')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === 'All' ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'
            }`}
        >
            All Items
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.id ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredMenu.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-row h-28">
            <img src={item.image} alt={item.name} className="w-28 h-full object-cover bg-gray-200" />
            <div className="flex-1 p-3 flex flex-col justify-between">
                <div>
                    <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{item.name}</h3>
                    <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5">{item.description}</p>
                </div>
                <div className="flex justify-between items-end">
                    <span className="font-bold text-amber-600">{settings.currency}{item.price.toLocaleString()}</span>
                    <button 
                        onClick={() => addToCart(item)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 p-2 rounded-lg transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Floating Bar */}
      {cartCount > 0 && !isCartOpen && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
            <button 
                onClick={() => setIsCartOpen(true)}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex justify-between items-center px-6 shadow-lg hover:scale-[1.01] transition-transform"
            >
                <div className="flex items-center gap-2">
                    <div className="bg-white text-slate-900 w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold">{cartCount}</div>
                    <span>View Cart</span>
                </div>
                <span>{settings.currency}{cartTotal.toLocaleString()}</span>
            </button>
        </div>
      )}

      {/* Login Modal */}
      {isLoginModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
              <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
                  <div className="p-6">
                      <div className="flex justify-between items-center mb-6">
                          <h2 className="text-xl font-bold text-slate-800">
                              {loginStep === 'phone' ? 'Member Login' : 'Register Member'}
                          </h2>
                          <button onClick={() => setIsLoginModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                              <X size={24} />
                          </button>
                      </div>
                      
                      <form onSubmit={handleLoginSubmit} className="space-y-4">
                          {loginStep === 'phone' ? (
                              <>
                                <p className="text-sm text-gray-500 mb-2">Enter your phone number to collect points and track orders.</p>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">PHONE NUMBER</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                                        <input 
                                            type="tel" 
                                            autoFocus
                                            className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-lg font-medium"
                                            placeholder="081-xxx-xxxx"
                                            value={loginPhone}
                                            onChange={(e) => setLoginPhone(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800">
                                    Next
                                </button>
                              </>
                          ) : (
                              <>
                                <p className="text-sm text-gray-500 mb-2">It looks like you're new here! Please enter your name.</p>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">YOUR NAME</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                        <input 
                                            type="text" 
                                            autoFocus
                                            className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-lg font-medium"
                                            placeholder="John Doe"
                                            value={loginName}
                                            onChange={(e) => setLoginName(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setLoginStep('phone')} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">Back</button>
                                    <button type="submit" className="flex-1 bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700">Register</button>
                                </div>
                              </>
                          )}
                      </form>
                  </div>
              </div>
          </div>
      )}

      {/* Cart Modal / Sheet */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 animate-slide-in">
            {/* Cart Header */}
            <div className="bg-white p-4 shadow-sm flex items-center justify-between shrink-0">
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={24} className="text-slate-600" />
                </button>
                <h2 className="font-bold text-lg text-slate-800">Your Order</h2>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                        <ShoppingBag size={64} className="mb-4" />
                        <p>Your cart is empty</p>
                    </div>
                ) : (
                    cart.map((line, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800">{line.item.name}</h4>
                                    <p className="text-amber-600 text-sm font-semibold">{settings.currency}{(line.item.price * line.qty).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                                    <button onClick={() => updateQty(line.item.id, -1)} className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-slate-600"><Minus size={14} /></button>
                                    <span className="text-sm font-bold w-4 text-center">{line.qty}</span>
                                    <button onClick={() => updateQty(line.item.id, 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-slate-600"><Plus size={14} /></button>
                                </div>
                            </div>
                            <div className="relative">
                                <MessageSquare size={14} className="absolute top-2.5 left-2 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Add special instructions..." 
                                    className="w-full bg-gray-50 border-0 rounded-lg py-2 pl-8 pr-3 text-xs text-gray-700 placeholder-gray-400 focus:ring-1 focus:ring-amber-500"
                                    value={line.note || ''}
                                    onChange={(e) => updateNote(line.item.id, e.target.value)}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
                <div className="bg-white border-t p-4 shrink-0 space-y-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                    {!loggedInCustomer && (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Your Name (Optional)</label>
                            <input 
                                type="text" 
                                placeholder="e.g. John" 
                                className="w-full border-gray-300 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                            />
                        </div>
                    )}
                    {loggedInCustomer && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-bold">
                                {loggedInCustomer.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-xs text-amber-700 font-bold">Ordering as Member</p>
                                <p className="text-sm font-bold text-slate-800">{loggedInCustomer.name}</p>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex justify-between items-center text-sm font-medium text-gray-600">
                        <span>Total Items</span>
                        <span>{cartCount}</span>
                    </div>
                    <div className="flex justify-between items-center text-xl font-bold text-slate-800">
                        <span>Total</span>
                        <span>{settings.currency}{cartTotal.toLocaleString()}</span>
                    </div>

                    <button 
                        onClick={handlePlaceOrder}
                        className="w-full bg-amber-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-amber-700 flex items-center justify-center gap-2"
                    >
                        <ChefHat size={24} /> Send to Kitchen
                    </button>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default SelfOrder;
