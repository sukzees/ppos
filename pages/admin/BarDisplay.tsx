
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus, OrderItem } from '../../types';
import { Clock, CheckCircle, ShoppingBag, ChevronDown, ChevronUp, MessageSquare, Wine, Ban, AlertCircle, XCircle, ChefHat, Check } from 'lucide-react';

// Helper to get status color - using Purple theme for Bar
const getStatusColor = (status: OrderStatus) => {
  switch(status) {
    case OrderStatus.PENDING: return 'bg-orange-100 border-orange-300 text-orange-800';
    case OrderStatus.COOKING: return 'bg-purple-100 border-purple-300 text-purple-800'; // Preparing
    case OrderStatus.SERVED: return 'bg-green-100 border-green-300 text-green-800';
    default: return 'bg-gray-100 border-gray-300';
  }
};

const VOID_REASONS = [
  "Customer Changed Mind",
  "Wrong Item Entered",
  "Payment Failed",
  "Bar Out of Stock",
  "Customer Complaint",
  "Other"
];

interface BarOrderCardProps {
  order: Order;
  barItems: { item: OrderItem, originalIndex: number }[];
  onUpdateStationStatus: (id: string, station: 'kitchen' | 'bar', status: OrderStatus) => void;
  onUpdateItemStatus: (id: string, itemIndex: number, status: OrderStatus) => void;
  onVoid: (order: Order) => void;
}

const BarOrderCard: React.FC<BarOrderCardProps> = ({ order, barItems, onUpdateStationStatus, onUpdateItemStatus, onVoid }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Use Bar-specific status
  const displayStatus = order.barStatus || OrderStatus.PENDING;

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
                <h4 className="font-bold text-lg flex items-center gap-2 text-purple-700">
                    <ShoppingBag size={18} /> Takeout (Bar)
                </h4>
                ) : (
                <h4 className="font-bold text-lg">Table {order.tableId.replace('t', '')}</h4>
                )}
            </div>
             <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getStatusColor(displayStatus)}`}>
                {displayStatus === OrderStatus.COOKING ? 'PREPARING' : displayStatus}
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
        </div>
        <div className="text-gray-400 p-1 hover:bg-gray-100 rounded-full transition-colors">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-dashed animate-fade-in">
            <div className="space-y-4 mb-4">
            {barItems.map(({ item, originalIndex }) => (
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
                                            className="p-1.5 rounded-full border border-purple-200 text-purple-500 hover:bg-purple-50 transition-colors"
                                            title="Start Mixing"
                                        >
                                            <Wine size={14} />
                                        </button>
                                    )}
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onUpdateItemStatus(order.id, originalIndex, OrderStatus.SERVED);
                                        }}
                                        className="p-1.5 rounded-full border border-gray-300 text-gray-400 hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-colors"
                                        title="Mark Ready"
                                    >
                                        <Check size={14} />
                                    </button>
                                </div>
                            )}

                            <span className={`font-bold text-base ${item.status === OrderStatus.SERVED ? 'text-green-700' : 'text-slate-800'}`}>{item.quantity}x</span>
                            <span className={`font-medium ${item.status === OrderStatus.SERVED ? 'text-green-700' : 'text-slate-700'}`}>{item.name}</span>
                        </div>
                    </div>
                    {item.note && (
                        <div className="col-span-full mt-2 ml-8 bg-purple-50 p-2 rounded border border-purple-100 flex gap-2 items-start text-xs text-purple-800 animate-fade-in shadow-sm">
                            <MessageSquare size={14} className="mt-0.5 shrink-0" />
                            <span className="font-medium italic">"{item.note}"</span>
                        </div>
                    )}
                </div>
            ))}
            </div>

            <div className="flex gap-2 pt-2 border-t">
            {displayStatus === OrderStatus.PENDING && (
                <button 
                onClick={() => onUpdateStationStatus(order.id, 'bar', OrderStatus.COOKING)}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1 shadow-sm"
                >
                <Wine size={16} /> Start Mixing All
                </button>
            )}
            {displayStatus === OrderStatus.COOKING && (
                <button 
                onClick={() => onUpdateStationStatus(order.id, 'bar', OrderStatus.SERVED)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1 shadow-sm"
                >
                <CheckCircle size={16} /> All Ready
                </button>
            )}
            
            {[OrderStatus.PENDING, OrderStatus.COOKING, OrderStatus.SERVED].includes(displayStatus) && (
                <button 
                onClick={(e) => { e.stopPropagation(); onVoid(order); }}
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

const BarDisplay: React.FC = () => {
  const navigate = useNavigate();
  const { orders, menu, categories, updateOrderStationStatus, updateOrderItemStatus, voidOrder, settings } = useStore();

  // Void Modal State
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [selectedOrderToVoid, setSelectedOrderToVoid] = useState<Order | null>(null);
  const [selectedReason, setSelectedReason] = useState(VOID_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  // 1. Filter Logic using Settings
  const getBarItems = (order: Order) => {
      return order.items
        .map((item, index) => ({ item, originalIndex: index }))
        .filter(({ item }) => {
          const menuItem = menu.find(m => m.id === item.menuId);
          if (!menuItem) return false;
          
          // 1. Check Item Level Override
          if (menuItem.station) {
              return menuItem.station === 'bar';
          }

          // 2. Check mapping (default to kitchen if undefined)
          const station = settings.categoryMapping?.[menuItem.categoryId];
          return station === 'bar';
      });
  };

  const handleOpenVoidModal = (order: Order) => {
      setSelectedOrderToVoid(order);
      setSelectedReason(VOID_REASONS[0]);
      setCustomReason('');
      setShowVoidModal(true);
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

  // Only show orders that have bar items and are not complete/cancelled
  // Sort by timestamp ascending (Oldest first)
  const activeOrders = orders.filter(o => 
      o.barStatus && 
      [OrderStatus.PENDING, OrderStatus.COOKING, OrderStatus.SERVED].includes(o.barStatus)
  ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
             <span className="p-2 bg-purple-100 text-purple-700 rounded-lg"><Wine size={32} /></span>
             Counter Bar Display
          </h1>
          <p className="text-slate-500">Manage beverage orders.</p>
        </div>
        <div className="flex gap-4 items-center">
            {/* Station Switcher (Split Button) */}
            <div className="bg-gray-100 p-1 rounded-lg flex shadow-sm border border-gray-200">
               <button 
                 onClick={() => navigate('/admin/orders')}
                 className="px-4 py-2 rounded-md text-sm font-bold text-gray-500 hover:text-orange-600 hover:bg-gray-200 transition-colors flex items-center gap-2"
               >
                 <ChefHat size={16} /> Kitchen
               </button>
               <button 
                 className="px-4 py-2 rounded-md text-sm font-bold bg-white text-purple-600 shadow-sm flex items-center gap-2"
               >
                 <Wine size={16} /> Bar
               </button>
            </div>

            <div className="text-xl font-bold text-slate-700 font-mono bg-white px-4 py-2 rounded-lg shadow-sm border">
               {new Date().toLocaleTimeString()}
            </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
            {/* Pending Column (Orange to match Kitchen) */}
            <div className="bg-orange-50 rounded-xl p-4 flex flex-col h-full border border-orange-100">
            <h2 className="font-bold text-orange-600 mb-4 flex items-center gap-2 sticky top-0 bg-orange-50 py-2 z-10 border-b border-orange-200 pb-2">
                <Clock size={20} /> PENDING
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-orange-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-orange-300">
                {activeOrders.filter(o => o.barStatus === OrderStatus.PENDING).map(order => {
                    const barItems = getBarItems(order);
                    if (barItems.length === 0) return null;
                    return <BarOrderCard key={order.id} order={order} barItems={barItems} onUpdateStationStatus={updateOrderStationStatus} onUpdateItemStatus={updateOrderItemStatus} onVoid={handleOpenVoidModal} />;
                })}
            </div>
            </div>

            {/* Preparing Column (Purple) */}
            <div className="bg-purple-50/50 rounded-xl p-4 flex flex-col h-full border border-purple-100">
            <h2 className="font-bold text-purple-600 mb-4 flex items-center gap-2 sticky top-0 bg-purple-50/50 py-2 z-10 border-b border-purple-200 pb-2">
                <Wine size={20} /> PREPARING
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-purple-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-purple-300">
                {activeOrders.filter(o => o.barStatus === OrderStatus.COOKING).map(order => {
                    const barItems = getBarItems(order);
                    if (barItems.length === 0) return null;
                    return <BarOrderCard key={order.id} order={order} barItems={barItems} onUpdateStationStatus={updateOrderStationStatus} onUpdateItemStatus={updateOrderItemStatus} onVoid={handleOpenVoidModal} />;
                })}
            </div>
            </div>

            {/* Served/Ready Column (Green) */}
            <div className="bg-green-50/50 rounded-xl p-4 flex flex-col h-full border border-green-100">
            <h2 className="font-bold text-green-600 mb-4 flex items-center gap-2 sticky top-0 bg-green-50/50 py-2 z-10 border-b border-green-200 pb-2">
                <CheckCircle size={20} /> READY / SERVED
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-green-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-green-300">
                {activeOrders.filter(o => o.barStatus === OrderStatus.SERVED).map(order => {
                    const barItems = getBarItems(order);
                    if (barItems.length === 0) return null;
                    return <BarOrderCard key={order.id} order={order} barItems={barItems} onUpdateStationStatus={updateOrderStationStatus} onUpdateItemStatus={updateOrderItemStatus} onVoid={handleOpenVoidModal} />;
                })}
            </div>
            </div>
      </div>

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
                        className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
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

export default BarDisplay;
