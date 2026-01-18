import React from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const ClientNavbar: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  const links = [
    { to: '/', label: 'Home' },
    { to: '/menu', label: 'Menu' },
    { to: '/booking', label: 'Book a Table' },
    { to: '/contact', label: 'Contact Us' },
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <NavLink to="/" className="text-2xl font-bold text-slate-800 tracking-tight">
              Siam<span className="text-amber-600">Savory</span>
            </NavLink>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            {links.map(link => (
              <NavLink 
                key={link.to} 
                to={link.to}
                className={({isActive}) => `text-sm font-medium transition-colors hover:text-amber-600 ${isActive ? 'text-amber-600' : 'text-slate-600'}`}
              >
                {link.label}
              </NavLink>
            ))}
            <NavLink to="/admin" className="px-4 py-2 rounded bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition">
              Staff Login
            </NavLink>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 p-2">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {links.map(link => (
              <NavLink 
                key={link.to} 
                to={link.to}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-amber-600 hover:bg-gray-50"
              >
                {link.label}
              </NavLink>
            ))}
            <NavLink to="/admin" className="block px-3 py-2 rounded-md text-base font-medium text-amber-600 hover:bg-gray-50">
              Staff Login
            </NavLink>
          </div>
        </div>
      )}
    </nav>
  );
};

export default ClientNavbar;