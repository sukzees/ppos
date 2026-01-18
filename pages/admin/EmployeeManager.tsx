
import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { User, Role, Permission } from '../../types';
import { Plus, Edit, Trash2, Shield, ShieldAlert, Key, Lock, Users, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// UI Configuration for Permissions
const PERMISSIONS_LIST: { id: Permission; label: string }[] = [
    { id: 'view_dashboard', label: 'View Dashboard' },
    { id: 'access_pos', label: 'Access POS' },
    { id: 'view_orders', label: 'View Kitchen Orders' },
    { id: 'view_bar', label: 'View Bar Counter' },
    { id: 'manage_tables', label: 'Manage Tables' },
    { id: 'manage_menu', label: 'Manage Menu' },
    { id: 'manage_inventory', label: 'Manage Inventory' },
    { id: 'manage_bookings', label: 'Manage Bookings' },
    { id: 'manage_customers', label: 'Manage Customers' },
    { id: 'manage_employees', label: 'Manage Employees & Roles' },
    { id: 'view_reports', label: 'View Reports' },
    { id: 'manage_settings', label: 'System Settings' },
];

const EmployeeManager: React.FC = () => {
  const { users, roles, currentUser, addUser, updateUser, deleteUser, addRole, updateRole, deleteRole, hasPermission, getRole } = useStore();
  const navigate = useNavigate();

  // Protect route
  if (!hasPermission('manage_employees')) {
      return (
          <div className="p-8 text-center">
              <ShieldAlert size={48} className="mx-auto text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
              <p className="text-gray-600">You do not have permission to view this page.</p>
              <button onClick={() => navigate('/admin')} className="mt-4 text-blue-600 hover:underline">Return to Dashboard</button>
          </div>
      );
  }

  const [activeTab, setActiveTab] = useState<'employees' | 'roles'>('employees');
  const [searchTerm, setSearchTerm] = useState('');

  // --- Employee State ---
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<Partial<User>>({
    name: '', username: '', password: '', roleId: ''
  });

  // --- Role State ---
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleFormData, setRoleFormData] = useState<Partial<Role>>({
      name: '', permissions: []
  });

  // --- Employee Handlers ---
  const handleOpenEmployeeModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserFormData(user);
    } else {
      setEditingUser(null);
      // Default to first non-admin role if available, else blank
      const defaultRole = roles.find(r => r.name !== 'Admin')?.id || '';
      setUserFormData({ name: '', username: '', password: '', roleId: defaultRole });
    }
    setIsEmployeeModalOpen(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.roleId) {
        alert("Please select a role.");
        return;
    }
    if (editingUser) {
      updateUser({ ...editingUser, ...userFormData } as User);
    } else {
      const newUser = { ...userFormData, id: `u${Date.now()}` } as User;
      addUser(newUser);
    }
    setIsEmployeeModalOpen(false);
  };

  const handleDeleteEmployee = (id: string) => {
    if (id === currentUser?.id) {
        alert("You cannot delete your own account.");
        return;
    }
    if (confirm('Are you sure you want to delete this employee?')) {
      deleteUser(id);
    }
  };

  // --- Role Handlers ---
  const handleOpenRoleModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setRoleFormData(role);
    } else {
      setEditingRole(null);
      setRoleFormData({ name: '', permissions: [] });
    }
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingRole) {
          updateRole({ ...editingRole, ...roleFormData } as Role);
      } else {
          const newRole = { ...roleFormData, id: `r${Date.now()}` } as Role;
          addRole(newRole);
      }
      setIsRoleModalOpen(false);
  };

  const handleDeleteRole = (id: string) => {
      if (confirm('Are you sure you want to delete this role? Users assigned to this role may lose access.')) {
          deleteRole(id);
      }
  };

  const togglePermission = (permId: Permission) => {
      const currentPerms = roleFormData.permissions || [];
      if (currentPerms.includes(permId)) {
          setRoleFormData({ ...roleFormData, permissions: currentPerms.filter(p => p !== permId) });
      } else {
          setRoleFormData({ ...roleFormData, permissions: [...currentPerms, permId] });
      }
  };

  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Team Management</h1>
          <p className="text-slate-500">Manage employees, roles, and permissions.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button 
          onClick={() => setActiveTab('employees')}
          className={`pb-3 px-2 font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'employees' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users size={18} /> Employees
        </button>
        <button 
          onClick={() => setActiveTab('roles')}
          className={`pb-3 px-2 font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'roles' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Shield size={18} /> Roles & Permissions
        </button>
      </div>

      {activeTab === 'employees' ? (
        <>
            <div className="flex justify-between items-center mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search employees..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-600 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-700 text-white placeholder-slate-400" 
                    />
                </div>
                <button 
                onClick={() => handleOpenEmployeeModal()}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
                >
                <Plus size={20} /> Add Employee
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                    <tr>
                    <th className="p-4 font-semibold text-gray-600">Name</th>
                    <th className="p-4 font-semibold text-gray-600">Username</th>
                    <th className="p-4 font-semibold text-gray-600">Role</th>
                    <th className="p-4 font-semibold text-gray-600">Password / PIN</th>
                    <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {filteredUsers.map((user) => {
                        const userRole = getRole(user.roleId);
                        return (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="p-4 font-medium flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                        {user.name.charAt(0)}
                                    </div>
                                    {user.name}
                                </td>
                                <td className="p-4 text-gray-600">{user.username}</td>
                                <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase flex items-center w-fit gap-1 ${
                                    userRole?.name === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                    {userRole?.name === 'Admin' && <Shield size={12} />}
                                    {userRole?.name || 'Unknown Role'}
                                </span>
                                </td>
                                <td className="p-4 text-gray-500 font-mono">
                                    {editingUser?.id === user.id ? user.password : '••••'}
                                </td>
                                <td className="p-4 text-right space-x-2">
                                <button onClick={() => handleOpenEmployeeModal(user)} className="text-blue-600 hover:text-blue-800 p-1"><Edit size={18} /></button>
                                <button 
                                    onClick={() => handleDeleteEmployee(user.id)} 
                                    className={`p-1 ${user.id === currentUser?.id ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:text-red-700'}`}
                                    disabled={user.id === currentUser?.id}
                                >
                                    <Trash2 size={18} />
                                </button>
                                </td>
                            </tr>
                        );
                    })}
                    {filteredUsers.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-500">No employees found matching your search.</td>
                        </tr>
                    )}
                </tbody>
                </table>
            </div>
        </>
      ) : (
        <>
            <div className="flex justify-end mb-4">
                <button 
                onClick={() => handleOpenRoleModal()}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
                >
                <Plus size={20} /> Create New Role
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map(role => (
                    <div key={role.id} className="bg-white rounded-xl shadow-sm border p-6 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    {role.name}
                                    {role.isSystem && <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded uppercase">System</span>}
                                </h3>
                                <p className="text-sm text-gray-500">{users.filter(u => u.roleId === role.id).length} users assigned</p>
                            </div>
                            <Shield size={24} className="text-amber-100 fill-amber-500" />
                        </div>
                        
                        <div className="flex-1 bg-gray-50 rounded p-3 mb-4">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Permissions</p>
                            <div className="flex flex-wrap gap-2">
                                {role.permissions.slice(0, 6).map(p => (
                                    <span key={p} className="text-[10px] bg-white border px-2 py-1 rounded text-slate-600">
                                        {PERMISSIONS_LIST.find(pl => pl.id === p)?.label || p}
                                    </span>
                                ))}
                                {role.permissions.length > 6 && (
                                    <span className="text-[10px] bg-white border px-2 py-1 rounded text-slate-500 font-bold">
                                        +{role.permissions.length - 6} more
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t mt-auto">
                            <button 
                                onClick={() => handleOpenRoleModal(role)}
                                className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1"
                            >
                                <Edit size={16} /> Edit
                            </button>
                            {!role.isSystem && (
                                <button 
                                    onClick={() => handleDeleteRole(role.id)}
                                    className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1"
                                >
                                    <Trash2 size={16} /> Delete
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </>
      )}

      {/* Employee Modal */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">{editingUser ? 'Edit Employee' : 'New Employee'}</h2>
            </div>
            <form onSubmit={handleSaveEmployee} className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                 <input 
                    required 
                    type="text" 
                    className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400" 
                    value={userFormData.name} 
                    onChange={e => setUserFormData({...userFormData, name: e.target.value})} 
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                 <input 
                    required 
                    type="text" 
                    className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400" 
                    value={userFormData.username} 
                    onChange={e => setUserFormData({...userFormData, username: e.target.value})} 
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                     <Key size={14} /> Password / PIN
                 </label>
                 <input 
                    required 
                    type="text" 
                    className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400" 
                    value={userFormData.password} 
                    onChange={e => setUserFormData({...userFormData, password: e.target.value})} 
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                 <select 
                    className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400" 
                    value={userFormData.roleId} 
                    onChange={e => setUserFormData({...userFormData, roleId: e.target.value})}
                    required
                 >
                     <option value="" disabled>Select a Role</option>
                     {roles.map(r => (
                         <option key={r.id} value={r.id}>{r.name}</option>
                     ))}
                 </select>
               </div>
               
              <div className="pt-4 flex gap-3 border-t mt-4">
                <button type="button" onClick={() => setIsEmployeeModalOpen(false)} className="flex-1 py-2 rounded-lg border hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 font-semibold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b shrink-0">
              <h2 className="text-xl font-bold">{editingRole ? 'Edit Role' : 'New Role'}</h2>
              <p className="text-sm text-gray-500">Define access levels for this role.</p>
            </div>
            
            <form onSubmit={handleSaveRole} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                        <input 
                            required 
                            type="text" 
                            className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white placeholder-slate-400" 
                            value={roleFormData.name} 
                            onChange={e => setRoleFormData({...roleFormData, name: e.target.value})}
                            placeholder="e.g. Shift Manager"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {PERMISSIONS_LIST.map(perm => (
                            <label 
                                key={perm.id}
                                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                                    roleFormData.permissions?.includes(perm.id) 
                                    ? 'bg-amber-50 border-amber-500' 
                                    : 'hover:bg-gray-50'
                                }`}
                            >
                                <input 
                                    type="checkbox"
                                    className="w-5 h-5 text-amber-600 rounded"
                                    checked={roleFormData.permissions?.includes(perm.id) || false}
                                    onChange={() => togglePermission(perm.id)}
                                />
                                <span className={`font-medium ${roleFormData.permissions?.includes(perm.id) ? 'text-amber-900' : 'text-gray-700'}`}>
                                    {perm.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t bg-gray-50 shrink-0 flex gap-3">
                    <button type="button" onClick={() => setIsRoleModalOpen(false)} className="flex-1 py-2 rounded-lg border bg-white hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="flex-1 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 font-semibold">Save Role</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManager;
