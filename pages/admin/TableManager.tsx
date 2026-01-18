
import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Table, TableStatus } from '../../types';
import { Plus, Trash2, Edit, LayoutGrid, List, QrCode, X, Download } from 'lucide-react';

const TableManager: React.FC = () => {
  const { tables, zones, addTable, updateTable, deleteTable } = useStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Table Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  
  // QR Code Modal State
  const [qrTable, setQrTable] = useState<Table | null>(null);

  const [formData, setFormData] = useState<Partial<Table>>({
    name: '', zone: '', seats: 4, status: TableStatus.AVAILABLE
  });

  const handleOpenModal = (table?: Table) => {
    if (table) {
      setEditingTable(table);
      setFormData(table);
    } else {
      setEditingTable(null);
      // Default to first zone if available
      const defaultZone = zones.length > 0 ? zones[0].name : '';
      setFormData({ name: '', zone: defaultZone, seats: 4, status: TableStatus.AVAILABLE });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTable) {
      updateTable({ ...editingTable, ...formData } as Table);
    } else {
      const newTable = { ...formData, id: `t${Date.now()}` } as Table;
      addTable(newTable);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this table?')) {
      deleteTable(id);
    }
  };

  const handleShowQr = (table: Table) => {
    setQrTable(table);
  };

  const getQrUrl = (tableId: string, size: number = 250) => {
    // Generates a URL that points to the client menu with the tableId parameter
    const appUrl = `${window.location.origin}/#/menu?tableId=${tableId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(appUrl)}`;
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
          <h1 className="text-3xl font-bold text-slate-800">Table Management</h1>
          <p className="text-slate-500">Configure restaurant layout, zones, and seats.</p>
        </div>
        <div className="flex gap-4">
             <div className="bg-gray-100 p-1 rounded-lg flex">
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-white shadow text-amber-600' : 'text-gray-500 hover:text-gray-700'}`}
                    title="Grid View"
                >
                    <LayoutGrid size={20} />
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white shadow text-amber-600' : 'text-gray-500 hover:text-gray-700'}`}
                    title="List View"
                >
                    <List size={20} />
                </button>
             </div>
            <button 
              onClick={() => handleOpenModal()}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
            >
              <Plus size={20} /> Add Table
            </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {zones.map(zone => (
            <div key={zone.id} className="bg-white rounded-xl shadow-sm border p-4">
              <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                <LayoutGrid size={20} /> Zone {zone.name}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {tables.filter(t => t.zone === zone.name).map(table => (
                  <div key={table.id} className="border rounded-lg p-4 relative group hover:shadow-md transition bg-gray-50">
                     <div className="flex justify-between items-start">
                       <span className="font-bold text-xl">{table.name}</span>
                       <div className={`w-3 h-3 rounded-full shrink-0 ${
                          table.status === TableStatus.AVAILABLE ? 'bg-green-500' : 
                          table.status === TableStatus.OCCUPIED ? 'bg-red-500' : 'bg-yellow-500'
                       }`} title={table.status} />
                     </div>
                     <p className="text-sm text-gray-500 mt-1">{table.seats} Seats</p>
                     <p className={`text-xs mt-1 font-semibold ${
                         table.status === TableStatus.AVAILABLE ? 'text-green-600' : 
                         table.status === TableStatus.OCCUPIED ? 'text-red-600' : 'text-yellow-600'
                     }`}>{table.status}</p>
                     
                     <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/80 rounded backdrop-blur-sm p-0.5">
                        <button onClick={() => handleShowQr(table)} className="p-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200" title="QR Code"><QrCode size={14} /></button>
                        <button onClick={() => handleOpenModal(table)} className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(table.id)} className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"><Trash2 size={14} /></button>
                     </div>
                  </div>
                ))}
                {tables.filter(t => t.zone === zone.name).length === 0 && (
                  <p className="col-span-2 text-center text-gray-400 py-4 text-sm">No tables in this zone</p>
                )}
              </div>
            </div>
          ))}
          {zones.length === 0 && (
              <div className="col-span-3 text-center py-10 text-gray-400">
                  <p>No zones configured. Go to Zones management to add one.</p>
              </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="p-4 font-semibold text-gray-600">Table Name</th>
                        <th className="p-4 font-semibold text-gray-600">Zone</th>
                        <th className="p-4 font-semibold text-gray-600">Seats</th>
                        <th className="p-4 font-semibold text-gray-600">Status</th>
                        <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {tables.sort((a,b) => a.zone.localeCompare(b.zone) || a.name.localeCompare(b.name)).map(table => (
                        <tr key={table.id} className="hover:bg-gray-50">
                            <td className="p-4 font-bold text-slate-800">{table.name}</td>
                            <td className="p-4">
                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">Zone {table.zone}</span>
                            </td>
                            <td className="p-4">{table.seats} Seats</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                    table.status === TableStatus.AVAILABLE ? 'bg-green-100 text-green-700' : 
                                    table.status === TableStatus.OCCUPIED ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {table.status}
                                </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                                <button onClick={() => handleShowQr(table)} className="text-slate-600 hover:text-slate-800 p-1" title="Generate QR"><QrCode size={18} /></button>
                                <button onClick={() => handleOpenModal(table)} className="text-blue-600 hover:text-blue-800 p-1"><Edit size={18} /></button>
                                <button onClick={() => handleDelete(table.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18} /></button>
                            </td>
                        </tr>
                    ))}
                    {tables.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-500">No tables configured.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      )}

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
             <h2 className="text-xl font-bold mb-4">{editingTable ? 'Edit Table' : 'New Table'}</h2>
             <form onSubmit={handleSave} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Table Name</label>
                 <input 
                    required 
                    type="text" 
                    className="w-full border border-slate-600 rounded p-2 bg-slate-700 text-white placeholder-slate-400" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                 />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                   <select 
                    className="w-full border border-slate-600 rounded p-2 bg-slate-700 text-white placeholder-slate-400" 
                    value={formData.zone} 
                    onChange={e => setFormData({...formData, zone: e.target.value})} 
                    required
                   >
                     <option value="" disabled>Select Zone</option>
                     {zones.map(z => <option key={z.id} value={z.name}>Zone {z.name}</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Seats</label>
                   <input 
                    required 
                    type="number" 
                    className="w-full border border-slate-600 rounded p-2 bg-slate-700 text-white placeholder-slate-400" 
                    value={formData.seats} 
                    onChange={e => setFormData({...formData, seats: Number(e.target.value)})} 
                   />
                 </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select 
                    className="w-full border border-slate-600 rounded p-2 bg-slate-700 text-white placeholder-slate-400" 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value as TableStatus})}
                  >
                     {Object.values(TableStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
               </div>
               <div className="flex gap-2 pt-2">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border rounded hover:bg-gray-50">Cancel</button>
                 <button type="submit" className="flex-1 py-2 bg-amber-600 text-white rounded hover:bg-amber-700">Save</button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-slate-800">Table {qrTable.name} QR</h3>
                    <button onClick={() => setQrTable(null)} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-8 flex flex-col items-center justify-center text-center space-y-6 bg-white">
                    <div className="bg-white p-2 border-4 border-slate-900 rounded-xl shadow-lg">
                        <img 
                            src={getQrUrl(qrTable.id)} 
                            alt={`QR for ${qrTable.name}`}
                            className="w-48 h-48"
                        />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 text-xl">Scan to Order</p>
                        <p className="text-sm text-gray-500 mt-1">Zone {qrTable.zone} • {qrTable.seats} Seats</p>
                    </div>
                    
                    <a 
                        href={getQrUrl(qrTable.id, 500)}
                        download={`Table-${qrTable.name}-QR.png`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-slate-800 transition w-full justify-center shadow-lg"
                    >
                        <Download size={18} /> Download High Res
                    </a>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TableManager;
