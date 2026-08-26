'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { Percent, ShieldCheck, Edit3, Save, X, CheckCircle2 } from 'lucide-react';

export default function PricingTiersPage() {
  const [tiers, setTiers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [notification, setNotification] = useState('');

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      const res = await API.get('/api/admin/pricing-tiers');
      setTiers(res.data.tiers || []);
    } catch (err) {
      console.error('Error fetching tiers:', err);
    }
  };

  const handleEdit = (tier) => {
    setEditingId(tier.id);
    setEditForm({ ...tier });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: name === 'base_discount' || name === 'min_order_value' ? Number(value) : value,
    }));
  };

  const handleSave = async (id) => {
    try {
      await API.put(`/api/admin/pricing-tiers/${id}`, {
        baseDiscount: editForm.base_discount,
        minOrderValue: editForm.min_order_value,
        paymentTerms: editForm.payment_terms,
        status: editForm.status
      });
      setEditingId(null);
      fetchTiers();
      setNotification('Pricing tier updated in cloud successfully.');
      setTimeout(() => setNotification(''), 3000);
    } catch (err) {
      alert('Failed to update pricing tier');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Percent className="w-7 h-7 text-indigo-400" />
            Pricing Tiers & Wholesale Brackets
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure partner role discounts, minimum wholesale order values, and credit terms.
          </p>
        </div>
      </div>

      {notification && (
        <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const isEditing = editingId === tier.id;

          return (
            <div key={tier.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-80" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    {tier.status}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-white mb-1">{tier.role_name}</h3>
                <p className="text-xs text-slate-400 min-h-[32px] mb-6">{tier.description}</p>

                <div className="space-y-4">
                  <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
                    <span className="text-xs text-slate-400 block mb-1">Base Wholesale Discount</span>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          name="base_discount"
                          value={editForm.base_discount}
                          onChange={handleChange}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                        />
                        <span className="text-sm text-slate-400">%</span>
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-indigo-400">
                        {tier.base_discount}% <span className="text-xs font-normal text-slate-500">OFF</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
                    <span className="text-xs text-slate-400 block mb-1">Minimum Order Value (MOV)</span>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-slate-400">₹</span>
                        <input
                          type="number"
                          name="min_order_value"
                          value={editForm.min_order_value}
                          onChange={handleChange}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                        />
                      </div>
                    ) : (
                      <div className="text-base font-semibold text-white">
                        ₹{parseFloat(String(tier.min_order_value)).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
                    <span className="text-xs text-slate-400 block mb-1">Credit / Payment Terms</span>
                    {isEditing ? (
                      <input
                        type="text"
                        name="payment_terms"
                        value={editForm.payment_terms}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                      />
                    ) : (
                      <div className="text-sm font-medium text-slate-200">
                        {tier.payment_terms}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                {isEditing ? (
                  <>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                    <button onClick={() => handleSave(tier.id)} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium flex items-center gap-1">
                      <Save className="w-3.5 h-3.5" /> Save
                    </button>
                  </>
                ) : (
                  <button onClick={() => handleEdit(tier)} className="w-full py-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white text-xs font-medium transition flex items-center justify-center gap-1.5 border border-slate-700/50 cursor-pointer">
                    <Edit3 className="w-3.5 h-3.5" /> Edit Bracket Rules
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}