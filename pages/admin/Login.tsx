
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { Lock, User, ChefHat } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useStore();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
        const success = login(username, password);
        if (success) {
            navigate('/admin');
        } else {
            setError('Invalid username or password');
            setIsLoading(false);
        }
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
       {/* Decorative Background Elements */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
           <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary-600/20 blur-[100px]"></div>
           <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[100px]"></div>
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
       </div>
       
       <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl w-full max-w-md relative z-10 animate-fade-in">
          <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-tr from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30">
                  <ChefHat className="text-white" size={32} />
              </div>
              <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">SiamSavory</h1>
              <p className="text-slate-300 text-sm">Restaurant Management System</p>
          </div>

          {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-xl mb-6 text-sm font-medium text-center flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span> {error}
              </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Username</label>
                  <div className="relative group">
                      <User className="absolute left-3 top-3 text-slate-400 group-focus-within:text-primary-400 transition-colors" size={20} />
                      <input 
                        type="text" 
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
                        placeholder="Enter username"
                        required
                      />
                  </div>
              </div>

              <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Password</label>
                  <div className="relative group">
                      <Lock className="absolute left-3 top-3 text-slate-400 group-focus-within:text-primary-400 transition-colors" size={20} />
                      <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
                        placeholder="Enter password"
                        required
                      />
                  </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-primary-500/25 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                  {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-xs text-slate-400 mb-2">Default Credentials</p>
              <div className="flex justify-center gap-4 text-xs font-mono text-primary-300">
                  <span className="bg-slate-800/50 px-2 py-1 rounded">admin / 123</span>
                  <span className="bg-slate-800/50 px-2 py-1 rounded">staff / 123</span>
              </div>
          </div>
       </div>
    </div>
  );
};

export default Login;
