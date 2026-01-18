
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ClipboardList, 
  Store, 
  Users, 
  CalendarDays, 
  Settings, 
  BarChart3,
  LogOut,
  Armchair,
  Package,
  UserCog,
  Map,
  ChevronDown,
  ChevronUp,
  Tags,
  TicketPercent,
  Wine,
  History,
  ChefHat
} from 'lucide-react';
import { Permission, OrderStatus } from '../types';

interface NavItem {
  to: string;
  icon: any;
  label: string;
  permission?: Permission;
  badge?: number;
  children?: { to: string; label: string; icon: any }[];
}

const AdminSidebar: React.FC = () => {
  const { currentUser, logout, hasPermission, getRole, orders } = useStore();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  
  const userRole = currentUser ? getRole(currentUser.roleId) : null;

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    if(confirm('Are you sure you want to logout?')) {
       logout();
       navigate('/admin/login');
    }
  };

  const toggleExpand = (label: string) => {
    if (expandedItems.includes(label)) {
      setExpandedItems(prev => prev.filter(item => item !== label));
    } else {
      setExpandedItems(prev => [...prev, label]);
    }
  };

  const barOrderCount = orders.filter(o => 
      o.barStatus && (o.barStatus === OrderStatus.PENDING || o.barStatus === OrderStatus.COOKING)
  ).length;

  const kitchenOrderCount = orders.filter(o => 
      o.kitchenStatus && o.kitchenStatus === OrderStatus.PENDING
  ).length;

  const navItems: NavItem[] = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', permission: 'view_dashboard' },
    { to: '/admin/pos', icon: Store, label: 'POS System', permission: 'access_pos' },
    { to: '/admin/orders', icon: ClipboardList, label: 'Kitchen Orders', permission: 'view_orders', badge: kitchenOrderCount },
    { to: '/admin/bar', icon: Wine, label: 'Counter Bar', permission: 'view_bar', badge: barOrderCount },
    { to: '/admin/history', icon: History, label: 'Order History', permission: 'view_orders' },
    { 
      to: '/admin/tables', 
      icon: Armchair, 
      label: 'Tables', 
      permission: 'manage_tables',
      children: [
        { to: '/admin/tables', label: 'Table List', icon: Armchair },
        { to: '/admin/tables/zones', label: 'Zone Management', icon: Map }
      ]
    },
    { 
      to: '/admin/menu', 
      icon: UtensilsCrossed, 
      label: 'Menu', 
      permission: 'manage_menu',
      children: [
        { to: '/admin/menu', label: 'Menu Items', icon: UtensilsCrossed },
        { to: '/admin/menu/categories', label: 'Categories', icon: Tags }
      ]
    },
    { to: '/admin/inventory', icon: Package, label: 'Inventory', permission: 'manage_inventory' },
    { to: '/admin/promotions', icon: TicketPercent, label: 'Promotions', permission: 'manage_promotions' },
    { to: '/admin/bookings', icon: CalendarDays, label: 'Bookings', permission: 'manage_bookings' },
    { to: '/admin/customers', icon: Users, label: 'Customers', permission: 'manage_customers' },
    { to: '/admin/employees', icon: UserCog, label: 'Employees', permission: 'manage_employees' },
    { to: '/admin/reports', icon: BarChart3, label: 'Reports', permission: 'view_reports' },
    { to: '/admin/settings', icon: Settings, label: 'Settings', permission: 'manage_settings' },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto z-50">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                <ChefHat size={20} className="text-white" />
            </div>
            <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Siam<span className="text-primary-500">Savory</span></h1>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Admin Panel</p>
            </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-900 text-primary-200 flex items-center justify-center font-bold text-xs border border-primary-700">
                {userRole?.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
                 <p className="text-sm font-bold text-white truncate">{currentUser?.name}</p>
                 <p className="text-xs text-slate-400 truncate">{userRole?.name}</p>
            </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 pb-4">
        {navItems.map((item) => {
          if (item.permission && !hasPermission(item.permission)) return null;

          if (item.children) {
             const isExpanded = expandedItems.includes(item.label);
             return (
               <div key={item.label} className="mb-1">
                 <button
                   onClick={() => toggleExpand(item.label)}
                   className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                       isExpanded ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                   }`}
                 >
                   <div className="flex items-center gap-3">
                     <item.icon size={18} className={`transition-colors ${isExpanded ? 'text-primary-400' : 'text-slate-500 group-hover:text-white'}`} />
                     <span className="font-medium text-sm">{item.label}</span>
                   </div>
                   {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                 </button>
                 
                 <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-48 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                   <div className="ml-4 pl-3 border-l border-slate-700 space-y-1">
                     {item.children.map(child => (
                       <NavLink
                         key={child.to}
                         to={child.to}
                         end={true}
                         className={({ isActive }) =>
                           `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-xs font-medium ${
                             isActive
                               ? 'text-primary-400 bg-primary-500/10'
                               : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                           }`
                         }
                       >
                         {({ isActive }) => (
                           <>
                             <child.icon size={14} className={isActive ? 'text-primary-400' : 'text-slate-500 group-hover:text-white'} />
                             <span>{child.label}</span>
                           </>
                         )}
                       </NavLink>
                     ))}
                   </div>
                 </div>
               </div>
             );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group mb-1 ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className={`transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.label === 'Counter Bar' ? 'bg-purple-500 text-white' : 'bg-red-500 text-white shadow-sm'
                    }`}>
                        {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm font-medium"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
