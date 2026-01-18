
import React, { useState } from 'react';
import { Calendar, Clock, Users, LayoutGrid, CheckCircle, Info, User } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Booking, TableStatus } from '../../types';

const ClientBooking: React.FC = () => {
  const { addBooking, tables, zones } = useStore();
  const [success, setSuccess] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    guests: 2,
    date: '',
    time: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      customerName: formData.name,
      phone: formData.phone,
      date: formData.date,
      time: formData.time,
      guests: Number(formData.guests),
      status: 'Pending',
      tableId: selectedTableId || undefined
    };

    addBooking(newBooking);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Booking Requested!</h2>
          <p className="text-gray-500 mb-6">
            We have received your reservation request for <b>{formData.date} at {formData.time}</b>
            {selectedTableId && <span> at <b>Table {tables.find(t => t.id === selectedTableId)?.name}</b></span>}.
            <br/>You will receive a confirmation shortly.
          </p>
          <button 
            onClick={() => { 
              setSuccess(false); 
              setFormData({...formData, name: '', phone: ''}); 
              setSelectedTableId(null);
            }} 
            className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition"
          >
            Make Another Booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
           <h1 className="text-4xl font-bold text-slate-900 mb-4">Reserve Your Table</h1>
           <p className="text-slate-500 max-w-2xl mx-auto">Select your preferred table from our real-time floor plan or let us choose the best spot for you.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Table Map */}
          <div className="lg:w-7/12 space-y-6">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <LayoutGrid size={20} className="text-amber-600" /> Live Floor Plan
                </h3>
                
                <div className="flex gap-4 mb-6 text-sm">
                   <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-white border-2 border-green-500"></div> Available</div>
                   <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Selected</div>
                   <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-300"></div> Occupied/Reserved</div>
                </div>

                <div className="space-y-6">
                   {zones.map(zone => (
                     <div key={zone.id}>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Zone {zone.name}</h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                           {tables.filter(t => t.zone === zone.name).map(table => {
                             const isAvailable = table.status === TableStatus.AVAILABLE;
                             const isSelected = selectedTableId === table.id;
                             
                             return (
                               <button
                                 key={table.id}
                                 disabled={!isAvailable}
                                 onClick={() => setSelectedTableId(isSelected ? null : table.id)}
                                 className={`
                                   relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                                   ${!isAvailable 
                                      ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed grayscale' 
                                      : isSelected 
                                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-200 transform scale-105' 
                                        : 'bg-white border-gray-200 hover:border-green-400 hover:shadow-md'
                                   }
                                 `}
                               >
                                 {/* Status Dot */}
                                 <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                                    isSelected ? 'bg-amber-500' : 
                                    isAvailable ? 'bg-green-500' : 'bg-red-500'
                                 }`} />
                                 
                                 <span className="font-bold text-slate-700 text-lg">{table.name}</span>
                                 <div className="flex items-center gap-1 text-xs text-gray-500">
                                   <User size={12} /> {table.seats}
                                 </div>
                               </button>
                             );
                           })}
                           {tables.filter(t => t.zone === zone.name).length === 0 && (
                             <div className="col-span-full text-center text-xs text-gray-400 py-4 border-2 border-dashed rounded-lg">
                               No tables in this zone
                             </div>
                           )}
                        </div>
                     </div>
                   ))}
                   {zones.length === 0 && (
                       <div className="text-center text-gray-400 py-8">
                           No zones configured.
                       </div>
                   )}
                </div>
             </div>
          </div>

          {/* Right Column: Form */}
          <div className="lg:w-5/12">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 sticky top-24">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Booking Details</h3>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                {selectedTableId && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center gap-3 text-amber-800 animate-fade-in">
                     <CheckCircle size={20} />
                     <span className="font-medium">Table {tables.find(t => t.id === selectedTableId)?.name} selected</span>
                     <button type="button" onClick={() => setSelectedTableId(null)} className="ml-auto text-xs underline hover:text-amber-900">Change</button>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full bg-slate-800 border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:outline-none transition placeholder-slate-500" 
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input 
                      required 
                      type="tel" 
                      className="w-full bg-slate-800 border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:outline-none transition placeholder-slate-500" 
                      placeholder="081-xxx-xxxx" 
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                     <select 
                       className="w-full bg-slate-800 border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                       value={formData.guests}
                       onChange={e => setFormData({...formData, guests: Number(e.target.value)})}
                     >
                       {[1,2,3,4,5,6,7,8, 9, 10, 11, 12].map(n => <option key={n} value={n}>{n} People</option>)}
                     </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input 
                      required 
                      type="date" 
                      className="w-full bg-slate-800 border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:outline-none transition [color-scheme:dark]" 
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                     <input 
                      required 
                      type="time" 
                      className="w-full bg-slate-800 border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:outline-none transition [color-scheme:dark]" 
                      value={formData.time}
                      onChange={e => setFormData({...formData, time: e.target.value})}
                     />
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg flex gap-3 items-start text-xs text-blue-700">
                   <Info size={16} className="shrink-0 mt-0.5" />
                   <p>Booking a specific table is subject to availability confirmation. We will hold your table for 15 minutes.</p>
                </div>

                <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition shadow-lg hover:shadow-xl transform active:scale-95">
                  Confirm Reservation
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientBooking;
