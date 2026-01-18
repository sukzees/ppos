
import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Category } from '../../types';
import { Plus, Trash2, Edit, Tags } from 'lucide-react';

const CategoryManager: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [formData, setFormData] = useState<Partial<Category>>({
    name: ''
  });

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData(category);
    } else {
      setEditingCategory(null);
      setFormData({ name: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategory({ ...editingCategory, ...formData } as Category);
    } else {
      const newCategory = { ...formData, id: `cat_${Date.now()}` } as Category;
      addCategory(newCategory);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this category?')) {
      deleteCategory(id);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Category Management</h1>
          <p className="text-slate-500">Organize your menu items into categories.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
        >
          <Plus size={20} /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(category => (
          <div key={category.id} className="bg-white rounded-xl shadow-sm border p-6 flex justify-between items-center">
             <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-lg flex items-center justify-center text-amber-600 bg-amber-50">
                     <Tags size={24} />
                 </div>
                 <div>
                     <h3 className="font-bold text-lg text-slate-800">{category.name}</h3>
                     <p className="text-xs text-gray-500 font-mono">ID: {category.id}</p>
                 </div>
             </div>
             <div className="flex gap-2">
                 <button onClick={() => handleOpenModal(category)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"><Edit size={18} /></button>
                 <button onClick={() => handleDelete(category.id)} className="p-2 text-red-500 hover:bg-red-50 rounded transition"><Trash2 size={18} /></button>
             </div>
          </div>
        ))}
        {categories.length === 0 && (
             <div className="col-span-full text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                 <p>No categories configured.</p>
             </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
             <h2 className="text-xl font-bold mb-4">{editingCategory ? 'Edit Category' : 'New Category'}</h2>
             <form onSubmit={handleSave} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                 <input 
                    required 
                    type="text" 
                    className="w-full border border-slate-600 rounded p-2 bg-slate-700 text-white placeholder-slate-400" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g. Appetizers"
                 />
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

export default CategoryManager;
