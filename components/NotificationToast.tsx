import React from 'react';
import { useStore } from '../context/StoreContext';
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

const NotificationToast: React.FC = () => {
  const { notifications, removeNotification } = useStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {notifications.map((notification) => (
        <div 
          key={notification.id}
          className={`pointer-events-auto min-w-[300px] max-w-md bg-white rounded-lg shadow-lg border-l-4 p-4 flex items-start gap-3 animate-slide-in ${
            notification.type === 'info' ? 'border-blue-500' :
            notification.type === 'success' ? 'border-green-500' :
            notification.type === 'warning' ? 'border-amber-500' :
            'border-red-500'
          }`}
        >
          <div className={`mt-0.5 ${
            notification.type === 'info' ? 'text-blue-500' :
            notification.type === 'success' ? 'text-green-500' :
            notification.type === 'warning' ? 'text-amber-500' :
            'text-red-500'
          }`}>
            {notification.type === 'info' && <Info size={20} />}
            {notification.type === 'success' && <CheckCircle size={20} />}
            {notification.type === 'warning' && <AlertTriangle size={20} />}
            {notification.type === 'error' && <AlertCircle size={20} />}
          </div>
          
          <div className="flex-1">
            <p className="font-medium text-slate-800 text-sm leading-snug">{notification.message}</p>
            <p className="text-[10px] text-gray-400 mt-1">{notification.timestamp.toLocaleTimeString()}</p>
          </div>

          <button 
            onClick={() => removeNotification(notification.id)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;