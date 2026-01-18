
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus, OrderItem } from '../../types';
import { Clock, CheckCircle, Flame, XCircle, ShoppingBag, Trash2, ChevronDown, ChevronUp, MessageSquare, AlertCircle, Archive, LayoutDashboard, Search, Ban, CheckCircle2, AlertTriangle, ChefHat, Wine, Check } from 'lucide-react';

// Helper to get status color
const getStatusColor = (status: OrderStatus) => {
  switch(status) {
    case OrderStatus.PENDING: return 'bg-orange-100 border-orange-300 text-orange-800';
    case OrderStatus.COOKING: return 'bg-blue-100 border-blue-300 text-blue-800';
    case OrderStatus.SERVED: return 'bg-green-100 border-green-300 text-green-800';
    case OrderStatus.CANCELLED: return 'bg-red-100 border-red-300 text-red-800';
    case OrderStatus.COMPLETED: return 'bg-slate-100 border-slate-300 text-slate-800';
    default: return 'bg-gray-100 border-gray-300';
  }
};

const VOID_REASONS = [
  "Customer Changed Mind",
  "Wrong Item Entered",
  "Payment Failed",
  "Kitchen Out of Stock",
  "Customer Complaint",
  "Other"
];

interface OrderCardProps {
  order: Order;
  currency: string;
  onUpdateStationStatus: (id: string, station: 'kitchen' | 'bar', status: OrderStatus) => void;
  onUpdateItemStatus: (id: string, itemIndex: number, status: OrderStatus) => void;
  onRequestVoid: (order: Order) => void;
  onUpdateDiscount: (id: string, discount: number) => void;
  onRemoveItem: (order: Order, idx: number) => void;
  kitchenItems?: { item: OrderItem, originalIndex: number }[];
}

const OrderCard: React.FC<OrderCardProps> = ({ order, currency, onUpdateStationStatus, onUpdateItemStatus, onRequestVoid, onUpdateDiscount, onRemoveItem, kitchenItems }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Status to display for this card (specific to kitchen)
  const displayStatus = order.kitchenStatus || OrderStatus.PENDING;

  // Determine items to display: Use filtered kitchenItems if provided, otherwise default to all
  const itemsDisplay = kitchenItems || order.items.map((item, index) => ({ item, originalIndex: index }));

  const handleVoid = (e: React.MouseEvent) => {
      e.stopPropagation();
      onRequestVoid(order);
  };

  const handleServe = (e: React.MouseEvent) => {
      e.stopPropagation();
      // Direct update for Kitchen Status (Bulk)
      onUpdateStationStatus(order.id, 'kitchen', OrderStatus.SERVED);
  };

  const handleCook = (e: React.MouseEvent) => {
      e.stopPropagation();
      onUpdateStationStatus(order.id, 'kitchen', OrderStatus.COOKING);
  };

  return (
    <div className={`p-4 rounded-xl border-l-4 shadow-sm bg-white mb-4 ${getStatusColor(displayStatus).replace('text-', 'border-')} transition-all`}>
      <div 
        className="flex justify-between items-start cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <div className="flex justify-between items-center pr-2">
            <div>
                {order.tableId === 'takeout' ? (
                <h4 className="font-bold text-lg flex items-center gap-2 text-amber-700">
                    <ShoppingBag size={18} /> Takeout
                </h4>
                ) : (
                <h4 className="font-bold text-lg">Table {order.tableId.replace('t', '')}</h4>
                )}
            </div>
             <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getStatusColor(displayStatus)}`}>
                {displayStatus}
            </span>
          </div>
          
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span>#{order.id.split('-')[1] || order.id.slice(-4)}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {order.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>

          {order.customerName && (
             <p className="text-sm font-semibold text-blue-600 mt-1">Cust: {order.customerName}</p>
          )}
          
          {!isExpanded && (
             <p className="text-xs text-gray-400 mt-2 italic flex items-center gap-1">
                {itemsDisplay.length} items 
                {itemsDisplay.some(({ item }) => item.note) && <span className="text-amber-600 font-bold flex items-center gap-0.5"><MessageSquare size={10} /> Has Notes</span>}
                <span className="opacity-70">(Click to expand)</span>
             </p>
          )}
        </div>
        <div className="text-gray-400 p-1 hover:bg-gray-100 rounded-full transition-colors">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-dashed animate-fade-in">
            {order.voidReason && (
                <div className="mb-4 bg-red-50 p-2 rounded border border-red-100 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle size={14} />
                    <span className="font-bold">Void Reason:</span> {order.voidReason}
                </div>
            )}

            <div className="space-y-4 mb-4">
            {itemsDisplay.map(({ item, originalIndex }) => (
                <div key={originalIndex} className="flex flex-col gap-1 text-sm group">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 flex-1">
                            {/* Item Status Indicator/Control */}
                            {item.status === OrderStatus.SERVED ? (
                                <div className="p-1 rounded-full bg-green-100 text-green-600">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                            ) : (
                                <div className="flex gap-1">
                                    {item.status === OrderStatus.PENDING && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onUpdateItemStatus(order.id, originalIndex, OrderStatus.COOKING);
                                            }}
                                            className="p-1.5 rounded-full border border-blue-200 text-blue-500 hover:bg-blue-50 transition-colors"
                                            title="Start Cooking"
                                        >
                                            <Flame size={14} />
                                        </button>
                                    )}
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onUpdateItemStatus(order.id, originalIndex, OrderStatus.SERVED);
                                        }}
                                        className="p-1.5 rounded-full border border-gray-300 text-gray-400 hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-colors"
                                        title="Mark Served"
                                    >
                                        <Check size={14} />
                                    </button>
                                </div>
                            )}

                            <span className={`font-bold text-base ${item.status === OrderStatus.SERVED ? 'text-green-700' : 'text-slate-800'}`}>{item.quantity}x</span>
                            <span className={`font-medium ${item.status === OrderStatus.SERVED ? 'text-green-700' : 'text-slate-700'}`}>{item.name}</span>
                        </div>
                        {[OrderStatus.PENDING, OrderStatus.COOKING, OrderStatus.SERVED].includes(displayStatus) && (
                            <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemoveItem(order, originalIndex);
                            }}
                            className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                            title="Remove Item"
                            >
                            <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                    {item.note && (
                        <div className="col-span-full mt-1 ml-8 bg-amber-50 p-1.5 rounded border border-amber-100 flex gap-2 items-start text-xs text-amber-800 animate-fade-in shadow-sm">
                            <MessageSquare size={12} className="mt-0.5 shrink-0" />
                            <span className="font-medium italic">"{item.note}"</span>
                        </div>
                    )}
                </div>
            ))}
            {itemsDisplay.length === 0 && (
                <p className="text-xs text-red-400 italic text-center py-2">No kitchen items</p>
            )}
            </div>

            <div className="flex gap-2 pt-2 border-t">
            {displayStatus === OrderStatus.PENDING && (
                <button 
                onClick={handleCook}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1 shadow-sm"
                >
                <Flame size={16} /> Cook All
                </button>
            )}
            {displayStatus === OrderStatus.COOKING && (
                <button 
                onClick={handleServe}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1 shadow-sm"
                >
                <CheckCircle size={16} /> Serve All
                </button>
            )}
            
            {[OrderStatus.PENDING, OrderStatus.COOKING, OrderStatus.SERVED].includes(displayStatus) && (
                <button 
                onClick={handleVoid}
                className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
                title="Void Order"
                >
                <Ban size={16} /> Void
                </button>
            )}
            </div>
        </div>
      )}
    </div>
  );
};

const OrderManager: React.FC = () => {
  const navigate = useNavigate();
  const { orders, menu, categories, updateOrderStationStatus, updateOrderItemStatus, voidOrder, updateOrderDiscount, removeOrderItem, settings } = useStore();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [searchTerm, setSearchTerm] = useState('');

  // Void Modal State
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [selectedOrderToVoid, setSelectedOrderToVoid] = useState<Order | null>(null);
  const [selectedReason, setSelectedReason] = useState(VOID_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  // Remove Item Modal State
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<{order: Order, itemIndex: number, itemName: string} | null>(null);

  // Helper to filter items for Kitchen
  const getKitchenItems = (order: Order) => {
      return order.items
        .map((item, index) => ({ item, originalIndex: index }))
        .filter(({ item }) => {
            const menuItem = menu.find(m => m.id === item.menuId);
            if (!menuItem) return true; // If unknown, keep it in kitchen (safe fallback)
            
            // 1. Check Item Level Override
            if (menuItem.station) {
                return menuItem.station === 'kitchen';
            }

            // 2. Check mapping (default to kitchen if undefined)
            const station = settings.categoryMapping?.[menuItem.categoryId];
            return station !== 'bar';
        });
  };

  const handleOpenVoidModal = (order: Order) => {
      setSelectedOrderToVoid(order);
      setSelectedReason(VOID_REASONS[0]);
      setCustomReason('');
      setShowVoidModal(true);
  };

  const handleRequestRemoveItem = (order: Order, itemIndex: number) => {
      setItemToRemove({ order, itemIndex, itemName: order.items[itemIndex].name });
      setShowRemoveModal(true);
  };

  const confirmRemoveItem = () => {
      if (itemToRemove) {
          removeOrderItem(itemToRemove.order.id, itemToRemove.itemIndex);
          setShowRemoveModal(false);
          setItemToRemove(null);
      }
  };

  const confirmVoid = () => {
      if (!selectedOrderToVoid) return;
      const finalReason = selectedReason === 'Other' ? customReason : selectedReason;
      if (!finalReason) {
          alert("Please enter a reason");
          return;
      }
      voidOrder(selectedOrderToVoid.id, finalReason);
      setShowVoidModal(false);
      setSelectedOrderToVoid(null);
  };

  // Only show orders that have kitchen items and are not complete/cancelled
  // Sorted Oldest First (FIFO)
  const activeOrders = orders.filter(o => 
      o.kitchenStatus && 
      [OrderStatus.PENDING, OrderStatus.COOKING, OrderStatus.SERVED].includes(o.kitchenStatus)
  ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const historyOrders = orders.filter(o => 
    ([OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(o.status)) &&
    (searchTerm === '' || 
     o.id.includes(searchTerm) || 
     o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     (o.tableId && o.tableId.toLowerCase().includes(searchTerm.toLowerCase())))
  ).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Kitchen Display System</h1>
          <p className="text-slate-500">Manage real-time orders and view history.</p>
        </div>
        <div className="flex gap-4 items-center">
            {/* Station Switcher (Split Button) */}
            <div className="bg-gray-100 p-1 rounded-lg flex shadow-sm border border-gray-200">
               <button 
                 className="px-4 py-2 rounded-md text-sm font-bold bg-white text-orange-600 shadow-sm flex items-center gap-2"
               >
                 <ChefHat size={16} /> Kitchen
               </button>
               <button 
                 onClick={() => navigate('/admin/bar')}
                 className="px-4 py-2 rounded-md text-sm font-bold text-gray-500 hover:text-purple-600 hover:bg-gray-200 transition-colors flex items-center gap-2"
               >
                 <Wine size={16} /> Bar
               </button>
            </div>

            <div className="text-xl font-bold text-slate-700 font-mono bg-white px-4 py-2 rounded-lg shadow-sm border">
               {new Date().toLocaleTimeString()}
            </div>
        </div>
      </div>

      <div className="flex gap-4 mb-4 border-b">
        <button 
          onClick={() => setActiveTab('active')}
          className={`pb-3 px-4 font-medium flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'active' ? 'text-amber-600 border-amber-600' : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <LayoutDashboard size={18} /> Active Orders
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 font-medium flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'history' ? 'text-amber-600 border-amber-600' : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <Archive size={18} /> Order History
        </button>
      </div>

      {activeTab === 'active' ? (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
            {/* Pending Column (Orange) */}
            <div className="bg-orange-50 rounded-xl p-4 flex flex-col h-full border border-orange-100">
            <h2 className="font-bold text-orange-600 mb-4 flex items-center gap-2 sticky top-0 bg-orange-50 py-2 z-10 border-b border-orange-200 pb-2">
                <Clock size={20} /> PENDING
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-orange-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-orange-300">
                {activeOrders.filter(o => o.kitchenStatus === OrderStatus.PENDING).map(order => {
                    const kitchenItems = getKitchenItems(order);
                    if (kitchenItems.length === 0) return null;
                    return <OrderCard key={order.id} order={order} kitchenItems={kitchenItems} currency={settings.currency} onUpdateStationStatus={updateOrderStationStatus} onUpdateItemStatus={updateOrderItemStatus} onRequestVoid={handleOpenVoidModal} onUpdateDiscount={updateOrderDiscount} onRemoveItem={handleRequestRemoveItem} />;
                })}
            </div>
            </div>

            {/* Cooking Column (Blue) */}
            <div className="bg-blue-50/50 rounded-xl p-4 flex flex-col h-full border border-blue-100">
            <h2 className="font-bold text-blue-600 mb-4 flex items-center gap-2 sticky top-0 bg-blue-50/50 py-2 z-10 border-b border-blue-200 pb-2">
                <Flame size={20} /> COOKING
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-blue-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-blue-300">
                {activeOrders.filter(o => o.kitchenStatus === OrderStatus.COOKING).map(order => {
                    const kitchenItems = getKitchenItems(order);
                    if (kitchenItems.length === 0) return null;
                    return <OrderCard key={order.id} order={order} kitchenItems={kitchenItems} currency={settings.currency} onUpdateStationStatus={updateOrderStationStatus} onUpdateItemStatus={updateOrderItemStatus} onRequestVoid={handleOpenVoidModal} onUpdateDiscount={updateOrderDiscount} onRemoveItem={handleRequestRemoveItem} />;
                })}
            </div>
            </div>

            {/* Served Column (Green) */}
            <div className="bg-green-50/50 rounded-xl p-4 flex flex-col h-full border border-green-100">
            <h2 className="font-bold text-green-600 mb-4 flex items-center gap-2 sticky top-0 bg-green-50/50 py-2 z-10 border-b border-green-200 pb-2">
                <CheckCircle size={20} /> SERVED
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-green-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-green-300">
                {activeOrders.filter(o => o.kitchenStatus === OrderStatus.SERVED).map(order => {
                    const kitchenItems = getKitchenItems(order);
                    if (kitchenItems.length === 0) return null;
                    return <OrderCard key={order.id} order={order} kitchenItems={kitchenItems} currency={settings.currency} onUpdateStationStatus={updateOrderStationStatus} onUpdateItemStatus={updateOrderItemStatus} onRequestVoid={handleOpenVoidModal} onUpdateDiscount={updateOrderDiscount} onRemoveItem={handleRequestRemoveItem} />;
                })}
            </div>
            </div>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-2 text-gray-500">
                    <Archive size={20} />
                    <span className="font-bold">Past Orders</span>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search ID, Customer, Table..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 w-64 bg-slate-700 text-white placeholder-slate-400"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b sticky top-0 z-10">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Order ID</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Time</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Table / Customer</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Items</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm text-right">Total</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm text-center">Status</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Note</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {historyOrders.map(order => (
                            <tr key={order.id} className="hover:bg-gray-50">
                                <td className="p-4 font-mono text-xs text-gray-500">{order.id}</td>
                                <td className="p-4 text-sm text-gray-600">
                                    {order.timestamp.toLocaleDateString()} {order.timestamp.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                </td>
                                <td className="p-4 text-sm font-medium">
                                    {order.tableId === 'takeout' ? 'Takeout' : `Table ${order.tableId.replace('t', '')}`}
                                    {order.customerName && <div className="text-xs text-blue-600 font-normal">{order.customerName}</div>}
                                </td>
                                <td className="p-4 text-sm text-gray-600">
                                    <div className="max-w-xs truncate" title={order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}>
                                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-right font-bold text-slate-700">
                                    {settings.currency}{(order.total - (order.discount || 0)).toLocaleString()}
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold uppercase ${
                                        order.status === OrderStatus.COMPLETED 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-red-100 text-red-700'
                                    }`}>
                                        {order.status === OrderStatus.COMPLETED ? <CheckCircle2 size={12}/> : <Ban size={12}/>}
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-red-500 italic">
                                    {order.voidReason || '-'}
                                </td>
                            </tr>
                        ))}
                        {historyOrders.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-10 text-center text-gray-400">
                                    No history found matching your criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* Remove Item Confirmation Modal */}
      {showRemoveModal && itemToRemove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="p-6">
                    <div className="flex flex-col items-center text-center mb-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-3">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Remove Item?</h3>
                        <p className="text-gray-600 mt-1">
                            Are you sure you want to remove <strong className="text-slate-800">{itemToRemove.itemName}</strong>?
                        </p>
                    </div>

                    {itemToRemove.order.status === OrderStatus.SERVED && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 text-left mb-4">
                            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                            <div className="text-sm text-amber-800">
                                <p className="font-bold">Inventory Warning</p>
                                <p>This order is already <strong>SERVED</strong>. Removing this item will automatically <strong>RESTORE</strong> the inventory count.</p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowRemoveModal(false)}
                            className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={confirmRemoveItem}
                            className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg"
                        >
                            Confirm Remove
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Void Modal */}
      {showVoidModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <AlertCircle className="text-red-500" /> Void Order #{selectedOrderToVoid?.id.slice(-4)}
                </h3>
                <button onClick={() => setShowVoidModal(false)} className="text-gray-400 hover:text-gray-600"><XCircle size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">Please select a reason for voiding this order. This action cannot be undone.</p>
                
                <div className="grid grid-cols-2 gap-3">
                    {VOID_REASONS.map(reason => (
                        <button
                        key={reason}
                        onClick={() => setSelectedReason(reason)}
                        className={`p-3 rounded-lg text-sm font-medium border text-left transition-all ${
                            selectedReason === reason 
                            ? 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        >
                        {reason}
                        </button>
                    ))}
                </div>
                
                {selectedReason === 'Other' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Specific Reason</label>
                        <textarea 
                        className="w-full border border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none bg-slate-700 text-white placeholder-slate-400"
                        rows={3}
                        placeholder="Enter details..."
                        value={customReason}
                        onChange={e => setCustomReason(e.target.value)}
                        autoFocus
                        />
                    </div>
                )}
            </div>
            <div className="p-6 border-t bg-gray-50 flex gap-3">
                <button onClick={() => setShowVoidModal(false)} className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-white transition">Cancel</button>
                <button onClick={confirmVoid} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg transition transform active:scale-95">Confirm Void</button>
            </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default OrderManager;
