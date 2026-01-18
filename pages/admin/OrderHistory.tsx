
import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus } from '../../types';
import { Search, Filter, Calendar, Eye, Printer, X, Receipt, CheckCircle2, Ban, User, CreditCard } from 'lucide-react';

const OrderHistory: React.FC = () => {
  const { orders, settings } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'Cancelled'>('All');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'All' | 'Cash' | 'Card' | 'QR'>('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filter Logic
  const filteredOrders = orders
    .filter(order => {
        // Only show history orders (Completed or Cancelled)
        const isHistory = order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED;
        if (!isHistory) return false;

        // Status Filter
        if (statusFilter !== 'All' && order.status !== statusFilter) return false;

        // Payment Method Filter
        if (paymentMethodFilter !== 'All') {
            if (order.paymentMethod !== paymentMethodFilter) return false;
        }

        // Search Filter
        const searchLower = searchTerm.toLowerCase();
        return (
            order.id.toLowerCase().includes(searchLower) ||
            (order.customerName && order.customerName.toLowerCase().includes(searchLower)) ||
            (order.tableId && order.tableId.toLowerCase().includes(searchLower))
        );
    })
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Stats for the visible list
  const totalRevenue = filteredOrders
    .filter(o => o.status === OrderStatus.COMPLETED)
    .reduce((acc, o) => acc + (o.total - (o.discount || 0)), 0);
  
  const totalCount = filteredOrders.length;

  const handlePrint = () => {
      window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-screen flex flex-col">
      <div className="mb-6 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
             <span className="p-2 bg-slate-100 text-slate-700 rounded-lg"><Receipt size={32} /></span>
             Order History
          </h1>
          <p className="text-slate-500">View and manage past transactions.</p>
        </div>
        <div className="flex gap-4 items-center">
            <div className="text-right">
                <p className="text-sm text-gray-500">Total Revenue (Visible)</p>
                <p className="text-xl font-bold text-emerald-600">{settings.currency}{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="h-10 w-px bg-gray-200"></div>
            <div className="text-right">
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-xl font-bold text-slate-700">{totalCount}</p>
            </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border mb-6 flex flex-wrap items-center gap-4 shrink-0">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
            <input 
                type="text" 
                placeholder="Search Order ID, Customer, Table..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-700 text-white placeholder-slate-400"
            />
          </div>
          
          <div className="flex items-center gap-2 border-l pl-4 border-gray-200">
              <Filter size={18} className="text-gray-400" />
              <div className="flex bg-gray-100 p-1 rounded-lg">
                  {(['All', 'Completed', 'Cancelled'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                            statusFilter === status 
                            ? 'bg-white text-slate-800 shadow font-bold' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                          {status}
                      </button>
                  ))}
              </div>
          </div>

          <div className="flex items-center gap-2 border-l pl-4 border-gray-200 overflow-x-auto">
              <CreditCard size={18} className="text-gray-400 shrink-0" />
              <div className="flex bg-gray-100 p-1 rounded-lg">
                  {(['All', 'Cash', 'Card', 'QR'] as const).map(method => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethodFilter(method)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                            paymentMethodFilter === method 
                            ? 'bg-white text-slate-800 shadow font-bold' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                          {method}
                      </button>
                  ))}
              </div>
          </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex-1 flex flex-col">
        <div className="overflow-y-auto flex-1">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b sticky top-0 z-10">
                    <tr>
                        <th className="p-4 font-semibold text-gray-600 text-sm">Order ID</th>
                        <th className="p-4 font-semibold text-gray-600 text-sm">Date & Time</th>
                        <th className="p-4 font-semibold text-gray-600 text-sm">Customer / Table</th>
                        <th className="p-4 font-semibold text-gray-600 text-sm">Items</th>
                        <th className="p-4 font-semibold text-gray-600 text-sm">Payment</th>
                        <th className="p-4 font-semibold text-gray-600 text-sm text-right">Total</th>
                        <th className="p-4 font-semibold text-gray-600 text-sm text-center">Status</th>
                        <th className="p-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {filteredOrders.map(order => {
                        const netTotal = order.total - (order.discount || 0);
                        return (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-mono text-xs text-slate-500 font-bold">
                                    {order.id.slice(-6).toUpperCase()}
                                    <div className="text-[10px] text-gray-400 font-normal">{order.id}</div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col text-sm text-slate-700">
                                        <span className="font-medium">{order.timestamp.toLocaleDateString()}</span>
                                        <span className="text-xs text-gray-500">{order.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-sm font-medium text-slate-700">
                                    {order.tableId === 'takeout' ? 'Takeout' : `Table ${order.tableId.replace('t', '')}`}
                                    {order.customerName && <div className="text-xs text-blue-600 font-normal flex items-center gap-1"><User size={10}/> {order.customerName}</div>}
                                </td>
                                <td className="p-4 text-sm text-gray-600">
                                    <div className="max-w-xs truncate" title={order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}>
                                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600">
                                        <CreditCard size={12} /> {order.paymentMethod || 'Cash'}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-right font-bold text-slate-700">
                                    {settings.currency}{netTotal.toLocaleString()}
                                    {order.discount && order.discount > 0 && <div className="text-[10px] text-green-600 font-normal">(-{settings.currency}{order.discount.toLocaleString()})</div>}
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
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => setSelectedOrder(order)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="View Details"
                                    >
                                        <Eye size={18} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    {filteredOrders.length === 0 && (
                        <tr>
                            <td colSpan={8} className="p-10 text-center text-gray-400">
                                No order history found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b bg-gray-50 flex justify-between items-center shrink-0">
                      <div>
                          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                              Order #{selectedOrder.id.slice(-6).toUpperCase()}
                          </h3>
                          <p className="text-xs text-gray-500">{selectedOrder.timestamp.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={handlePrint} className="p-2 text-gray-500 hover:text-slate-800 hover:bg-white rounded border border-transparent hover:border-gray-200 transition"><Printer size={20} /></button>
                          <button onClick={() => setSelectedOrder(null)} className="p-2 text-gray-400 hover:text-gray-600"><X size={24} /></button>
                      </div>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1 bg-white">
                      <div className="flex justify-between items-center mb-6 bg-slate-50 p-4 rounded-lg border">
                           <div>
                               <p className="text-xs text-gray-500 uppercase font-bold">Status</p>
                               <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-bold uppercase mt-1 ${
                                   selectedOrder.status === OrderStatus.COMPLETED 
                                   ? 'bg-green-100 text-green-700' 
                                   : 'bg-red-100 text-red-700'
                               }`}>
                                   {selectedOrder.status}
                               </span>
                               {selectedOrder.voidReason && <p className="text-xs text-red-500 mt-1 italic">Reason: {selectedOrder.voidReason}</p>}
                           </div>
                           <div className="text-right">
                               <p className="text-xs text-gray-500 uppercase font-bold">Payment</p>
                               <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm font-bold text-gray-600 mt-1">
                                   <CreditCard size={14} /> {selectedOrder.paymentMethod || 'Cash'}
                               </span>
                           </div>
                      </div>

                      <div className="space-y-4 mb-6">
                          <h4 className="font-bold text-slate-700 border-b pb-2">Items</h4>
                          <div className="grid grid-cols-12 text-xs font-bold text-gray-500 border-b pb-1 mb-2">
                              <span className="col-span-6">Item</span>
                              <span className="col-span-2 text-center">Qty</span>
                              <span className="col-span-2 text-right">Price</span>
                              <span className="col-span-2 text-right">Total</span>
                          </div>
                          {selectedOrder.items.map((item, idx) => (
                              <div key={idx} className="grid grid-cols-12 text-sm py-1">
                                  <div className="col-span-6 pr-2">
                                      <p className="font-medium text-slate-800">{item.name}</p>
                                      {item.note && <p className="text-xs text-amber-600 italic">"{item.note}"</p>}
                                  </div>
                                  <span className="col-span-2 text-center font-bold text-slate-500">{item.quantity}</span>
                                  <span className="col-span-2 text-right text-slate-600">{settings.currency}{item.price.toLocaleString()}</span>
                                  <span className="col-span-2 text-right font-medium text-slate-800">{settings.currency}{(item.price * item.quantity).toLocaleString()}</span>
                              </div>
                          ))}
                      </div>

                      <div className="space-y-2 text-sm border-t pt-4">
                           <div className="flex justify-between">
                               <span className="text-gray-500">Subtotal</span>
                               <span>{settings.currency}{selectedOrder.items.reduce((a, b) => a + (b.price * b.quantity), 0).toLocaleString()}</span>
                           </div>
                           {selectedOrder.discount && selectedOrder.discount > 0 && (
                               <div className="flex justify-between text-green-600">
                                   <span>Discount</span>
                                   <span>-{settings.currency}{selectedOrder.discount.toLocaleString()}</span>
                               </div>
                           )}
                           <div className="flex justify-between font-bold text-lg text-slate-800 pt-2 border-t border-dashed">
                               <span>Total Paid</span>
                               <span>{settings.currency}{(selectedOrder.total - (selectedOrder.discount || 0)).toLocaleString()}</span>
                           </div>
                           {selectedOrder.pointsEarned && (
                               <div className="text-center text-xs text-green-600 mt-2 bg-green-50 py-1 rounded">
                                   Customer earned {selectedOrder.pointsEarned} points
                               </div>
                           )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Hidden Print Template for History Order */}
      <div className="hidden print:block print:absolute print:inset-0 print:bg-white print:z-50 p-8">
            {selectedOrder && (
                <>
                    <div className="text-center mb-6">
                        {settings.receipt.showImageLogo && settings.restaurantLogo && (
                            <div className="flex justify-center mb-2">
                                <img src={settings.restaurantLogo} alt="Logo" className="h-20 object-contain grayscale" />
                            </div>
                        )}
                        <h1 className="text-2xl font-bold uppercase">{settings.restaurantName}</h1>
                        <p className="text-gray-600 text-sm">{settings.receipt.address}</p>
                        <p className="text-gray-600 text-sm">Tel: {settings.receipt.phone}</p>
                        <div className="border-b-2 border-dashed border-gray-300 w-full my-4"></div>
                        <h2 className="text-xl font-bold uppercase">Reprint Receipt</h2>
                    </div>

                    <div className="mb-6 text-sm">
                        <div className="flex justify-between"><span>Order ID:</span> <span>{selectedOrder.id}</span></div>
                        <div className="flex justify-between"><span>Date:</span> <span>{selectedOrder.timestamp.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Customer:</span> <span>{selectedOrder.customerName || 'Walk-in'}</span></div>
                    </div>

                    <table className="w-full text-left text-sm mb-6">
                        <thead>
                            <tr className="border-b border-black">
                                <th className="py-1 text-left">Item</th>
                                <th className="py-1 text-center">Qty</th>
                                <th className="py-1 text-right">Price</th>
                                <th className="py-1 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedOrder.items.map((item, i) => (
                                <tr key={i}>
                                    <td className="py-1">{item.name}</td>
                                    <td className="py-1 text-center">{item.quantity}</td>
                                    <td className="py-1 text-right">{item.price.toLocaleString()}</td>
                                    <td className="py-1 text-right">{(item.price * item.quantity).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="border-t-2 border-black pt-2 space-y-1 text-right text-sm">
                         <div className="flex justify-between font-bold text-xl mt-2 border-t border-dashed pt-2">
                            <span>Total</span>
                            <span>{settings.currency}{(selectedOrder.total - (selectedOrder.discount || 0)).toLocaleString()}</span>
                        </div>
                    </div>

                    {settings.receipt.showCurrencyExchange && settings.currencies && settings.currencies.filter(c => !c.isBase).map(c => {
                        const converted = (selectedOrder.total - (selectedOrder.discount || 0)) / c.rate;
                        return (
                            <div key={c.code} className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>({c.code} @ {c.rate.toLocaleString()})</span>
                                <span>{c.symbol}{converted.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                        );
                    })}

                    {settings.receipt.showPaymentMethod && (
                        <div className="flex justify-between text-xs text-gray-500 mt-1 pt-1 border-t border-dashed">
                            <span>Payment Method</span>
                            <span>{selectedOrder.paymentMethod || 'Cash'}</span>
                        </div>
                    )}

                    {settings.receipt.showQrCode && settings.paymentQrImage && (
                        <div className="flex justify-center my-4">
                            <img src={settings.paymentQrImage} alt="Payment QR" className="w-32 h-32 object-contain border p-1" />
                        </div>
                    )}
                    
                    <div className="text-center mt-8 text-sm text-gray-600">** COPY **</div>
                </>
            )}
      </div>
    </div>
  );
};

export default OrderHistory;
