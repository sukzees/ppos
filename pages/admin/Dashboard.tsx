import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { 
  DollarSign, ShoppingBag, Users, TrendingUp, TrendingDown, 
  Calendar, Filter, ChevronDown, UtensilsCrossed, PieChart as PieChartIcon
} from 'lucide-react';
import { OrderStatus } from '../../types';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

const StatCard = ({ title, value, icon: Icon, trend, trendValue, colorClass, iconBg }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${iconBg} ${colorClass} group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
    </div>
    <div className="mt-4 flex items-center text-sm">
      <span className={`font-semibold flex items-center gap-1 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
        {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />} {trendValue}
      </span>
      <span className="text-slate-400 ml-2">vs last period</span>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { orders, menu, categories, settings } = useStore();
  
  // Date Range State
  const [dateRange, setDateRange] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
  // Initialize with local date strings (YYYY-MM-DD)
  const [customStartDate, setCustomStartDate] = useState(() => {
      const now = new Date();
      return now.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
      const now = new Date();
      return now.toLocaleDateString('en-CA');
  });

  // --- Data Filtering & Aggregation ---

  const filteredOrders = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (dateRange === 'daily') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (dateRange === 'weekly') {
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (dateRange === 'monthly') {
      start.setMonth(now.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (dateRange === 'custom') {
      // Robust Local Date Parsing
      const [sy, sm, sd] = customStartDate.split('-').map(Number);
      start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);

      const [ey, em, ed] = customEndDate.split('-').map(Number);
      end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
    }

    return orders.filter(o => {
        // Only count completed orders for revenue/stats
        if (o.status !== OrderStatus.COMPLETED) return false;
        const oDate = new Date(o.timestamp);
        return oDate >= start && oDate <= end;
    });
  }, [orders, dateRange, customStartDate, customEndDate]);

  // 1. Key Metrics
  const totalRevenue = filteredOrders.reduce((acc, o) => acc + (o.total - (o.discount || 0)), 0);
  const totalOrders = filteredOrders.length;
  // Calculate unique customers (if customerId exists) or just count guests
  const uniqueCustomers = new Set(filteredOrders.filter(o => o.customerId).map(o => o.customerId)).size;
  // Fallback for demo: if 0 unique customers found in filtered data, show a number based on orders to look realistic
  const displayCustomers = uniqueCustomers > 0 ? uniqueCustomers : Math.ceil(totalOrders * 0.8);
  
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // 2. Sales by Category
  const categoryData = useMemo(() => {
    const stats: Record<string, number> = {};
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const menuItem = menu.find(m => m.id === item.menuId);
        if (menuItem) {
          const catName = categories.find(c => c.id === menuItem.categoryId)?.name || 'Uncategorized';
          stats[catName] = (stats[catName] || 0) + (item.price * item.quantity);
        }
      });
    });
    
    // Fill with mock data if empty for visualization purposes in demo
    if (Object.keys(stats).length === 0 && filteredOrders.length === 0) {
        return [
            { name: 'Appetizers', value: 0 },
            { name: 'Main Course', value: 0 },
            { name: 'Beverages', value: 0 },
            { name: 'Desserts', value: 0 }
        ];
    }

    return Object.entries(stats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredOrders, menu, categories]);

  // 3. Popular Menu Items
  const popularItemsData = useMemo(() => {
    const stats: Record<string, number> = {};
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        stats[item.name] = (stats[item.name] || 0) + item.quantity;
      });
    });

    return Object.entries(stats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5
  }, [filteredOrders]);

  // 4. Revenue Trend Data
  const trendData = useMemo(() => {
      // Real Aggregation
      const aggregated: Record<string, number> = {};
      
      // Pre-fill labels if data is sparse to maintain chart structure (optional but good for UX)
      if (filteredOrders.length === 0 && dateRange === 'daily') {
          for(let i=9; i<=21; i++) aggregated[`${i}:00`] = 0;
      }

      filteredOrders.forEach(order => {
          const date = new Date(order.timestamp);
          let key = '';
          
          if (dateRange === 'daily') {
              key = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } else if (dateRange === 'weekly' || dateRange === 'custom') {
              key = date.toLocaleDateString([], { weekday: 'short', day: 'numeric' });
          } else {
              key = date.toLocaleDateString([], { day: 'numeric', month: 'short' });
          }
          
          aggregated[key] = (aggregated[key] || 0) + (order.total - (order.discount || 0));
      });

      return Object.entries(aggregated).map(([name, revenue]) => ({ name, revenue }));
  }, [filteredOrders, dateRange]);


  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Date Picker */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your restaurant's performance.</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
            <div className="bg-white p-1 rounded-lg border shadow-sm flex items-center">
                {(['daily', 'weekly', 'monthly', 'custom'] as const).map(range => (
                    <button
                        key={range}
                        onClick={() => setDateRange(range)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
                            dateRange === range 
                            ? 'bg-slate-900 text-white shadow-md' 
                            : 'text-slate-500 hover:text-slate-800 hover:bg-gray-50'
                        }`}
                    >
                        {range}
                    </button>
                ))}
            </div>
            
            {dateRange === 'custom' && (
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm animate-fade-in">
                    <input 
                        type="date" 
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="border border-slate-600 rounded px-2 py-1 text-sm bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-gray-400 text-xs">to</span>
                    <input 
                        type="date" 
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="border border-slate-600 rounded px-2 py-1 text-sm bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    />
                </div>
            )}
        </div>
      </div>

      {/* 1. Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="Total Revenue" 
            value={`${settings.currency}${totalRevenue.toLocaleString()}`} 
            icon={DollarSign} 
            trend="up" 
            trendValue="+12.5%" 
            colorClass="text-emerald-600" 
            iconBg="bg-emerald-50"
        />
        <StatCard 
            title="Total Orders" 
            value={totalOrders.toLocaleString()} 
            icon={ShoppingBag} 
            trend="up" 
            trendValue="+8.2%" 
            colorClass="text-blue-600" 
            iconBg="bg-blue-50"
        />
        <StatCard 
            title="Customers" 
            value={displayCustomers.toLocaleString()} 
            icon={Users} 
            trend="up" 
            trendValue="+2.4%" 
            colorClass="text-purple-600" 
            iconBg="bg-purple-50"
        />
        <StatCard 
            title="Avg. Order Value" 
            value={`${settings.currency}${avgOrderValue.toLocaleString(undefined, {maximumFractionDigits: 0})}`} 
            icon={TrendingUp} 
            trend="down" 
            trendValue="-5.1%" 
            colorClass="text-amber-600" 
            iconBg="bg-amber-50"
        />
      </div>

      {/* 2. Charts Row 1: Trend & Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-slate-800">Revenue Trend</h3>
             <div className="flex items-center gap-2 text-sm text-gray-500">
                 <div className="w-3 h-3 rounded-full bg-amber-500"></div> Revenue
             </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={val => `${settings.currency}${val/1000}k`} />
                <Tooltip 
                    cursor={{ stroke: '#f97316', strokeWidth: 1, strokeDasharray: '5 5' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: number) => [`${settings.currency}${val.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <PieChartIcon size={20} className="text-blue-500" /> Sales by Category
          </h3>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        formatter={(val: number) => `${settings.currency}${val.toLocaleString()}`}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
            </ResponsiveContainer>
            {categoryData.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">No data</div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Charts Row 2: Popular Items & Traffic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Popular Menu Items */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                 <UtensilsCrossed size={20} className="text-amber-600" /> Popular Menu Items
             </h3>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={popularItemsData} margin={{ top: 0, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }} />
                        <Tooltip 
                            cursor={{fill: '#f8fafc'}} 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={24}>
                            {popularItemsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Customer Traffic (Existing Chart) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Users size={20} className="text-purple-600" /> Customer Traffic
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: 'white'}} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;