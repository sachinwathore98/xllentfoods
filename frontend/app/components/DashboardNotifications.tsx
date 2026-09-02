'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { Bell, AlertTriangle } from 'lucide-react';

export default function DashboardNotifications() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      fetchExpiryAlerts(u.id);
    }
  }, []);

  const fetchExpiryAlerts = async (userId: number) => {
    try {
      const res = await API.get(`/api/notifications/expiry/${userId}`);
      setAlerts(res.data.alerts || []);
    } catch (err) {
      console.error('Error fetching expiry notifications', err);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setShowModal(!showModal)}
        className="relative p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition text-slate-700 shadow-sm cursor-pointer"
        title="Expiry & Stock Notifications"
      >
        <Bell className="w-5 h-5 text-amber-600" />
        {alerts.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-bounce">
            {alerts.length}
          </span>
        )}
      </button>

      {showModal && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 z-50 animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Expiry & Refund Alerts
            </h4>
            <span className="text-[10px] sm:text-xs font-extrabold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg">60-Day Policy</span>
          </div>

          {alerts.length === 0 ? (
            <p className="text-xs sm:text-sm text-slate-400 text-center py-6">No products approaching expiration date.</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {alerts.map((alert) => (
                <div key={alert.id} className="bg-rose-50/70 border border-rose-200 p-3.5 rounded-2xl text-xs sm:text-sm space-y-1">
                  <p className="font-extrabold text-rose-900">{alert.name} (SKU: {alert.sku})</p>
                  <p className="text-rose-700 font-semibold">⚠️ Expiry Date: {alert.expiry_date?.substring(0, 10)} ({alert.days_remaining} days left)</p>
                  <p className="text-xs text-rose-600 font-medium">Sale this product immediately or initiate 60-day refund/return process with your supplier.</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}