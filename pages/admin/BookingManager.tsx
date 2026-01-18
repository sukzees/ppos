
import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { TableStatus, Booking } from '../../types';
import { Calendar, Phone, Users, Check, X, Search, Armchair, Ban, AlertCircle, Plus, Save, Clock, Trash2, AlertTriangle, Filter } from 'lucide-react';

const BookingManager: React.FC = () => {
  const { bookings, updateBooking, addBooking, deleteBooking, tables, addNotification, currentUser, getRole } = useStore();
  const [filter, setFilter] = useState('All');
  
  // Date Filter State
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'upcoming' | 'history' | 'custom'>('all');
  const [customRange, setCustomRange] = useState({ 
      start: new Date().toISOString().split('T')[0], 
      end: new Date().toISOString().split('T')[0] 
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Booking>>({
      customerName: '',
      phone: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      guests: 2,
      status: 'Pending',
      tableId: ''
  });

  // Confirmation Modal State
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'cancel' | 'delete';
    booking: Booking | null;
    title: string;
    message: string;
    warning?: boolean;
  }>({ isOpen: false, type: 'cancel', booking: null, title: '', message: '' });

  // Check Permissions
  const userRole = currentUser ? getRole(currentUser.roleId) : null;
  const canDelete = userRole?.name === 'Admin' || userRole?.name === 'Manager';

  const handleStatusChange = (booking: Booking, status: 'Confirmed' | 'Cancelled') => {
    updateBooking({ ...booking, status });
    if (status === 'Confirmed') {
        addNotification('success', 'Booking confirmed and table reserved.');
    } else {
        addNotification('info', 'Booking cancelled.');
    }
  };

  const openCancelModal = (e: React.MouseEvent, booking: Booking) => {
      e.preventDefault();
      e.stopPropagation();

      const table = tables.find(t => t.id === booking.tableId);
      const isReserved = booking.status === 'Confirmed' && booking.tableId && table?.status === TableStatus.RESERVED;
      
      setActionModal({
          isOpen: true,
          type: 'cancel',
          booking,
          title: 'Cancel Booking',
          message: isReserved 
            ? `This booking for <b>${booking.customerName}</b> is currently holding <b>Table ${table?.name}</b>. Cancelling it will release the table.`
            : `Are you sure you want to cancel the booking for <b>${booking.customerName}</b>?`,
          warning: isReserved
      });
  };

  const openDeleteModal = (e: React.MouseEvent, booking: Booking) => {
      e.preventDefault();
      e.stopPropagation();
      
      const isConfirmed = booking.status === 'Confirmed';
      setActionModal({
          isOpen: true,
          type: 'delete',
          booking,
          title: 'Delete Booking Record',
          message: isConfirmed 
            ? `<b>Warning:</b> This booking is Confirmed. Deleting it will remove the record and release any assigned table.` 
            : `Are you sure you want to permanently delete the booking record for <b>${booking.customerName}</b>?`,
          warning: isConfirmed
      });
  };

  const confirmAction = () => {
      if (!actionModal.booking) return;

      if (actionModal.type === 'cancel') {
          handleStatusChange(actionModal.booking, 'Cancelled');
      } else {
          deleteBooking(actionModal.booking.id);
          addNotification('info', 'Booking record deleted.');
      }
      setActionModal({ ...actionModal, isOpen: false });
  };

  const handleAssignTable = (booking: Booking, tableId: string) => {
    // If clearing the table
    if (!tableId) {
        updateBooking({ ...booking, tableId: '' });
        return;
    }

    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    // Strict check: Cannot assign if table is RESERVED by another booking
    if (table.status === TableStatus.RESERVED && table.id !== booking.tableId) {
        alert(`Table ${table.name} is already RESERVED. Cannot assign.`);
        return;
    }

    // Warning check: If table is OCCUPIED, ask for confirmation
    if (table.status === TableStatus.OCCUPIED) {
        if (!window.confirm(`Table ${table.name} is currently OCCUPIED. Are you sure you want to assign it?`)) {
            return;
        }
    }

    updateBooking({ ...booking, tableId: tableId });
  };

  const handleSaveNewBooking = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.customerName || !formData.date || !formData.time) {
          addNotification('warning', 'Please fill in all required fields.');
          return;
      }

      // If confirming immediately with a table, check availability
      if (formData.status === 'Confirmed' && formData.tableId) {
          const table = tables.find(t => t.id === formData.tableId);
          if (table && table.status === TableStatus.RESERVED) {
              alert(`Table ${table.name} is already Reserved. Please choose another.`);
              return;
          }
          if (table && table.status === TableStatus.OCCUPIED) {
              if (!confirm(`Table ${table.name} is currently Occupied. Confirm booking anyway?`)) {
                  return;
              }
          }
      }

      const newBooking: Booking = {
          id: `bk-${Date.now()}`,
          customerName: formData.customerName,
          phone: formData.phone || '',
          date: formData.date!,
          time: formData.time!,
          guests: Number(formData.guests),
          status: formData.status as 'Pending' | 'Confirmed' | 'Cancelled',
          tableId: formData.tableId || undefined
      };

      addBooking(newBooking);
      addNotification('success', 'New booking created successfully');
      setIsModalOpen(false);
      setFormData({
          customerName: '',
          phone: '',
          date: new Date().toISOString().split('T')[0],
          time: '',
          guests: 2,
          status: 'Pending',
          tableId: ''
      });
  };

  // --- Filtering Logic ---
  const filteredBookings = useMemo(() => {
      let data = bookings;

      // 1. Status Filter
      if (filter !== 'All') {
          data = data.filter(b => b.status === filter);
      }

      // 2. Date Filter
      const todayStr = new Date().toISOString().split('T')[0];

      switch (dateFilter) {
          case 'today':
              data = data.filter(b => b.date === todayStr);
              break;
          case 'upcoming':
              data = data.filter(b => b.date >= todayStr);
              break;
          case 'history':
              data = data.filter(b => b.date < todayStr);
              break;
          case 'custom':
              if (customRange.start) data = data.filter(b => b.date >= customRange.start);
              if (customRange.end) data = data.filter(b => b.date <= customRange.end);
              break;
          default: // 'all'
              break;
      }

      // Sort
      return data.sort((a,b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime());
  }, [bookings, filter, dateFilter, customRange]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Booking Management</h1>
          <p className="text-slate-500">View and manage table reservations.</p>
        </div>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-md transition-transform active:scale-95"
        >
            <Plus size={20} /> New Booking
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <span className="text-sm font-bold text-gray-700">Status:</span>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                {['All', 'Pending', 'Confirmed', 'Cancelled'].map(f => (
                    <button 
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        filter === f ? 'bg-white text-slate-800 font-bold shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                    >
                    {f}
                    </button>
                ))}
              </div>
          </div>

          <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

          {/* Date Filter */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
              <span className="text-sm font-bold text-gray-700 flex items-center gap-1"><Calendar size={16}/> Date:</span>
              <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto">
                  {(['all', 'today', 'upcoming', 'history', 'custom'] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setDateFilter(d)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-all whitespace-nowrap ${
                            dateFilter === d 
                            ? 'bg-white text-slate-800 font-bold shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                          {d}
                      </button>
                  ))}
              </div>

              {/* Custom Date Range Inputs */}
              {dateFilter === 'custom' && (
                  <div className="flex items-center gap-2 animate-fade-in bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                      <input 
                          type="date" 
                          className="bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-amber-500"
                          value={customRange.start}
                          onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
                      />
                      <span className="text-gray-400 text-xs">-</span>
                      <input 
                          type="date" 
                          className="bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-amber-500"
                          value={customRange.end}
                          onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
                      />
                  </div>
              )}
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-semibold text-gray-600">Customer</th>
              <th className="p-4 font-semibold text-gray-600">Date & Time</th>
              <th className="p-4 font-semibold text-gray-600">Guests</th>
              <th className="p-4 font-semibold text-gray-600">Assigned Table</th>
              <th className="p-4 font-semibold text-gray-600">Status</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredBookings.map(booking => (
              <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-slate-800">{booking.customerName}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Phone size={12} /> {booking.phone}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-sm">
                        {new Date(booking.date).toLocaleDateString()} at {booking.time}
                        {/* Label if date is passed */}
                        {new Date(`${booking.date} ${booking.time}`) < new Date() && booking.status !== 'Cancelled' && (
                            <span className="ml-2 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border">Past</span>
                        )}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                   <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-400" />
                    <span className="text-sm font-medium">{booking.guests} ppl</span>
                   </div>
                </td>
                <td className="p-4">
                  {booking.status === 'Cancelled' ? (
                    <span className="text-gray-400 text-sm flex items-center gap-1"><Ban size={14}/> Cancelled</span>
                  ) : (
                    <div className="relative">
                        <select 
                        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all cursor-pointer ${
                            !booking.tableId 
                            ? 'text-gray-400 border-dashed bg-white' 
                            : 'text-white font-bold border-slate-600 bg-slate-700'
                        }`}
                        value={booking.tableId || ''}
                        onChange={(e) => handleAssignTable(booking, e.target.value)}
                        >
                        <option value="" className="text-gray-500 bg-white">Select Table</option>
                        {tables.map(t => {
                            // Determine availability logic
                            const isReserved = t.status === TableStatus.RESERVED && t.id !== booking.tableId;
                            const isOccupied = t.status === TableStatus.OCCUPIED;
                            
                            let statusText = '';
                            let statusClass = 'text-slate-700';
                            
                            if (isOccupied) { 
                                statusText = '(Occupied)'; 
                                statusClass = 'text-red-500 font-medium'; 
                            } else if (isReserved) { 
                                statusText = '(Reserved)'; 
                                statusClass = 'text-gray-400 italic'; 
                            }
                            
                            return (
                                <option 
                                    key={t.id} 
                                    value={t.id} 
                                    className={`${statusClass} bg-white`}
                                    disabled={isReserved} // Disable reserved tables
                                >
                                    Table {t.name} ({t.seats} seats) {statusText}
                                </option>
                            );
                        })}
                        </select>
                        {!booking.tableId && (
                            <div className="absolute right-8 top-2.5 pointer-events-none text-amber-500 animate-pulse">
                                <AlertCircle size={14} />
                            </div>
                        )}
                    </div>
                  )}
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase inline-flex items-center gap-1 ${
                    booking.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                    booking.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {booking.status === 'Confirmed' && <Check size={12} />}
                    {booking.status === 'Cancelled' && <X size={12} />}
                    {booking.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    {booking.status === 'Pending' && (
                        <>
                        <button 
                            onClick={() => handleStatusChange(booking, 'Confirmed')}
                            className={`p-2 rounded-lg transition-all shadow-sm ${
                                booking.tableId 
                                ? 'bg-green-500 text-white hover:bg-green-600 hover:shadow-md' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                            title={booking.tableId ? "Confirm Booking" : "Select a table first"}
                            disabled={!booking.tableId}
                        >
                            <Check size={18} />
                        </button>
                        <button 
                            onClick={(e) => openCancelModal(e, booking)}
                            className="p-2 bg-white border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-all shadow-sm hover:shadow-md" 
                            title="Cancel Request"
                        >
                            <X size={18} />
                        </button>
                        {canDelete && (
                            <button 
                                onClick={(e) => openDeleteModal(e, booking)}
                                className="p-2 bg-white border border-gray-200 text-gray-400 rounded-lg hover:bg-gray-50 hover:text-red-500 transition-all shadow-sm" 
                                title="Delete Record"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        </>
                    )}
                    {booking.status === 'Confirmed' && (
                        <>
                        <button 
                        onClick={(e) => openCancelModal(e, booking)}
                        className="px-3 py-2 bg-white text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors flex items-center gap-1 shadow-sm"
                        title="Cancel Booking & Free Table"
                        >
                        <Ban size={14} /> Cancel
                        </button>
                        {canDelete && (
                            <button 
                                onClick={(e) => openDeleteModal(e, booking)}
                                className="p-2 bg-white border border-gray-200 text-gray-400 rounded-lg hover:bg-gray-50 hover:text-red-500 transition-all shadow-sm" 
                                title="Delete Record"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        </>
                    )}
                    {booking.status === 'Cancelled' && (
                        <>
                        <span className="text-xs text-gray-400 italic py-2 mr-2">Cancelled</span>
                        {canDelete && (
                            <button 
                                onClick={(e) => openDeleteModal(e, booking)}
                                className="p-2 bg-white border border-gray-200 text-red-400 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all shadow-sm" 
                                title="Delete Record"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredBookings.length === 0 && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-400">
                    <Calendar size={48} className="mx-auto mb-2 opacity-20" />
                    No bookings found for the selected criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Action Confirmation Modal */}
      {actionModal.isOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100">
                  <div className="p-6 text-center">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${actionModal.warning ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                          {actionModal.type === 'delete' ? <Trash2 size={32} /> : <AlertTriangle size={32} />}
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">{actionModal.title}</h3>
                      <div className="text-gray-600 text-sm mb-6" dangerouslySetInnerHTML={{ __html: actionModal.message }}></div>
                      
                      <div className="flex gap-3">
                          <button 
                              onClick={() => setActionModal({...actionModal, isOpen: false})}
                              className="flex-1 py-2.5 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition"
                          >
                              Keep It
                          </button>
                          <button 
                              onClick={confirmAction}
                              className={`flex-1 py-2.5 rounded-lg font-bold text-white shadow-lg transition transform active:scale-95 ${
                                  actionModal.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
                              }`}
                          >
                              Yes, {actionModal.type === 'delete' ? 'Delete' : 'Cancel'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Add Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">New Reservation</h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                
                <form onSubmit={handleSaveNewBooking} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                        <input 
                            required
                            type="text" 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            placeholder="John Doe"
                            value={formData.customerName}
                            onChange={e => setFormData({...formData, customerName: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input 
                            type="tel" 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            placeholder="081-xxx-xxxx"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input 
                                required
                                type="date" 
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                            <input 
                                required
                                type="time" 
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                value={formData.time}
                                onChange={e => setFormData({...formData, time: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                            <input 
                                required
                                type="number" 
                                min="1"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                value={formData.guests}
                                onChange={e => setFormData({...formData, guests: Number(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select 
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                                value={formData.status}
                                onChange={e => setFormData({...formData, status: e.target.value as 'Pending' | 'Confirmed' | 'Cancelled'})}
                            >
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assign Table (Optional)</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                            value={formData.tableId}
                            onChange={e => setFormData({...formData, tableId: e.target.value})}
                        >
                            <option value="">No Table Assigned</option>
                            {tables.map(t => {
                                const isReserved = t.status === TableStatus.RESERVED;
                                const isOccupied = t.status === TableStatus.OCCUPIED;
                                let statusText = '';
                                if (isOccupied) statusText = '(Occupied)';
                                else if (isReserved) statusText = '(Reserved)';
                                
                                return (
                                    <option 
                                        key={t.id} 
                                        value={t.id} 
                                        disabled={isReserved} // Disable in new booking if reserved
                                    >
                                        Table {t.name} ({t.seats} seats) {statusText}
                                    </option>
                                );
                            })}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Reserved tables are unavailable.</p>
                    </div>

                    <div className="pt-4 flex gap-3 border-t">
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 py-2.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition shadow-lg flex justify-center items-center gap-2"
                        >
                            <Save size={18} /> Save Booking
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default BookingManager;
