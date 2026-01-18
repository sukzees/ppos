
import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Customer, CustomerTier, Coupon } from '../../types';
import { Search, Phone, Crown, Plus, Edit, Trash2, Calendar, Star, Gift, TicketPercent } from 'lucide-react';

const CustomerManager: React.FC = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, coupons, redeemCouponForCustomer } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [redeemingCustomer, setRedeemingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '', phone: '', points: 0, tier: 'Bronze'
  });

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData(customer);
    } else {
      setEditingCustomer(null);
      setFormData({ name: '', phone: '', points: 0, tier: 'Bronze', visitCount: 0 });
    }
    setIsModalOpen(true);
  };

  const handleOpenRedeemModal = (customer: Customer) => {
      setRedeemingCustomer(customer);
      setIsRedeemModalOpen(true);
  };

  const handleRedeem = (coupon: Coupon) => {
      if (!redeemingCustomer) return;
      if (confirm(`Redeem '${coupon.code}' for ${coupon.pointCost} points?`)) {
          const success = redeemCouponForCustomer(redeemingCustomer.id, coupon.id);
          if (success) {
              // Close modal or update local state if needed (store updates automatically)
              setIsRedeemModalOpen(false);
          }
      }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto calculate tier if points changed manually
    const points = Number(formData.points);
    let tier: CustomerTier = 'Bronze';
    if (points >= 1000) tier = 'Gold';
    else if (points >= 500) tier = 'Silver';

    if (editingCustomer) {
      updateCustomer({ ...editingCustomer, ...formData, points, tier } as Customer);
    } else {
      const newCustomer: Customer = {
          ...formData,
          id: `c${Date.now()}`,
          points,
          tier,
          visitCount: 0,
          joinDate: new Date(),
          ownedCoupons: []
      } as Customer;
      addCustomer(newCustomer);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      deleteCustomer(id);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const getTierColor = (tier: CustomerTier) => {
    switch (tier) {
      case 'Gold': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Silver': return 'bg-slate-100 text-slate-700 border-slate-300';
      default: return 'bg-orange-100 text-orange-800 border-orange-300';
    }
  };

  // Filter only redeemable coupons (pointCost > 0 and active)
  const redeemableCoupons = coupons.filter(c => c.isActive && c.pointCost > 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Customers</h1>
          <p className="text-slate-500">Manage customer relationships and loyalty points.</p>
        </div>
        <div className="flex gap-4">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search customers..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-slate-600 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-700 text-white placeholder-slate-400" 
                />
            </div>
            <button 
                onClick={() => handleOpenModal()}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
            >
                <Plus size={20} /> Add Customer
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(cust => (
          <div key={cust.id} className={`bg-white p-6 rounded-xl shadow-sm border-l-4 flex flex-col gap-4 ${
              cust.tier === 'Gold' ? 'border-yellow-400' : cust.tier === 'Silver' ? 'border-slate-400' : 'border-orange-400'
          }`}>
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xl uppercase">
                        {cust.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">{cust.name}</h3>
                        <div className="text-gray-500 text-sm flex items-center gap-1">
                            <Phone size={12} /> {cust.phone}
                        </div>
                    </div>
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase border flex items-center gap-1 ${getTierColor(cust.tier)}`}>
                   <Crown size={10} /> {cust.tier}
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded-lg">
                <div className="flex flex-col">
                    <span className="text-gray-400 text-xs">Points</span>
                    <span className="font-bold text-amber-600 text-lg flex items-center gap-1">
                        <Star size={14} fill="currentColor" /> {cust.points}
                    </span>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-400 text-xs">Visits</span>
                    <span className="font-bold text-slate-700 text-lg">{cust.visitCount}</span>
                </div>
            </div>
            
            {cust.ownedCoupons && cust.ownedCoupons.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {cust.ownedCoupons.map((code, idx) => (
                        <span key={idx} className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded font-bold">
                            {code}
                        </span>
                    ))}
                </div>
            )}

            <div className="flex justify-between items-center text-xs mt-auto pt-2 border-t">
                 <button 
                    onClick={() => handleOpenRedeemModal(cust)}
                    className="flex items-center gap-1 text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg font-bold transition-colors shadow-sm"
                 >
                    <Gift size={14} /> Redeem Rewards
                 </button>
                 <div className="flex gap-2">
                    <button onClick={() => handleOpenModal(cust)} className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                    <button onClick={() => handleDelete(cust.id)} className="text-red-500 hover:text-red-700 font-medium">Delete</button>
                 </div>
            </div>
          </div>
        ))}
        {filteredCustomers.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-400">
                No customers found matching your search.
            </div>
        )}
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b bg-gray-50">
              <h2 className="text-xl font-bold">{editingCustomer ? 'Edit Customer' : 'New Customer'}</h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                 <input 
                    required 
                    type="text" 
                    className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                 <input 
                    required 
                    type="text" 
                    className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                 />
               </div>

               <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                   <h3 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2"><Crown size={14}/> Loyalty Points</h3>
                   <div className="flex gap-4">
                       <div className="flex-1">
                           <label className="block text-xs font-medium text-amber-700 mb-1">Current Points</label>
                           <input 
                                required 
                                type="number" 
                                min="0"
                                className="w-full border border-amber-300 rounded-lg px-3 py-2 text-amber-900 font-bold bg-white" 
                                value={formData.points} 
                                onChange={e => setFormData({...formData, points: parseInt(e.target.value) || 0})} 
                           />
                       </div>
                       <div className="flex-1">
                           <label className="block text-xs font-medium text-amber-700 mb-1">Tier (Auto)</label>
                           <div className="w-full px-3 py-2 text-sm font-bold text-gray-500 bg-gray-100 rounded-lg">
                               {Number(formData.points) >= 1000 ? 'Gold' : Number(formData.points) >= 500 ? 'Silver' : 'Bronze'}
                           </div>
                       </div>
                   </div>
               </div>
               
              <div className="pt-4 flex gap-3 border-t mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 rounded-lg border hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 font-semibold">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Redeem Rewards Modal */}
      {isRedeemModalOpen && redeemingCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
             <div className="p-6 border-b bg-slate-900 text-white flex justify-between items-center shrink-0">
                 <div>
                    <h2 className="text-xl font-bold flex items-center gap-2"><Gift className="text-amber-500"/> Redeem Rewards</h2>
                    <p className="text-sm text-slate-300">For {redeemingCustomer.name} (Points: <span className="text-amber-400 font-bold">{redeemingCustomer.points}</span>)</p>
                 </div>
                 <button onClick={() => setIsRedeemModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
             </div>
             
             <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                {redeemableCoupons.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <TicketPercent size={48} className="mx-auto mb-2 opacity-30"/>
                        <p>No rewards available for redemption.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {redeemableCoupons.map(coupon => {
                            const canAfford = redeemingCustomer.points >= coupon.pointCost;
                            return (
                                <div key={coupon.id} className={`bg-white p-4 rounded-xl border flex justify-between items-center shadow-sm ${!canAfford ? 'opacity-60 grayscale' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 border border-amber-100">
                                            <TicketPercent size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-lg">{coupon.code}</h4>
                                            <p className="text-sm text-gray-600">{coupon.description}</p>
                                            <p className="text-xs text-blue-600 font-bold mt-1">{coupon.pointCost} Points</p>
                                        </div>
                                    </div>
                                    <button 
                                        disabled={!canAfford}
                                        onClick={() => handleRedeem(coupon)}
                                        className={`px-4 py-2 rounded-lg font-bold text-sm ${
                                            canAfford 
                                            ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md transform active:scale-95 transition-all' 
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {canAfford ? 'Redeem' : 'Not Enough Points'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
             </div>
             <div className="p-4 border-t bg-white text-center text-xs text-gray-500 shrink-0">
                Coupons redeemed will be added to the customer's account instantly.
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerManager;
