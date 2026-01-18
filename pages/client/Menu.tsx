import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Search } from 'lucide-react';

const Menu: React.FC = () => {
  const { menu, categories, settings } = useStore();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMenu = menu.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.categoryId === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* Header */}
      <div className="bg-slate-900 text-white py-16 px-6 text-center">
        <h1 className="text-4xl font-bold mb-4">Our Menu</h1>
        <p className="text-slate-300 max-w-2xl mx-auto">Discover the authentic tastes of Thailand. From spicy soups to sweet mango sticky rice, we have something for everyone.</p>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8">
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            <button
                onClick={() => setActiveCategory('All')}
                className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
                  activeCategory === 'All' 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
                All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat.id 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search dishes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {filteredMenu.length > 0 ? (
            filteredMenu.map(item => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                <div className="relative h-64 overflow-hidden">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-bold border-2 border-white px-4 py-2 rounded uppercase tracking-widest">Sold Out</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-slate-800">{item.name}</h3>
                    <span className="text-lg font-bold text-amber-600">{settings.currency}{item.price.toLocaleString()}</span>
                  </div>
                  <p className="text-gray-500 text-sm mb-4 min-h-[40px]">{item.description || 'Delicious authentic Thai taste.'}</p>
                  <button 
                    disabled={!item.isAvailable}
                    className={`w-full py-3 rounded-lg font-bold transition-colors ${
                      item.isAvailable 
                        ? 'bg-slate-900 text-white hover:bg-slate-800' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {item.isAvailable ? 'Order at Restaurant' : 'Unavailable'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-gray-500">
              <p className="text-xl">No menu items found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Menu;