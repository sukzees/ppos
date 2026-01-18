import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { 
  DollarSign, ShoppingBag, TrendingUp, AlertCircle, 
  Calendar, Download, ChevronDown 
} from 'lucide-react';
import { OrderStatus } from '../../types';

const COLORS = ['#d97706', '#2563eb', '#16a34a', '#dc2626', '#9333ea', '#8b5cf6', '#64748b'];

const StatCard = ({ title, value, subtext, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h3>
      <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${subtext.includes('+') ? 'text-green-600' : subtext.includes('-') ? 'text-red-500' : 'text-slate-400'}`}>
        {subtext.includes('+') || subtext.includes('-') ? <TrendingUp size={12} /> : null}
        {subtext}
      </p>
    </div>
    <div className={`p-3 rounded-lg ${color} text-white shadow-sm`}>
      <Icon size={24} />
    </div>
  </div>
);

const Reports: React.FC = () => {
  const { orders, menu, categories, settings } = useStore();
  
  // Date Range State
  const [dateRange, setDateRange] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
  // Initialize with local date strings (YYYY-MM-DD)
  const [customStartDate, setCustomStartDate] = useState(() => {
      const now = new Date();
      return now.toLocaleDateString('en-CA');
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
      const now = new Date();
      return now.toLocaleDateString('en-CA');
  });

  // --- 1. Filter Orders based on Range ---
  const filteredOrders = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (dateRange === 'daily') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (dateRange === 'weekly') {
      // Last 7 days including today
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (dateRange === 'monthly') {
      // Last 30 days
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (dateRange === 'custom') {
      // Robust Local Date Parsing
      const [sy, sm, sd] = customStartDate.split('-').map(Number);
      start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);

      const [ey, em, ed] = customEndDate.split('-').map(Number);
      end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
    }

    // Filter and Sort by Date Ascending for Charts
    return orders.filter(o => {
        const oDate = new Date(o.timestamp);
        return oDate >= start && oDate <= end;
    }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [orders, dateRange, customStartDate, customEndDate]);

  // --- 2. Calculate Metrics from Filtered Data ---
  const completedOrders = filteredOrders.filter(o => o.status === OrderStatus.COMPLETED);
  
  const totalRevenue = completedOrders.reduce((acc, o) => acc + (o.total - (o.discount || 0)), 0);
  const totalOrdersCount = completedOrders.length;
  const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
  const cancelledOrders = filteredOrders.filter(o => o.status === OrderStatus.CANCELLED).length;

  // --- 3. Aggregate Data for Charts ---
  
  // Revenue Chart Data
  const salesData = useMemo(() => {
      const map = new Map<string, number>();
      
      // Initialize skeleton based on range
      if (dateRange === 'daily') {
          for(let i=0; i<=23; i++) { // 0 to 23 hours
              map.set(`${i}:00`, 0);
          }
      } 
      // For Weekly/Monthly we build dynamically based on data, 
      // but to ensure continuity we could pre-fill days, but simple aggregation is often enough.

      completedOrders.forEach(order => {
          const date = new Date(order.timestamp);
          let key = '';
          
          if (dateRange === 'daily') {
              key = `${date.getHours()}:00`;
          } else if (dateRange === 'weekly') {
              key = date.toLocaleDateString('en-US', { weekday: 'short' }); // e.g., Mon, Tue
          } else {
              // Monthly & Custom view
              // Use Mon DD format (e.g. Oct 27) for better readability on x-axis
              key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }
          
          const current = map.get(key) || 0;
          map.set(key, current + (order.total - (order.discount || 0)));
      });

      // If map is empty (no sales), return empty array
      if (map.size === 0 && dateRange !== 'daily') return [];

      return Array.from(map.entries()).map(([name, revenue]) => ({ name, revenue }));
  }, [completedOrders, dateRange]);

  // Sales by Category
  const categorySales = useMemo(() => {
    const stats: Record<string, number> = {};
    completedOrders.forEach(order => {
      order.items.forEach(item => {
        const menuItem = menu.find(m => m.id === item.menuId);
        if (menuItem) {
          const catName = categories.find(c => c.id === menuItem.categoryId)?.name || 'Other';
          stats[catName] = (stats[catName] || 0) + (item.quantity * item.price);
        }
      });
    });
    
    // Convert to array and sort
    let entries = Object.entries(stats)
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value);

    // Limit to top 5 categories, group others
    if (entries.length > 5) {
        const top5 = entries.slice(0, 5);
        const othersValue = entries.slice(5).reduce((sum, e) => sum + e.value, 0);
        if (othersValue > 0) {
            top5.push({ name: 'Others', value: othersValue });
        }
        entries = top5;
    }
    
    return entries;
  }, [completedOrders, menu, categories]);

  // Top Items
  const topItems = useMemo(() => {
    const stats: Record<string, number> = {};
    completedOrders.forEach(order => {
      order.items.forEach(item => {
        stats[item.name] = (stats[item.name] || 0) + item.quantity;
      });
    });

    return Object.entries(stats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [completedOrders]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Date Picker */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Reports & Analytics</h1>
          <p className="text-slate-500">Business performance and sales insights.</p>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <div className="bg-white p-1 rounded-lg border shadow-sm flex items-center">
             {(['daily', 'weekly', 'monthly', 'custom'] as const).map(range => (
                 <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-4 py-2 rounded-md text-sm font-bold capitalize transition-all cursor-pointer ${
                        dateRange === range 
                        ? 'bg-slate-900 text-white shadow-md' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-gray-100'
                    }`}
                 >
                    {range}
                 </button>
             ))}
          </div>
          
          {dateRange === 'custom' && (
              <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm animate-fade-in">
                  <div className="flex items-center gap-2 px-2 py-1 bg-slate-700 rounded border border-slate-600 hover:bg-slate-600 transition-colors group">
                      <Calendar size={16} className="text-white" />
                      <input 
                          type="date" 
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="bg-transparent text-sm text-white outline-none cursor-pointer font-medium [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:hover:opacity-80 [&::-webkit-calendar-picker-indicator]:p-0.5"
                      />
                  </div>
                  <span className="text-gray-400 text-xs font-medium">to</span>
                  <div className="flex items-center gap-2 px-2 py-1 bg-slate-700 rounded border border-slate-600 hover:bg-slate-600 transition-colors group">
                      <Calendar size={16} className="text-white" />
                      <input 
                          type="date" 
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="bg-transparent text-sm text-white outline-none cursor-pointer font-medium [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:hover:opacity-80 [&::-webkit-calendar-picker-indicator]:p-0.5"
                      />
                  </div>
              </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`${settings.currency}${totalRevenue.toLocaleString()}`} 
          subtext="selected period" 
          icon={DollarSign} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Total Orders" 
          value={totalOrdersCount.toLocaleString()} 
          subtext="completed" 
          icon={ShoppingBag} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Avg. Order Value" 
          value={`${settings.currency}${avgOrderValue.toLocaleString(undefined, {maximumFractionDigits: 0})}`} 
          subtext="per order" 
          icon={TrendingUp} 
          color="bg-amber-500" 
        />
        <StatCard 
          title="Cancelled Orders" 
          value={cancelledOrders.toLocaleString()} 
          subtext="voided" 
          icon={AlertCircle} 
          color="bg-red-500" 
        />
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Chart (Left 2/3) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h3 className="text-lg font-bold text-slate-800">Revenue Analytics</h3>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div> Sales
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-0 relative">
            {salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94a3b8', fontSize: 12}} 
                        dy={10} 
                        minTickGap={30}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94a3b8', fontSize: 12}} 
                        tickFormatter={(value) => `${value/1000}k`} 
                    />
                    <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${settings.currency}${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#f59e0b" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorRev)" 
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#d97706' }}
                    />
                </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <p className="text-sm">No data available for this period</p>
                </div>
            )}
          </div>
        </div>

        {/* Sales by Category (Right 1/3) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 mb-2 shrink-0">Sales by Category</h3>
          <div className="flex-1 w-full min-h-0 relative">
            {categorySales.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={categorySales}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    >
                    {categorySales.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${settings.currency}${value.toLocaleString()}`} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                    No sales data
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Popular Items & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top Items */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-slate-800">Popular Menu Items</h3>
                 <button className="text-sm text-blue-600 hover:underline">View Menu Report</button>
             </div>
             <div className="h-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={topItems} margin={{ top: 0, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={120} 
                            tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }} 
                        />
                        <Tooltip 
                            cursor={{fill: '#f8fafc'}} 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24}>
                            {topItems.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
                {topItems.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">No items sold yet</div>
                )}
             </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
              <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                  <h3 className="text-lg font-bold text-slate-800">Recent Transactions</h3>
                  <button className="p-1 hover:bg-gray-200 rounded text-slate-500">
                      <Download size={18} />
                  </button>
              </div>
              <div className="overflow-y-auto flex-1 h-64">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50/50 sticky top-0 z-10 backdrop-blur-sm">
                          <tr>
                              <th className="p-4 font-semibold text-slate-500">ID</th>
                              <th className="p-4 font-semibold text-slate-500">Time</th>
                              <th className="p-4 font-semibold text-slate-500">Method</th>
                              <th className="p-4 font-semibold text-slate-500 text-right">Amount</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {completedOrders.length > 0 ? completedOrders.slice().reverse().slice(0, 8).map(order => (
                              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="p-4 font-mono text-xs font-bold text-slate-600">
                                      {order.id.slice(-6).toUpperCase()}
                                  </td>
                                  <td className="p-4 text-slate-600">
                                      {new Date(order.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                  </td>
                                  <td className="p-4">
                                      <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600">
                                          {order.paymentMethod || 'Cash'}
                                      </span>
                                  </td>
                                  <td className="p-4 text-right font-bold text-slate-800">
                                      {settings.currency}{(order.total - (order.discount||0)).toLocaleString()}
                                  </td>
                              </tr>
                          )) : (
                              <tr>
                                  <td colSpan={4} className="p-8 text-center text-gray-400">No transactions in selected period.</td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Reports;