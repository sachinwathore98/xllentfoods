'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { Sliders, User, CheckCircle2, Save } from 'lucide-react';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  location?: string;
}

interface ProductPricing {
  product_id: number;
  name: string;
  sku: string;
  category: string;
  mrp: number;
  effective_price: number;
  custom_price: number | null;
}

export default function CustomPricingPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [pricingList, setPricingList] = useState<ProductPricing[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserPricing(selectedUserId);
    } else {
      setPricingList([]);
    }
  }, [selectedUserId]);

  const fetchUsers = async () => {
    try {
      const res = await API.get('/api/admin/users-list');
      setUsers(res.data.users || []);
      if (res.data.users?.length > 0) {
        setSelectedUserId(res.data.users[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load users list', err);
    }
  };

  const fetchUserPricing = async (userId: string) => {
    try {
      setLoading(true);
      const res = await API.get(`/api/downline-pricing/${userId}`);
      setPricingList(res.data.pricing || []);
    } catch (err) {
      console.error('Failed to load user pricing', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (productId: number, val: string) => {
    setPricingList(pricingList.map(item => 
      item.product_id === productId ? { ...item, custom_price: val === '' ? null : Number(val) } : item
    ));
  };

  const handleSavePrice = async (productId: number, customPrice: number | null) => {
    if (customPrice === null) return;
    try {
      await API.post('/api/downline-pricing/set-user-price', {
        userId: Number(selectedUserId),
        productId,
        customPrice
      });
      setMessage('Rate updated successfully for this user!');
      setTimeout(() => setMessage(''), 3000);
      fetchUserPricing(selectedUserId);
    } catch (err) {
      alert('Failed to update price.');
    }
  };

  const selectedUser = users.find(u => u.id.toString() === selectedUserId);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto text-slate-800 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Sliders className="w-8 h-8 text-amber-600" /> Per-User Custom Pricing Matrix
        </h1>
        <p className="text-sm text-slate-500 mt-1">Select a specific network partner and customize product rates exclusively for them.</p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Partner Selector */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Select Partner Account</label>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full">
            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.toUpperCase()}) — {u.email} {u.location ? `• ${u.location}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Pricing Table for Selected User */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Product Rate Sheet {selectedUser ? `for ${selectedUser.name}` : ''}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Changes made here apply only to this specific partner account.</p>
          </div>
          {selectedUser && (
            <span className="text-xs uppercase font-bold px-3 py-1 bg-amber-100 text-amber-800 rounded-lg">
              Role: {selectedUser.role}
            </span>
          )}
        </div>

        {loading ? (
          <p className="text-center py-16 text-xs text-slate-400 font-medium">Loading partner product rates...</p>
        ) : pricingList.length === 0 ? (
          <p className="text-center py-16 text-xs text-slate-400 font-medium">No products available in inventory.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Product Name & SKU</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">MRP (₹)</th>
                  <th className="p-4">Custom Rate for Partner (₹)</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {pricingList.map((item) => (
                  <tr key={item.product_id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-[10px] text-slate-400">SKU: {item.sku}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 font-bold text-slate-600 rounded-md uppercase text-[10px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-500">₹{item.mrp}</td>
                    <td className="p-4">
                      <input
                        type="number"
                        value={item.custom_price !== null ? item.custom_price : item.effective_price}
                        onChange={(e) => handlePriceChange(item.product_id, e.target.value)}
                        className="w-36 px-3 py-2 bg-amber-50 border border-amber-300 rounded-xl font-black text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleSavePrice(item.product_id, item.custom_price !== null ? item.custom_price : item.effective_price)}
                        className="px-4 py-2 bg-slate-900 hover:bg-amber-600 text-white rounded-xl font-bold transition flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" /> Save Rate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}