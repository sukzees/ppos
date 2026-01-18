
import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Coupon } from '../../types';
import { Plus, Trash2, Edit, TicketPercent, CheckCircle, XCircle } from 'lucide-react';

const PromotionManager: React.FC = () => {
  const { coupons, addCoupon, updateCoupon, deleteCoupon, settings } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  
  const [formData, setFormData] = useState<Partial<Coupon>>({
    code: '', type: 'amount', value: 0, pointCost: 0, isActive: true, description: ''
  });

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData(coupon);
    } else {
      setEditingCoupon(null);
      setFormData({ code: '', type: 'amount', value: 0, pointCost: 0, isActive: true, description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedData = {
        ...formData,
        code: formData.code?.toUpperCase(), // Ensure uppercase code
        value: Number(formData.value),
        pointCost: Number(formData.pointCost)
    };

    if (editingCoupon) {
      updateCoupon({ ...editingCoupon, ...formattedData } as Coupon);
    } else {
      const newCoupon = { ...formattedData, id: `cp${Date.now()}` } as Coupon;
      addCoupon(newCoupon);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this coupon?')) {
      deleteCoupon(id);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Promotion Manager</h1>
          <p className="text-slate-500">Create coupons and manage loyalty rewards.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
        >
          <Plus size={20} /> Add Coupon
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map(coupon => (
          <div key={coupon.id} className={`bg-white rounded-xl shadow-sm border p-6 flex flex-col justify-between relative overflow-hidden ${!coupon.isActive ? 'opacity-60 grayscale' : ''}`}>
             {!coupon.isActive && <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-bl">Inactive</div>}
             <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-lg flex items-center justify-center text-amber-600 bg-amber-50 border border-amber-100">
                         <TicketPercent size={24} />
                     </div>
                     <div>
                         <h3 className="font-bold text-xl text-slate-800 tracking-wide">{coupon.code}</h3>
                         <p className="text-xs text-gray-500 font-medium">
                            {coupon.type === 'percent' ? `${coupon.value}% Off` : `${settings.currency}${coupon.value.toLocaleString()} Off`}
                         </p>
                     </div>
                 </div>
             </div>
             
             <div className="space-y-2 mb-6">
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 italic min-h-[3rem]">
                    {coupon.description || 'No description provided.'}
                </p>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Redeem Cost:</span>
                    <span className={`font-bold ${coupon.pointCost > 0 ? 'text-blue-600' : 'text-green-600'}`}>
                        {coupon.pointCost > 0 ? `${coupon.pointCost} Points` : 'Free / Public'}
                    </span>
                </div>
             </div>

             <div className="flex gap-2 pt-4 border-t">
                 <button onClick={() => updateCoupon({...coupon, isActive: !coupon.isActive})} className={`flex-1 py-2 rounded text-sm font-bold flex items-center justify-center gap-1 ${coupon.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                    {coupon.isActive ? <XCircle size={16}/> : <CheckCircle size={16}/>}
                    {coupon.isActive ? 'Disable' : 'Enable'}
                 </button>
                 <button onClick={() => handleOpenModal(coupon)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition border border-blue-200"><Edit size={18} /></button>
                 <button onClick={() => handleDelete(coupon.id)} className="p-2 text-red-500 hover:bg-red-50 rounded transition border border-red-200"><Trash2 size={18} /></button>
             </div>
          </div>
        ))}
        {coupons.length === 0 && (
             <div className="col-span-full text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                 <p>No coupons found. Create one to get started.</p>
             </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
             <h2 className="text-xl font-bold mb-4">{editingCoupon ? 'Edit Coupon' : 'New Coupon'}</h2>
             <form onSubmit={handleSave} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                 <input 
                    required 
                    type="text" 
                    className="w-full border border-slate-600 rounded p-2 uppercase bg-slate-700 text-white placeholder-slate-400" 
                    value={formData.code} 
                    onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                    placeholder="e.g. SAVE10"
                 />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                   <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select 
                            className="w-full border border-slate-600 rounded p-2 bg-slate-700 text-white placeholder-slate-400"
                            value={formData.type}
                            onChange={e => setFormData({...formData, type: e.target.value as 'percent' | 'amount'})}
                        >
                            <option value="amount">Fixed Amount</option>
                            <option value="percent">Percentage (%)</option>
                        </select>
                   </div>
                   <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                        <input 
                            required 
                            type="number" 
                            min="0"
                            className="w-full border border-slate-600 rounded p-2 bg-slate-700 text-white placeholder-slate-400" 
                            value={formData.value} 
                            onChange={e => setFormData({...formData, value: parseFloat(e.target.value)})} 
                        />
                   </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                   <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Point Cost (0 = Free)</label>
                        <input 
                            required 
                            type="number" 
                            min="0"
                            className="w-full border border-slate-600 rounded p-2 bg-slate-700 text-white placeholder-slate-400" 
                            value={formData.pointCost} 
                            onChange={e => setFormData({...formData, pointCost: parseInt(e.target.value)})} 
                        />
                   </div>
                   <div className="flex items-end">
                       <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg w-full bg-gray-50 hover:bg-gray-100">
                           <input 
                                type="checkbox" 
                                className="w-5 h-5 text-amber-600 rounded"
                                checked={formData.isActive}
                                onChange={e => setFormData({...formData, isActive: e.target.checked})}
                           />
                           <span className="text-sm font-medium text-gray-700">Active</span>
                       </label>
                   </div>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                 <textarea 
                    className="w-full border border-slate-600 rounded p-2 h-20 bg-slate-700 text-white placeholder-slate-400" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    placeholder="e.g. 10% off for new customers"
                 />
               </div>
               
               <div className="flex gap-2 pt-4 border-t mt-4">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border rounded hover:bg-gray-50">Cancel</button>
                 <button type="submit" className="flex-1 py-2 bg-amber-600 text-white rounded hover:bg-amber-700">Save</button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionManager;
