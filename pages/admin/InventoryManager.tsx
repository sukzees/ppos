
import React, { useState } from 'react';
import { InventoryItem } from '../../types';
import { useStore } from '../../context/StoreContext';
import { Plus, Edit, Trash2, AlertTriangle, PackageSearch, DollarSign, Package, History, X, ArrowUpRight, ArrowDownRight, Sliders } from 'lucide-react';

const InventoryManager: React.FC = () => {
  const { inventory, updateInventory, addInventoryItem, deleteInventoryItem, settings } = useStore();
  
  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [viewingHistoryItem, setViewingHistoryItem] = useState<InventoryItem | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);

  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '', quantity: 0, unit: 'kg', minQuantity: 5, costPerUnit: 0, category: 'General'
  });

  const [adjustForm, setAdjustForm] = useState({
    type: 'add' as 'add' | 'remove',
    amount: 0,
    reason: ''
  });

  // Analytics
  const lowStockCount = inventory.filter(i => i.quantity <= i.minQuantity).length;
  const totalValue = inventory.reduce((acc, curr) => acc + (curr.quantity * curr.costPerUnit), 0);
  const totalItems = inventory.length;

  const handleOpenEditModal = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({ name: '', quantity: 0, unit: 'kg', minQuantity: 5, costPerUnit: 0, category: 'General' });
    }
    setIsEditModalOpen(true);
  };

  const handleOpenHistoryModal = (item: InventoryItem) => {
    setViewingHistoryItem(item);
    setIsHistoryModalOpen(true);
  };

  const handleOpenAdjustModal = (item: InventoryItem) => {
    setAdjustingItem(item);
    setAdjustForm({ type: 'add', amount: 0, reason: '' });
    setIsAdjustModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateInventory({ ...editingItem, ...formData } as InventoryItem, "Manual Details Update");
    } else {
      const newItem = { ...formData, id: `inv${Date.now()}` } as InventoryItem;
      addInventoryItem(newItem);
    }
    setIsEditModalOpen(false);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;
    
    const finalAmount = adjustForm.type === 'add' ? adjustForm.amount : -adjustForm.amount;
    const newQuantity = Math.max(0, adjustingItem.quantity + finalAmount);
    
    // Construct reason if empty
    const reason = adjustForm.reason.trim() || (adjustForm.type === 'add' ? 'Manual Restock' : 'Manual Deduction');

    updateInventory({ ...adjustingItem, quantity: newQuantity }, reason);
    setIsAdjustModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this ingredient?')) {
      deleteInventoryItem(id);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Inventory Management</h1>
          <p className="text-slate-500">Track stock levels, ingredients, and costs.</p>
        </div>
        <button 
          onClick={() => handleOpenEditModal()}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
        >
          <Plus size={20} /> Add Ingredient
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Items</p>
            <p className="text-2xl font-bold text-slate-800">{totalItems}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Low Stock Alerts</p>
            <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Value</p>
            <p className="text-2xl font-bold text-slate-800">{settings.currency}{totalValue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-semibold text-gray-600">Ingredient Name</th>
              <th className="p-4 font-semibold text-gray-600">Category</th>
              <th className="p-4 font-semibold text-gray-600">Stock Level</th>
              <th className="p-4 font-semibold text-gray-600">Cost / Unit</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {inventory.map((item) => {
              const isLowStock = item.quantity <= item.minQuantity;
              return (
                <tr key={item.id} className={`hover:bg-gray-50 ${isLowStock ? 'bg-red-50/50' : ''}`}>
                  <td className="p-4">
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      {item.name}
                      {isLowStock && <AlertTriangle size={16} className="text-red-500" />}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 font-medium">{item.category}</span>
                  </td>
                  <td className="p-4">
                    <div className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-slate-700'}`}>
                      {item.quantity} {item.unit}
                    </div>
                    <div className="text-xs text-gray-400">Min: {item.minQuantity} {item.unit}</div>
                  </td>
                  <td className="p-4 text-slate-600">
                    {settings.currency}{item.costPerUnit.toLocaleString()}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => handleOpenAdjustModal(item)} className="p-2 text-amber-600 hover:bg-amber-50 rounded transition" title="Adjust Stock"><Sliders size={18} /></button>
                    <button onClick={() => handleOpenHistoryModal(item)} className="p-2 text-slate-500 hover:bg-slate-100 rounded transition" title="History"><History size={18} /></button>
                    <button onClick={() => handleOpenEditModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition" title="Edit"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded transition" title="Delete"><Trash2 size={18} /></button>
                  </td>
                </tr>
              );
            })}
            {inventory.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500 flex flex-col items-center">
                  <PackageSearch size={48} className="mb-2 opacity-50" />
                  <p>No inventory items found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">{editingItem ? 'Edit Ingredient' : 'New Ingredient'}</h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ingredient Name</label>
                  <input 
                    required
                    type="text" 
                    className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    placeholder="e.g. Meat, Veg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit ({settings.currency})</label>
                  <input 
                    required
                    type="number" 
                    className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400"
                    value={formData.costPerUnit}
                    onChange={e => setFormData({...formData, costPerUnit: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input 
                    required
                    type="number" 
                    className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input 
                    required
                    type="text" 
                    className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400"
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                    placeholder="kg, pcs, cans"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert at</label>
                  <input 
                    required
                    type="number" 
                    className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400"
                    value={formData.minQuantity}
                    onChange={e => setFormData({...formData, minQuantity: Number(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2 rounded-lg border hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 font-semibold">Save Ingredient</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && adjustingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sliders size={24} className="text-amber-600"/> Adjust Stock Level
              </h2>
              <p className="text-sm text-gray-500 mt-1">For {adjustingItem.name}</p>
            </div>
            <form onSubmit={handleSaveAdjustment} className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center mb-4">
                <span className="text-gray-600 font-medium">Current Stock</span>
                <span className="text-xl font-bold">{adjustingItem.quantity} {adjustingItem.unit}</span>
              </div>

              <div className="flex gap-2">
                 <button
                   type="button"
                   onClick={() => setAdjustForm({...adjustForm, type: 'add'})}
                   className={`flex-1 py-2 rounded-lg border font-medium flex items-center justify-center gap-2 ${
                     adjustForm.type === 'add' ? 'bg-green-100 border-green-300 text-green-700' : 'hover:bg-gray-50'
                   }`}
                 >
                   <Plus size={18} /> Add Stock
                 </button>
                 <button
                   type="button"
                   onClick={() => setAdjustForm({...adjustForm, type: 'remove'})}
                   className={`flex-1 py-2 rounded-lg border font-medium flex items-center justify-center gap-2 ${
                     adjustForm.type === 'remove' ? 'bg-red-100 border-red-300 text-red-700' : 'hover:bg-gray-50'
                   }`}
                 >
                   <X size={18} /> Remove Stock
                 </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to {adjustForm.type === 'add' ? 'Add' : 'Remove'}</label>
                <input 
                  required
                  type="number" 
                  min="0"
                  step="any"
                  className="w-full border border-slate-600 rounded-lg px-3 py-2 text-lg font-semibold bg-slate-700 text-white placeholder-slate-400"
                  value={adjustForm.amount}
                  onChange={e => setAdjustForm({...adjustForm, amount: Number(e.target.value)})}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400"
                  value={adjustForm.reason}
                  onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})}
                  placeholder={adjustForm.type === 'add' ? "e.g. Weekly Restock, Purchase" : "e.g. Spoilage, Waste, Correction"}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="flex-1 py-2 rounded-lg border hover:bg-gray-50">Cancel</button>
                <button 
                  type="submit" 
                  className={`flex-1 py-2 rounded-lg text-white font-semibold ${
                    adjustForm.type === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && viewingHistoryItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{viewingHistoryItem.name} History</h2>
                <p className="text-sm text-gray-500">Current Stock: {viewingHistoryItem.quantity} {viewingHistoryItem.unit}</p>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={24} /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {viewingHistoryItem.logs.length === 0 ? (
                <p className="text-center text-gray-500 py-10">No history available for this item.</p>
              ) : (
                <div className="space-y-4">
                  {viewingHistoryItem.logs.map(log => (
                    <div key={log.id} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-semibold text-slate-800">{log.reason}</p>
                        <p className="text-xs text-gray-500">{log.date.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                         <div className={`flex items-center justify-end gap-1 font-bold ${log.changeAmount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                           {log.changeAmount > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                           {log.changeAmount > 0 ? '+' : ''}{log.changeAmount} {viewingHistoryItem.unit}
                         </div>
                         <p className="text-xs text-gray-400">Balance: {log.finalQuantity} {viewingHistoryItem.unit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50 border-t text-center">
               <button onClick={() => setIsHistoryModalOpen(false)} className="text-sm text-gray-600 hover:text-gray-900">Close History</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
