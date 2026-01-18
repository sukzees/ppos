
import React, { useState } from 'react';
import { MenuItem, RecipeItem } from '../../types';
import { useStore } from '../../context/StoreContext';
import { Edit, Trash2, Plus, Image as ImageIcon, Scale, X, Info, AlertTriangle, Save, ChefHat, Wine, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const MenuManager: React.FC = () => {
  const { menu, categories, inventory, addMenuItem, updateMenuItem, deleteMenuItem, settings } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStation, setFilterStation] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Sort State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Image Hover State
  const [hoverImage, setHoverImage] = useState<{ url: string; x: number; y: number } | null>(null);

  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '', price: 0, categoryId: '', isAvailable: true, image: '', recipe: [], station: undefined
  });

  // Recipe Form State
  const [selectedIngredient, setSelectedIngredient] = useState<string>('');
  const [ingredientQty, setIngredientQty] = useState<number>(0);

  const selectedInventoryItem = inventory.find(i => i.id === selectedIngredient);

  const handleOpenModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      // Default to first category if available
      const defaultCat = categories.length > 0 ? categories[0].id : '';
      setFormData({ name: '', price: 0, categoryId: defaultCat, isAvailable: true, image: 'https://picsum.photos/200/200', recipe: [], station: undefined });
    }
    setSelectedIngredient('');
    setIngredientQty(0);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert empty string station to undefined
    const itemToSave = {
        ...formData,
        station: formData.station === undefined || formData.station === '' as any ? undefined : formData.station
    };

    if (editingItem) {
      updateMenuItem({ ...editingItem, ...itemToSave } as MenuItem);
    } else {
      const newItem = { ...itemToSave, id: Date.now().toString() } as MenuItem;
      addMenuItem(newItem);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      deleteMenuItem(id);
    }
  };

  const addIngredientToRecipe = () => {
    if (!selectedIngredient || ingredientQty <= 0) return;
    
    const currentRecipe = formData.recipe || [];
    // Check if exists
    const exists = currentRecipe.find(r => r.inventoryItemId === selectedIngredient);
    
    let newRecipe;
    if (exists) {
      newRecipe = currentRecipe.map(r => r.inventoryItemId === selectedIngredient ? { ...r, quantity: ingredientQty } : r);
    } else {
      newRecipe = [...currentRecipe, { inventoryItemId: selectedIngredient, quantity: ingredientQty }];
    }
    
    setFormData({ ...formData, recipe: newRecipe });
    setSelectedIngredient('');
    setIngredientQty(0);
  };

  const updateIngredientQuantity = (invId: string, newQty: number) => {
      setFormData(prev => ({
          ...prev,
          recipe: prev.recipe?.map(r => r.inventoryItemId === invId ? { ...r, quantity: Math.max(0, newQty) } : r)
      }));
  };

  const removeIngredientFromRecipe = (invId: string) => {
    setFormData({ ...formData, recipe: (formData.recipe || []).filter(r => r.inventoryItemId !== invId) });
  };

  const calculateTotalCost = () => {
    return (formData.recipe || []).reduce((acc, r) => {
      const inv = inventory.find(i => i.id === r.inventoryItemId);
      return acc + ((inv?.costPerUnit || 0) * r.quantity);
    }, 0);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
      if (sortConfig?.key !== key) return <ArrowUpDown size={14} className="text-gray-400" />;
      if (sortConfig.direction === 'asc') return <ArrowUp size={14} className="text-amber-600" />;
      return <ArrowDown size={14} className="text-amber-600" />;
  };

  const handleImageEnter = (e: React.MouseEvent<HTMLImageElement>, url: string) => {
      const rect = e.currentTarget.getBoundingClientRect();
      let x = rect.right + 15;
      let y = rect.top - 100; // Center vertically relative to thumbnail row roughly

      // Boundary checks
      if (x + 260 > window.innerWidth) {
          x = rect.left - 275; // Move to left if no space on right
      }
      if (y < 10) y = 10;
      if (y + 260 > window.innerHeight) y = window.innerHeight - 270;

      setHoverImage({ url, x, y });
  };

  // Filter Logic
  const filteredMenu = menu.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || item.categoryId === filterCategory;
      
      const matchesStatus = filterStatus === 'All' 
          ? true 
          : filterStatus === 'Available' ? item.isAvailable : !item.isAvailable;

      // Determine effective station (Item override > Category Default)
      const effectiveStation = item.station 
          ? item.station 
          : (settings.categoryMapping?.[item.categoryId || ''] === 'bar' ? 'bar' : 'kitchen');
      
      const matchesStation = filterStation === 'All'
          ? true
          : effectiveStation === filterStation.toLowerCase();

      return matchesSearch && matchesCategory && matchesStatus && matchesStation;
  });

  // Sort Logic
  const sortedMenu = [...filteredMenu].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    let aVal: any = a[key as keyof MenuItem];
    let bVal: any = b[key as keyof MenuItem];

    // Helper for computed values
    const getStation = (m: MenuItem) => m.station || (settings.categoryMapping?.[m.categoryId] === 'bar' ? 'bar' : 'kitchen');
    const getCatName = (m: MenuItem) => categories.find(c => c.id === m.categoryId)?.name || '';

    switch(key) {
        case 'name':
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
            break;
        case 'category':
            aVal = getCatName(a).toLowerCase();
            bVal = getCatName(b).toLowerCase();
            break;
        case 'station':
            aVal = getStation(a);
            bVal = getStation(b);
            break;
        case 'price':
            aVal = a.price;
            bVal = b.price;
            break;
        case 'recipe':
            aVal = a.recipe?.length || 0;
            bVal = b.recipe?.length || 0;
            break;
        case 'status':
            aVal = a.isAvailable ? 1 : 0;
            bVal = b.isAvailable ? 1 : 0;
            break;
        default:
            break;
    }

    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Menu Management</h1>
          <p className="text-slate-500">Manage your dishes, prices, availability and recipes.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
        >
          <Plus size={20} /> Add New Menu
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border mb-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
              <input 
                  type="text" 
                  placeholder="Search menu items..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-700 text-white placeholder-slate-400" 
              />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
              <Filter size={20} className="text-slate-400 shrink-0" />
              
              <select 
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="border border-slate-600 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 min-w-[140px]"
              >
                  <option value="All">All Categories</option>
                  {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
              </select>

              <select 
                  value={filterStation}
                  onChange={(e) => setFilterStation(e.target.value)}
                  className="border border-slate-600 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                  <option value="All">All Stations</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Bar">Bar</option>
              </select>

              <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-slate-600 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                  <option value="All">All Status</option>
                  <option value="Available">Available</option>
                  <option value="Out of Stock">Out of Stock</option>
              </select>
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Image</th>
              <th 
                className="p-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">Name {getSortIcon('name')}</div>
              </th>
              <th 
                className="p-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center gap-1">Category {getSortIcon('category')}</div>
              </th>
              <th 
                className="p-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                onClick={() => handleSort('station')}
              >
                <div className="flex items-center gap-1">Station {getSortIcon('station')}</div>
              </th>
              <th 
                className="p-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center gap-1">Price {getSortIcon('price')}</div>
              </th>
              <th 
                className="p-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                onClick={() => handleSort('recipe')}
              >
                <div className="flex items-center gap-1">Recipe {getSortIcon('recipe')}</div>
              </th>
              <th 
                className="p-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">Status {getSortIcon('status')}</div>
              </th>
              <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedMenu.map((item) => {
              // Recalculate effective station for display to match filter logic visual
              const effectiveStation = item.station 
                  ? item.station 
                  : (settings.categoryMapping?.[item.categoryId || ''] === 'bar' ? 'bar' : 'kitchen');

              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-12 h-12 rounded-lg object-cover bg-gray-200 cursor-zoom-in hover:ring-2 hover:ring-amber-400 transition-all"
                        onMouseEnter={(e) => handleImageEnter(e, item.image)}
                        onMouseLeave={() => setHoverImage(null)}
                    />
                  </td>
                  <td className="p-4 font-medium">{item.name}</td>
                  <td className="p-4">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold uppercase">
                      {categories.find(c => c.id === item.categoryId)?.name || 'Unknown'}
                    </span>
                  </td>
                  <td className="p-4">
                      <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded w-fit ${effectiveStation === 'bar' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                          {effectiveStation === 'bar' ? <Wine size={12}/> : <ChefHat size={12}/>}
                          {effectiveStation === 'bar' ? 'Bar' : 'Kitchen'}
                      </span>
                  </td>
                  <td className="p-4 font-medium">{settings.currency}{item.price.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${item.recipe && item.recipe.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                      {item.recipe?.length || 0} Ingredients
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.isAvailable ? 'Available' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => handleOpenModal(item)} className="text-blue-600 hover:text-blue-800 p-1"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18} /></button>
                  </td>
                </tr>
              );
            })}
            {sortedMenu.length === 0 && (
                <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                        No menu items found.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Floating Image Preview */}
      {hoverImage && (
          <div 
              className="fixed z-50 bg-white p-2 rounded-xl shadow-2xl border border-slate-200 pointer-events-none animate-fade-in"
              style={{ 
                  left: hoverImage.x, 
                  top: hoverImage.y,
                  width: '260px',
                  height: '260px'
              }}
          >
              <img src={hoverImage.url} className="w-full h-full object-cover rounded-lg" alt="Preview" />
          </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">{editingItem ? 'Edit Menu' : 'New Menu'}</h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                   <h3 className="font-bold text-gray-700 border-b pb-2">Basic Info</h3>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Menu Name</label>
                    <input required type="text" className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price ({settings.currency})</label>
                      <input required type="number" className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target Station</label>
                      <select 
                        className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400" 
                        value={formData.station || ''} 
                        onChange={e => setFormData({...formData, station: e.target.value as 'kitchen' | 'bar' | undefined})}
                      >
                        <option value="">Default (Category Setting)</option>
                        <option value="kitchen">Kitchen</option>
                        <option value="bar">Counter Bar</option>
                      </select>
                      <p className="text-[10px] text-gray-500 mt-1">Override the default station for this specific item.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                    <div className="flex gap-2">
                      <input type="text" className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
                      <div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center text-gray-400 shrink-0">
                        <ImageIcon size={20} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="avail" checked={formData.isAvailable} onChange={e => setFormData({...formData, isAvailable: e.target.checked})} className="w-4 h-4 text-amber-600 rounded" />
                    <label htmlFor="avail" className="text-sm font-medium text-gray-700">Available to order</label>
                  </div>
                </div>

                {/* Recipe Configuration */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-700 border-b pb-2 flex items-center gap-2">
                    <Scale size={18} /> Recipe Configuration
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="grid grid-cols-12 gap-2 items-end">
                       <div className="col-span-6">
                         <label className="text-xs text-gray-500 mb-1 block">Ingredient</label>
                         <select 
                           className="w-full border border-slate-600 rounded px-2 py-2 text-sm bg-slate-700 text-white placeholder-slate-400"
                           value={selectedIngredient}
                           onChange={e => setSelectedIngredient(e.target.value)}
                         >
                           <option value="">Select Ingredient</option>
                           {inventory.map(inv => (
                             <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>
                           ))}
                         </select>
                       </div>
                       <div className="col-span-4">
                         <label className="text-xs text-gray-500 mb-1 block">Quantity {selectedInventoryItem ? `(${selectedInventoryItem.unit})` : ''}</label>
                         <input 
                           type="number" 
                           min="0"
                           step="any"
                           placeholder="Qty" 
                           className="w-full border border-slate-600 rounded px-2 py-2 text-sm bg-slate-700 text-white placeholder-slate-400"
                           value={ingredientQty}
                           onChange={e => setIngredientQty(Number(e.target.value))}
                         />
                       </div>
                       <div className="col-span-2">
                         <button 
                          type="button" 
                          onClick={addIngredientToRecipe}
                          disabled={!selectedIngredient || ingredientQty <= 0}
                          className="w-full bg-amber-600 text-white py-2 rounded text-sm hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center"
                         >
                             <Plus size={16} />
                         </button>
                       </div>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto mt-2">
                      {(formData.recipe || []).length === 0 && (
                        <div className="text-center py-4 bg-white rounded border border-dashed">
                           <p className="text-xs text-gray-400">No ingredients linked yet.</p>
                        </div>
                      )}
                      {(formData.recipe || []).map((r, idx) => {
                        const inv = inventory.find(i => i.id === r.inventoryItemId);
                        const cost = (inv?.costPerUnit || 0) * r.quantity;
                        const hasInsufficientStock = (inv?.quantity || 0) < r.quantity;

                        return (
                          <div key={idx} className="flex flex-col bg-white p-3 rounded border shadow-sm">
                             <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-sm font-bold text-slate-700">{inv?.name || 'Unknown Item'}</p>
                                    <p className="text-xs text-gray-400">
                                        Current Stock: {inv?.quantity} {inv?.unit}
                                        {hasInsufficientStock && <span className="text-red-500 font-bold ml-1">(Low!)</span>}
                                    </p>
                                </div>
                                <button type="button" onClick={() => removeIngredientFromRecipe(r.inventoryItemId)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                             </div>
                             
                             <div className="flex items-center gap-3">
                                 <div className="flex-1">
                                     <div className="flex items-center gap-2">
                                        <label className="text-xs text-gray-500">Required:</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            step="any"
                                            value={r.quantity}
                                            onChange={(e) => updateIngredientQuantity(r.inventoryItemId, parseFloat(e.target.value) || 0)}
                                            className="w-20 border border-slate-600 rounded px-2 py-1 text-sm font-bold text-center bg-slate-700 text-white placeholder-slate-400"
                                        />
                                        <span className="text-xs font-bold text-gray-500">{inv?.unit}</span>
                                     </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-xs font-medium text-slate-600">Cost</p>
                                    <p className="text-sm font-bold text-amber-600">{settings.currency}{cost.toLocaleString()}</p>
                                 </div>
                             </div>
                             
                             {hasInsufficientStock && (
                                 <div className="mt-2 flex items-center gap-1 text-xs text-red-600 bg-red-50 p-1 rounded">
                                     <AlertTriangle size={12} />
                                     <span>Insufficient stock to make even 1 unit.</span>
                                 </div>
                             )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Cost Summary */}
                    {(formData.recipe || []).length > 0 && (
                        <div className="text-right text-sm text-gray-600 pt-2 border-t mt-2 flex justify-between items-center">
                          <span>Total Cost per Dish:</span>
                          <span className="font-bold text-slate-800 text-lg">{settings.currency}{calculateTotalCost().toLocaleString()}</span>
                        </div>
                    )}
                  </div>
                  
                  <div className="flex items-start gap-2 text-xs text-gray-500 bg-blue-50 p-2 rounded">
                    <Info size={14} className="mt-0.5 text-blue-500 shrink-0" />
                    <p>Ingredients defined here will be automatically deducted from inventory when an order is served.</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 rounded-lg border hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 font-semibold flex justify-center items-center gap-2">
                    <Save size={18} /> Save Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;
