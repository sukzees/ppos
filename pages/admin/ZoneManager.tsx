
import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Zone } from '../../types';
import { Plus, Trash2, Edit, Map } from 'lucide-react';

const ZoneManager: React.FC = () => {
  const { zones, addZone, updateZone, deleteZone } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  
  const [formData, setFormData] = useState<Partial<Zone>>({
    name: '', color: 'bg-gray-100'
  });

  const handleOpenModal = (zone?: Zone) => {
    if (zone) {
      setEditingZone(zone);
      setFormData(zone);
    } else {
      setEditingZone(null);
      setFormData({ name: '', color: 'bg-gray-100' });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingZone) {
      updateZone({ ...editingZone, ...formData } as Zone);
    } else {
      const newZone = { ...formData, id: `z${Date.now()}` } as Zone;
      addZone(newZone);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this zone?')) {
      deleteZone(id);
    }
  };

  const colors = [
    { label: 'Gray', value: 'bg-gray-100' },
    { label: 'Red', value: 'bg-red-100' },
    { label: 'Orange', value: 'bg-orange-100' },
    { label: 'Amber', value: 'bg-amber-100' },
    { label: 'Yellow', value: 'bg-yellow-100' },
    { label: 'Green', value: 'bg-green-100' },
    { label: 'Blue', value: 'bg-blue-100' },
    { label: 'Indigo', value: 'bg-indigo-100' },
    { label: 'Purple', value: 'bg-purple-100' },
    { label: 'Pink', value: 'bg-pink-100' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Zone Management</h1>
          <p className="text-slate-500">Configure restaurant areas and sections.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
        >
          <Plus size={20} /> Add Zone
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {zones.map(zone => (
          <div key={zone.id} className="bg-white rounded-xl shadow-sm border p-6 flex justify-between items-center">
             <div className="flex items-center gap-4">
                 <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-slate-600 ${zone.color}`}>
                     <Map size={24} />
                 </div>
                 <div>
                     <h3 className="font-bold text-lg text-slate-800">{zone.name}</h3>
                     <p className="text-xs text-gray-500 font-mono">ID: {zone.id}</p>
                 </div>
             </div>
             <div className="flex gap-2">
                 <button onClick={() => handleOpenModal(zone)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"><Edit size={18} /></button>
                 <button onClick={() => handleDelete(zone.id)} className="p-2 text-red-500 hover:bg-red-50 rounded transition"><Trash2 size={18} /></button>
             </div>
          </div>
        ))}
        {zones.length === 0 && (
             <div className="col-span-full text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                 <p>No zones configured. Add a zone to get started.</p>
             </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
             <h2 className="text-xl font-bold mb-4">{editingZone ? 'Edit Zone' : 'New Zone'}</h2>
             <form onSubmit={handleSave} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name</label>
                 <input 
                    required 
                    type="text" 
                    className="w-full border border-slate-600 rounded p-2 bg-slate-700 text-white placeholder-slate-400" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g. Patio, Main Hall"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Color Code</label>
                 <div className="grid grid-cols-5 gap-2 mt-1">
                    {colors.map(c => (
                        <button
                           key={c.value}
                           type="button"
                           onClick={() => setFormData({...formData, color: c.value})}
                           className={`w-8 h-8 rounded-full border-2 ${c.value} ${formData.color === c.value ? 'border-slate-800' : 'border-transparent hover:border-gray-300'}`}
                           title={c.label}
                        />
                    ))}
                 </div>
               </div>
               
               <div className="flex gap-2 pt-4">
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

export default ZoneManager;
