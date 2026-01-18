import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Star, Clock, MapPin, Phone } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const Home: React.FC = () => {
  const { menu, settings } = useStore();

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center text-center text-white">
        <div className="absolute inset-0 bg-slate-900/60 z-10"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80")' }}
        ></div>
        
        <div className="relative z-20 max-w-3xl px-6">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">SiamSavory</h1>
          <p className="text-xl md:text-2xl mb-8 font-light text-gray-200">Authentic Thai Cuisine in the Heart of the City</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/menu" className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-transform hover:scale-105">
              View Menu
            </Link>
            <Link to="/booking" className="bg-white hover:bg-gray-100 text-slate-900 px-8 py-4 rounded-full font-bold text-lg transition-transform hover:scale-105">
              Book a Table
            </Link>
          </div>
        </div>
      </section>

      {/* Info Bar */}
      <div className="bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-sm border-l-4 border-amber-500">
            <div className="p-3 bg-amber-100 rounded-full text-amber-600"><Clock /></div>
            <div>
              <h3 className="font-bold text-lg">Opening Hours</h3>
              <p className="text-gray-500">Daily: 10:00 AM - 10:00 PM</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-sm border-l-4 border-amber-500">
            <div className="p-3 bg-amber-100 rounded-full text-amber-600"><MapPin /></div>
            <div>
              <h3 className="font-bold text-lg">Location</h3>
              <p className="text-gray-500">123 Sukhumvit Road, Bangkok</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-sm border-l-4 border-amber-500">
            <div className="p-3 bg-amber-100 rounded-full text-amber-600"><Phone /></div>
            <div>
              <h3 className="font-bold text-lg">Contact Us</h3>
              <p className="text-gray-500">02-123-4567</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Menu */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-amber-600 font-bold tracking-wider uppercase">Chef's Selection</span>
          <h2 className="text-4xl font-bold text-slate-800 mt-2">Recommended Dishes</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {menu.slice(0, 3).map((item) => (
            <div key={item.id} className="group rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="relative h-64 overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full font-bold text-slate-800 shadow-sm">
                  {settings.currency}{item.price.toLocaleString()}
                </div>
              </div>
              <div className="p-6 bg-white">
                <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                <p className="text-gray-500 mb-4 line-clamp-2">{item.description}</p>
                <div className="flex items-center text-amber-500 gap-1 text-sm font-medium">
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <span className="text-gray-400 ml-1">(24 reviews)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
           <Link to="/menu" className="inline-flex items-center text-amber-600 font-bold hover:text-amber-700">
             View Full Menu <ChevronRight size={20} />
           </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;