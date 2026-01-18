
import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { useLocation } from 'react-router-dom';
import { Save, Bell, Mail, Monitor, ScrollText, Printer, GripVertical, Percent, QrCode, Upload, DollarSign, Plus, Trash2, CheckCircle2, ArrowRightLeft, ChefHat, Wine, AlertCircle, Crown, Info, Image as ImageIcon } from 'lucide-react';
import { Currency } from '../../types';

const Settings: React.FC = () => {
  const { settings, updateSettings, categories } = useStore();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'general' | 'receipt' | 'mapping' | 'loyalty'>('general');
  const [formData, setFormData] = useState(settings);
  const [newCurrency, setNewCurrency] = useState<Partial<Currency>>({ code: '', symbol: '', rate: 1, isBase: false });

  // Update local state if store settings change (though usually driven by local)
  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  // Handle navigation from other pages (like POS) to open specific tab
  useEffect(() => {
    if (location.state && (location.state as any).activeTab) {
        setActiveTab((location.state as any).activeTab);
    }
  }, [location]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
  };

  const updateReceiptField = (field: string, value: any) => {
    setFormData({
      ...formData,
      receipt: {
        ...formData.receipt,
        [field]: value
      }
    });
  };

  const updateLoyaltyField = (field: string, value: any) => {
      setFormData({
          ...formData,
          loyaltyProgram: {
              enabled: formData.loyaltyProgram?.enabled ?? true,
              spendRate: formData.loyaltyProgram?.spendRate ?? 100,
              ...formData.loyaltyProgram,
              [field]: value
          }
      });
  };

  const handlePrintTest = () => {
      window.print();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, paymentQrImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, restaurantLogo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCurrency = () => {
    if (newCurrency.code && newCurrency.symbol) {
        const currencies = [...(formData.currencies || []), { ...newCurrency, isBase: false } as Currency];
        setFormData({ ...formData, currencies });
        setNewCurrency({ code: '', symbol: '', rate: 1, isBase: false });
    }
  };

  const handleRemoveCurrency = (code: string) => {
      const currencies = (formData.currencies || []).filter(c => c.code !== code);
      setFormData({ ...formData, currencies });
  };

  const handleSetBaseCurrency = (code: string) => {
      const currencies = (formData.currencies || []).map(c => ({
          ...c,
          isBase: c.code === code,
          rate: c.code === code ? 1 : c.rate // Base currency rate must be 1
      }));
      const base = currencies.find(c => c.code === code);
      setFormData({ ...formData, currencies, currency: base?.symbol || formData.currency });
  };

  // Update category mapping
  const handleUpdateMapping = (categoryId: string, station: 'kitchen' | 'bar') => {
      setFormData({
          ...formData,
          categoryMapping: {
              ...formData.categoryMapping,
              [categoryId]: station
          }
      });
  };

  // Mock Data for Preview and Test Print
  const mockItems = [
    { name: 'Pad Thai', qty: 2, price: 120 },
    { name: 'Iced Coffee', qty: 1, price: 80 },
    { name: 'Mango Sticky Rice', qty: 1, price: 150 },
  ];

  const mockSubtotal = mockItems.reduce((acc, item) => acc + (item.qty * item.price), 0);
  const mockVat = mockSubtotal * (formData.vatRate / 100);
  const mockTotal = mockSubtotal + mockVat;

  return (
    <>
    <div className="p-6 max-w-7xl mx-auto print:hidden">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">System Settings</h1>
        <p className="text-slate-500">Configure notifications, restaurant details, receipts, and station routing.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button 
          onClick={() => setActiveTab('general')}
          className={`pb-3 px-2 font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'general' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Monitor size={18} /> General & Notifications
        </button>
        <button 
          onClick={() => setActiveTab('loyalty')}
          className={`pb-3 px-2 font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'loyalty' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Crown size={18} /> Loyalty Program
        </button>
        <button 
          onClick={() => setActiveTab('mapping')}
          className={`pb-3 px-2 font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'mapping' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ArrowRightLeft size={18} /> Station Mapping
        </button>
        <button 
          onClick={() => setActiveTab('receipt')}
          className={`pb-3 px-2 font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'receipt' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ScrollText size={18} /> Receipt Customization
        </button>
      </div>

      {activeTab === 'general' ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden max-w-3xl">
          <form onSubmit={handleSubmit} className="divide-y">
            {/* General Section */}
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <Monitor size={20} /> General Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                    <input 
                    type="text" 
                    className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400"
                    value={formData.restaurantName}
                    onChange={e => setFormData({...formData, restaurantName: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Percent size={14} /> VAT Rate (%)</label>
                    <input 
                    type="number" 
                    min="0"
                    step="0.1"
                    className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400"
                    value={formData.vatRate}
                    onChange={e => setFormData({...formData, vatRate: Number(e.target.value)})}
                    />
                </div>
              </div>

              {/* Logo Upload Section */}
              <div className="pt-4 border-t border-dashed mt-4">
                  <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><ImageIcon size={16}/> Restaurant Logo</h3>
                  <div className="flex items-center gap-6">
                      {formData.restaurantLogo ? (
                          <div className="relative w-32 h-32 border rounded-lg overflow-hidden group bg-gray-50 shadow-sm">
                              <img src={formData.restaurantLogo} alt="Restaurant Logo" className="w-full h-full object-contain p-1" />
                              <button 
                                  type="button"
                                  onClick={() => setFormData({...formData, restaurantLogo: ''})}
                                  className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-bold"
                              >
                                  Remove
                              </button>
                          </div>
                      ) : (
                          <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                              <ImageIcon size={32} />
                              <span className="text-[10px] mt-2">No Logo</span>
                          </div>
                      )}
                      
                      <div className="flex-1">
                          <label className="cursor-pointer inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
                              <Upload size={16} /> Upload Logo
                              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                          </label>
                          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                              Upload your restaurant's logo.<br/>
                              This can be displayed at the top of receipts.
                          </p>
                      </div>
                  </div>
              </div>

              {/* QR Upload Section */}
              <div className="pt-4 border-t border-dashed mt-4">
                  <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><QrCode size={16}/> Payment QR Code</h3>
                  <div className="flex items-center gap-6">
                      {formData.paymentQrImage ? (
                          <div className="relative w-32 h-32 border rounded-lg overflow-hidden group bg-gray-50 shadow-sm">
                              <img src={formData.paymentQrImage} alt="Payment QR" className="w-full h-full object-contain p-1" />
                              <button 
                                  type="button"
                                  onClick={() => setFormData({...formData, paymentQrImage: ''})}
                                  className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-bold"
                              >
                                  Remove
                              </button>
                          </div>
                      ) : (
                          <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                              <QrCode size={32} />
                              <span className="text-[10px] mt-2">No QR Uploaded</span>
                          </div>
                      )}
                      
                      <div className="flex-1">
                          <label className="cursor-pointer inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
                              <Upload size={16} /> Upload New QR Image
                              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                          </label>
                          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                              Upload your shop's PromptPay, Bank QR, or Payment Link QR code image.<br/>
                              This will be displayed to the cashier during the checkout process.
                          </p>
                      </div>
                  </div>
              </div>
            </div>

            {/* Currency Management Section */}
            <div className="p-6 space-y-4">
               <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                 <DollarSign size={20} /> Currency Management
               </h2>
               
               <div className="overflow-x-auto border rounded-lg">
                   <table className="w-full text-left text-sm">
                       <thead className="bg-gray-50 border-b">
                           <tr>
                               <th className="p-3 font-semibold text-gray-600">Code</th>
                               <th className="p-3 font-semibold text-gray-600">Symbol</th>
                               <th className="p-3 font-semibold text-gray-600">Rate (1 Code = X Base)</th>
                               <th className="p-3 font-semibold text-gray-600">Base</th>
                               <th className="p-3 font-semibold text-gray-600 text-right">Actions</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y">
                           {(formData.currencies || []).map(curr => (
                               <tr key={curr.code}>
                                   <td className="p-3 font-medium">{curr.code}</td>
                                   <td className="p-3">{curr.symbol}</td>
                                   <td className="p-3">
                                       <input 
                                          type="number" 
                                          step="0.01" 
                                          min="0"
                                          disabled={curr.isBase}
                                          className="w-20 border border-slate-600 rounded px-2 py-1 bg-slate-700 text-white placeholder-slate-400 disabled:bg-gray-100 disabled:text-gray-400"
                                          value={curr.rate}
                                          onChange={(e) => {
                                              const newCurrencies = formData.currencies?.map(c => c.code === curr.code ? {...c, rate: parseFloat(e.target.value)} : c);
                                              setFormData({...formData, currencies: newCurrencies});
                                          }}
                                       />
                                   </td>
                                   <td className="p-3">
                                       {curr.isBase ? (
                                           <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold flex items-center gap-1 w-fit"><CheckCircle2 size={12}/> Base</span>
                                       ) : (
                                           <button 
                                              type="button"
                                              onClick={() => handleSetBaseCurrency(curr.code)}
                                              className="text-xs text-slate-500 hover:text-slate-800 underline"
                                           >
                                               Set as Base
                                           </button>
                                       )}
                                   </td>
                                   <td className="p-3 text-right">
                                       {!curr.isBase && (
                                           <button type="button" onClick={() => handleRemoveCurrency(curr.code)} className="text-red-500 hover:text-red-700">
                                               <Trash2 size={16} />
                                           </button>
                                       )}
                                   </td>
                               </tr>
                           ))}
                           <tr className="bg-gray-50">
                               <td className="p-3">
                                   <input type="text" placeholder="Code (e.g. USD)" className="w-24 border border-slate-600 rounded px-2 py-1 uppercase bg-slate-700 text-white placeholder-slate-400" value={newCurrency.code} onChange={e => setNewCurrency({...newCurrency, code: e.target.value.toUpperCase()})} />
                               </td>
                               <td className="p-3">
                                   <input type="text" placeholder="Sym ($)" className="w-16 border border-slate-600 rounded px-2 py-1 bg-slate-700 text-white placeholder-slate-400" value={newCurrency.symbol} onChange={e => setNewCurrency({...newCurrency, symbol: e.target.value})} />
                               </td>
                               <td className="p-3">
                                   <input type="number" placeholder="Rate" step="0.01" className="w-20 border border-slate-600 rounded px-2 py-1 bg-slate-700 text-white placeholder-slate-400" value={newCurrency.rate} onChange={e => setNewCurrency({...newCurrency, rate: parseFloat(e.target.value)})} />
                               </td>
                               <td colSpan={2} className="p-3 text-right">
                                   <button type="button" onClick={handleAddCurrency} disabled={!newCurrency.code || !newCurrency.symbol} className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded hover:bg-slate-800 disabled:opacity-50">
                                       <Plus size={14} className="inline mr-1" /> Add
                                   </button>
                               </td>
                           </tr>
                       </tbody>
                   </table>
               </div>
               <p className="text-xs text-gray-500 mb-4">
                   Note: Rate determines the value of 1 unit of foreign currency in the base currency (e.g., if Rate is 35, then 1 USD = 35 THB).
               </p>

               <div className="flex items-center gap-2 border-t pt-4">
                    <input 
                        type="checkbox" 
                        id="showCurrency"
                        checked={formData.receipt.showCurrencyExchange || false}
                        onChange={e => updateReceiptField('showCurrencyExchange', e.target.checked)}
                        className="w-4 h-4 text-amber-600 rounded accent-amber-600 focus:ring-amber-500"
                    />
                    <label htmlFor="showCurrency" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Show Currency Exchange Rates & Totals on Receipt
                    </label>
               </div>
            </div>

            {/* Notifications Section */}
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <Bell size={20} /> Notifications
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between max-w-md">
                  <div>
                    <label className="block font-medium text-slate-800">In-App Notifications</label>
                    <p className="text-sm text-gray-500">Show popup alerts inside the admin dashboard.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={formData.inAppNotifications}
                      onChange={e => setFormData({...formData, inAppNotifications: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between max-w-md">
                  <div>
                    <label className="block font-medium text-slate-800">Email Alerts</label>
                    <p className="text-sm text-gray-500">Send email when inventory is low.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={formData.emailNotifications}
                      onChange={e => setFormData({...formData, emailNotifications: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {formData.emailNotifications && (
                  <div className="p-4 bg-gray-50 rounded-lg max-w-md border animate-fade-in">
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <Mail size={16} /> Alert Email Address
                      </label>
                      <input 
                        type="email" 
                        className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400"
                        value={formData.alertEmail}
                        onChange={e => setFormData({...formData, alertEmail: e.target.value})}
                        placeholder="manager@restaurant.com"
                      />
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex justify-end">
              <button 
                type="submit"
                className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 flex items-center gap-2"
              >
                <Save size={18} /> Save Settings
              </button>
            </div>
          </form>
        </div>
      ) : activeTab === 'loyalty' ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden max-w-3xl">
            <div className="p-6 border-b">
                <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                    <Crown size={20} /> Loyalty Program Configuration
                </h2>
                <p className="text-sm text-gray-500">Manage how customers earn points.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="flex items-center justify-between max-w-md">
                    <div>
                        <label className="block font-medium text-slate-800">Enable Loyalty Points</label>
                        <p className="text-sm text-gray-500">Allow customers to earn points on purchases.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={formData.loyaltyProgram?.enabled ?? true}
                            onChange={e => updateLoyaltyField('enabled', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                </div>

                <div className={`p-4 rounded-xl border transition-all ${formData.loyaltyProgram?.enabled ? 'bg-amber-50 border-amber-200 opacity-100' : 'bg-gray-50 border-gray-200 opacity-50 pointer-events-none'}`}>
                    <label className="block text-sm font-bold text-slate-800 mb-2">Earning Rule</label>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">Spend</span>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500 font-bold text-sm">{formData.currency}</span>
                            <input 
                                type="number" 
                                min="1"
                                className="w-32 border border-slate-400 rounded-lg pl-8 pr-3 py-2 bg-white text-slate-800 font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                                value={formData.loyaltyProgram?.spendRate || 100}
                                onChange={e => updateLoyaltyField('spendRate', Math.max(1, parseInt(e.target.value) || 0))}
                            />
                        </div>
                        <span className="text-sm text-gray-600">to earn <strong className="text-amber-600">1 Point</strong></span>
                    </div>
                    
                    <div className="mt-3 flex items-start gap-2 text-xs text-amber-800">
                        <Info size={14} className="mt-0.5 shrink-0"/>
                        <p>Example: If a customer spends {formData.currency}500, they will earn {Math.floor(500 / (formData.loyaltyProgram?.spendRate || 1))} points.</p>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button 
                        type="submit"
                        className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 flex items-center gap-2"
                    >
                        <Save size={18} /> Save Changes
                    </button>
                </div>
            </form>
        </div>
      ) : activeTab === 'mapping' ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden max-w-3xl">
           <div className="p-6 border-b">
               <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                 <ArrowRightLeft size={20} /> Station Routing
               </h2>
               <p className="text-sm text-gray-500">Configure where items in each category should be sent (Kitchen Display or Bar Display).</p>
           </div>
           
           <div className="divide-y">
               {categories.map(category => {
                   const currentStation = formData.categoryMapping?.[category.id] || 'kitchen';
                   return (
                       <div key={category.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                           <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                                   {category.name.charAt(0)}
                               </div>
                               <div>
                                   <p className="font-bold text-slate-800">{category.name}</p>
                                   <p className="text-xs text-gray-400">ID: {category.id}</p>
                               </div>
                           </div>
                           
                           <div className="flex bg-gray-100 p-1 rounded-lg">
                               <button 
                                   type="button"
                                   onClick={() => handleUpdateMapping(category.id, 'kitchen')}
                                   className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${
                                       currentStation === 'kitchen' 
                                       ? 'bg-white shadow text-orange-600' 
                                       : 'text-gray-400 hover:text-gray-600'
                                   }`}
                               >
                                   <ChefHat size={16} /> Kitchen
                               </button>
                               <button 
                                   type="button"
                                   onClick={() => handleUpdateMapping(category.id, 'bar')}
                                   className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${
                                       currentStation === 'bar' 
                                       ? 'bg-white shadow text-purple-600' 
                                       : 'text-gray-400 hover:text-gray-600'
                                   }`}
                               >
                                   <Wine size={16} /> Bar
                               </button>
                           </div>
                       </div>
                   );
               })}
               {categories.length === 0 && (
                   <div className="p-8 text-center text-gray-400">
                       No categories found. Please add categories in the Menu menu.
                   </div>
               )}
           </div>
           
           <div className="p-6 bg-gray-50 flex justify-end">
              <button 
                onClick={handleSubmit}
                className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 flex items-center gap-2"
              >
                <Save size={18} /> Save Settings
              </button>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor Column */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-6 border-b">
               <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                 <ScrollText size={20} /> Receipt Configuration
               </h2>
               <p className="text-sm text-gray-500">Customize the look and content of your printed bills.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Header Title</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400"
                  value={formData.receipt.headerText}
                  onChange={e => updateReceiptField('headerText', e.target.value)}
                  placeholder="e.g. SiamSavory"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Header (Slogan)</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400"
                  value={formData.receipt.subHeaderText}
                  onChange={e => updateReceiptField('subHeaderText', e.target.value)}
                  placeholder="e.g. Authentic Thai Cuisine"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400"
                  value={formData.receipt.address}
                  onChange={e => updateReceiptField('address', e.target.value)}
                  placeholder="123 Street Name, City"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400"
                    value={formData.receipt.phone}
                    onChange={e => updateReceiptField('phone', e.target.value)}
                    placeholder="02-123-4567"
                  />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID (Optional)</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400"
                    value={formData.receipt.taxId || ''}
                    onChange={e => updateReceiptField('taxId', e.target.value)}
                    placeholder="TAX-XXX-XXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Footer Message</label>
                <textarea 
                  className="w-full border border-slate-600 rounded-lg px-3 py-2 h-20 bg-slate-700 text-white placeholder-slate-400"
                  value={formData.receipt.footerText}
                  onChange={e => updateReceiptField('footerText', e.target.value)}
                  placeholder="Thank you for dining with us!"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="showLogo"
                  checked={formData.receipt.showLogo}
                  onChange={e => updateReceiptField('showLogo', e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded accent-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="showLogo" className="text-sm font-medium text-gray-700 cursor-pointer">Show Restaurant Name on Ticket</label>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="showImageLogo"
                  checked={formData.receipt.showImageLogo || false}
                  onChange={e => updateReceiptField('showImageLogo', e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded accent-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="showImageLogo" className="text-sm font-medium text-gray-700 cursor-pointer">Show Logo Image on Ticket</label>
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-2">
                    <input 
                    type="checkbox" 
                    id="showQrCode"
                    checked={formData.receipt.showQrCode || false}
                    onChange={e => updateReceiptField('showQrCode', e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded accent-amber-600 focus:ring-amber-500"
                    />
                    <label htmlFor="showQrCode" className="text-sm font-medium text-gray-700 cursor-pointer">Show Payment QR on Ticket</label>
                </div>
                {!formData.paymentQrImage && formData.receipt.showQrCode && (
                    <div className="flex items-center gap-2 text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded border border-amber-200">
                        <AlertCircle size={14} />
                        <span>Warning: No QR image enabled. Please upload one in the General tab.</span>
                    </div>
                )}
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-2">
                    <input 
                    type="checkbox" 
                    id="showPaymentMethod"
                    checked={formData.receipt.showPaymentMethod ?? true}
                    onChange={e => updateReceiptField('showPaymentMethod', e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded accent-amber-600 focus:ring-amber-500"
                    />
                    <label htmlFor="showPaymentMethod" className="text-sm font-medium text-gray-700 cursor-pointer">Show Payment Method on Receipt</label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={handlePrintTest}
                  className="bg-white border text-slate-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-50 flex items-center gap-2"
                >
                  <Printer size={18} /> Test Print
                </button>
                <button 
                  type="submit"
                  className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 flex items-center gap-2"
                >
                  <Save size={18} /> Save Settings
                </button>
              </div>
            </form>
          </div>

          {/* Preview Column */}
          <div>
            <div className="sticky top-6">
              <h3 className="font-bold text-gray-500 mb-3 flex items-center gap-2">
                <Printer size={16} /> Live Preview
              </h3>
              
              <div className="bg-white p-8 shadow-lg border-t-8 border-gray-800 w-full max-w-[350px] mx-auto min-h-[500px] text-sm font-mono leading-relaxed relative">
                {/* Paper Texture Effect */}
                <div className="absolute inset-0 bg-gray-50 opacity-20 pointer-events-none"></div>

                <div className="text-center mb-6 relative z-10">
                    {formData.receipt.showImageLogo && formData.restaurantLogo && (
                        <div className="flex justify-center mb-2">
                            <img src={formData.restaurantLogo} alt="Logo" className="h-16 object-contain grayscale" />
                        </div>
                    )}
                    {formData.receipt.showLogo && (
                      <h1 className="text-2xl font-bold mb-1 uppercase tracking-wider">{formData.receipt.headerText}</h1>
                    )}
                    <p className="text-gray-600 text-xs uppercase mb-2">{formData.receipt.subHeaderText}</p>
                    <p className="text-gray-600 text-xs">{formData.receipt.address}</p>
                    <p className="text-gray-600 text-xs">Tel: {formData.receipt.phone}</p>
                    {formData.receipt.taxId && <p className="text-gray-600 text-xs">Tax ID: {formData.receipt.taxId}</p>}
                    
                    <div className="border-b-2 border-dashed border-gray-300 w-full my-4"></div>
                    
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Date: {new Date().toLocaleDateString()}</span>
                      <span>Time: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Order: #TEST-001</span>
                      <span>Table: A1</span>
                    </div>
                    
                    <div className="border-b-2 border-dashed border-gray-300 w-full my-4"></div>
                </div>

                <div className="mb-6 relative z-10">
                   <div className="grid grid-cols-12 font-bold border-b border-black mb-2 pb-1 text-[10px]">
                      <span className="col-span-5">Item</span>
                      <span className="col-span-2 text-center">Qty</span>
                      <span className="col-span-2 text-right">Price</span>
                      <span className="col-span-3 text-right">Total</span>
                   </div>
                   {mockItems.map((item, idx) => (
                       <div key={idx} className="grid grid-cols-12 mb-1 text-[10px]">
                          <span className="col-span-5 truncate">{item.name}</span>
                          <span className="col-span-2 text-center">{item.qty}</span>
                          <span className="col-span-2 text-right">{item.price.toLocaleString()}</span>
                          <span className="col-span-3 text-right">{(item.price * item.qty).toLocaleString()}</span>
                       </div>
                   ))}
                </div>

                <div className="border-t-2 border-black pt-2 space-y-1 text-right text-xs relative z-10">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{mockSubtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>VAT ({formData.vatRate}%)</span>
                        <span>{mockVat.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg mt-2 border-t border-dashed pt-2">
                        <span>Total</span>
                        <span>{formData.currency || '฿'}{mockTotal.toLocaleString()}</span>
                    </div>
                    {/* Show Currency Exchange in Preview */}
                    {formData.receipt.showCurrencyExchange && formData.currencies && formData.currencies.filter(c => !c.isBase).map(c => {
                        const converted = mockTotal / c.rate;
                        return (
                            <div key={c.code} className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>({c.code} @ {c.rate.toLocaleString()})</span>
                                <span>{c.symbol}{converted.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                        );
                    })}
                    {/* Show Payment Method in Preview */}
                    {formData.receipt.showPaymentMethod && (
                        <div className="flex justify-between text-xs text-gray-500 mt-1 pt-1 border-t border-dashed">
                            <span>Payment Method</span>
                            <span>Cash</span>
                        </div>
                    )}
                </div>

                {formData.receipt.showQrCode && formData.paymentQrImage ? (
                    <div className="flex justify-center my-4 relative z-10">
                        <img src={formData.paymentQrImage} alt="Payment QR" className="w-32 h-32 object-contain border p-1" />
                    </div>
                ) : formData.receipt.showQrCode && (
                    <div className="my-4 text-center text-xs text-gray-400 border border-dashed p-2 bg-gray-50">
                        [QR Code Placeholder - No Image Uploaded]
                    </div>
                )}

                <div className="text-center mt-8 text-xs text-gray-600 relative z-10">
                    <p className="whitespace-pre-wrap">{formData.receipt.footerText}</p>
                </div>
                
                {/* Cut Line */}
                <div 
                  className="absolute -bottom-1 left-0 right-0 h-4 bg-white [mask-image:radial-gradient(circle,transparent_50%,black_50%)] [mask-size:20px_20px]"
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Hidden Print Template for Test Page */}
    <div className="hidden print:block print:absolute print:inset-0 print:bg-white print:z-50 p-8">
        <div className="text-center mb-6">
            {formData.receipt.showImageLogo && formData.restaurantLogo && (
                <div className="flex justify-center mb-2">
                    <img src={formData.restaurantLogo} alt="Logo" className="h-20 object-contain grayscale" />
                </div>
            )}
            {formData.receipt.showLogo && (
               <h1 className="text-2xl font-bold uppercase">{formData.receipt.headerText}</h1>
            )}
            <p className="text-gray-600 text-sm uppercase">{formData.receipt.subHeaderText}</p>
            <p className="text-gray-600 text-sm">{formData.receipt.address}</p>
            <p className="text-gray-600 text-sm">Tel: {formData.receipt.phone}</p>
            {formData.receipt.taxId && (
               <p className="text-gray-600 text-sm">Tax ID: {formData.receipt.taxId}</p>
            )}
            
            <div className="border-b-2 border-dashed border-gray-300 w-full my-4"></div>
            <h2 className="text-xl font-bold uppercase">Test Receipt</h2>
            <p className="text-sm text-gray-500">{new Date().toLocaleString()}</p>
        </div>

        <div className="mb-6">
            <p><span className="font-bold">Table:</span> A1 (Test)</p>
            <p><span className="font-bold">Cashier:</span> Admin</p>
        </div>

        <table className="w-full text-left text-sm mb-6">
            <thead>
                <tr className="border-b border-black">
                    <th className="py-1 text-left">Item</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Price</th>
                    <th className="py-1 text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                {mockItems.map((item, idx) => (
                    <tr key={idx}>
                        <td className="py-1">{item.name}</td>
                        <td className="py-1 text-center">{item.qty}</td>
                        <td className="py-1 text-right">{item.price.toLocaleString()}</td>
                        <td className="py-1 text-right">{(item.price * item.qty).toLocaleString()}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        <div className="border-t-2 border-black pt-2 space-y-1 text-right text-sm">
            <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{mockSubtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
                <span>VAT ({formData.vatRate}%)</span>
                <span>{mockVat.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-xl mt-2 border-t border-dashed pt-2">
                <span>Total</span>
                <span>{formData.currency || '฿'}{mockTotal.toLocaleString()}</span>
            </div>
            {/* Show Currency Exchange in Print */}
            {formData.receipt.showCurrencyExchange && formData.currencies && formData.currencies.filter(c => !c.isBase).map(c => {
                const converted = mockTotal / c.rate;
                return (
                    <div key={c.code} className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>({c.code} @ {c.rate.toLocaleString()})</span>
                        <span>{c.symbol}{converted.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                );
            })}
            {/* Show Payment Method in Print */}
            {formData.receipt.showPaymentMethod && (
                <div className="flex justify-between text-xs text-gray-500 mt-1 pt-1 border-t border-dashed">
                    <span>Payment Method</span>
                    <span>Cash</span>
                </div>
            )}
        </div>

        {formData.receipt.showQrCode && formData.paymentQrImage && (
            <div className="flex justify-center my-4">
                <img src={formData.paymentQrImage} alt="Payment QR" className="w-32 h-32 object-contain border p-1" />
            </div>
        )}

        <div className="text-center mt-8 text-sm text-gray-600 whitespace-pre-wrap">
            {formData.receipt.footerText}
        </div>
    </div>
    </>
  );
};

export default Settings;
