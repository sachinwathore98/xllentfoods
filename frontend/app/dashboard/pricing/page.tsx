'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { DollarSign, Save, Shield, User, Users } from 'lucide-react';

export default function DownstreamPricingPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [pricing, setPricing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchDownlineUsers();
  }, []);

  const fetchDownlineUsers = async () => {
    try {
      setLoading(true);
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = storedUser.id;
      const role = storedUser.role;

      const res = await API.get(`/api/admin/downline-users?userId=${userId}&role=${role}`);
      const fetchedUsers = res.data.users || [];
      setUsers(fetchedUsers);

      if (fetchedUsers.length > 0) {
        setSelectedUser(fetchedUsers[0]);
        fetchPricing(fetchedUsers[0].id);
      }
    } catch (err) {
      console.error('Error fetching downline users', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPricing = async (targetUserId: number) => {
    try {
      const res = await API.get(`/api/downline-pricing/${targetUserId}`);
      setPricing(res.data.pricing || []);
    } catch (err) {
      console.error('Error fetching pricing', err);
    }
  };

  const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = Number(e.target.value);
    const found = users.find((u) => u.id === userId);
    if (found) {
      setSelectedUser(found);
      fetchPricing(found.id);
    }
  };

  const handlePriceChange = (productId: number, val: string) => {
    setPricing((prev) =>
      prev.map((item) => (item.product_id === productId ? { ...item, custom_price: val } : item))
    );
  };

  const handleSavePrice = async (productId: number, customPrice: number) => {
    try {
      await API.post('/api/downline-pricing/set-user-price', {
        userId: selectedUser.id,
        productId,
        customPrice: Number(customPrice),
      });
      setSuccessMsg(`Pricing successfully updated for ${selectedUser.name}`);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchPricing(selectedUser.id);
    } catch (err) {
      setErrorMsg('Failed to update pricing');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
          Supply Chain Hierarchy
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Downstream Pricing & Rate Sheets</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage custom product rate sheets and margins for your authorized downstream partner accounts.
        </p>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold shadow-sm">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold shadow-sm">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-400 text-xs font-semibold animate-pulse">Loading partner network...</div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">No downstream partner accounts found.</p>
          <p className="text-xs text-slate-400 mt-1">Provision downstream accounts to configure custom rate sheets.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Partner Selector Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <label className="text-xs font-extrabold uppercase text-slate-400 tracking-wider block mb-3">
              Select Partner Account
            </label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 w-4 h-4 text-amber-600" />
              <select
                value={selectedUser?.id || ''}
                onChange={handleUserSelect}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role.replace('_', ' ').toUpperCase()}) — {u.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rate Sheet Table Card */}
          {selectedUser && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Product Rate Sheet for {selectedUser.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Changes made here apply exclusively to this partner account.</p>
                </div>
                <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-3 py-1 rounded-xl uppercase tracking-wider">
                  Role: {selectedUser.role.replace('_', ' ')}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase font-extrabold text-[10px]">
                      <th className="pb-3">Product Name & SKU</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">MRP (₹)</th>
                      <th className="pb-3">Custom Rate for Partner (₹)</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pricing.map((item) => (
                      <tr key={item.product_id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4">
                          <p className="font-extrabold text-slate-900">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</p>
                        </td>
                        <td className="py-4">
                          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-4 font-black text-slate-700">₹{item.mrp}</td>
                        <td className="py-4">
                          <input
                            type="number"
                            value={item.custom_price !== null && item.custom_price !== undefined ? item.custom_price : item.effective_price || 0}
                            onChange={(e) => handlePriceChange(item.product_id, e.target.value)}
                            className="w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                          />
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => handleSavePrice(item.product_id, item.custom_price !== undefined ? item.custom_price : item.effective_price)}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" /> Save Rate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}