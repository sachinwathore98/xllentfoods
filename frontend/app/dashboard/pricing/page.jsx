'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { Percent, DollarSign, CheckCircle2, ShieldCheck, Store, Truck } from 'lucide-react';

export default function PricingTiersPage() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [roleTarget, setRoleTarget] = useState('shop');
  const [customPrice, setCustomPrice] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await API.get('/api/admin/products');
      const list = res.data.products || [];
      setProducts(list);
      if (list.length > 0) {
        setSelectedProduct(list[0].id);
        setCustomPrice(list[0].mrp);
      }
    } catch (err) {
      console.error('Error fetching products for pricing', err);
    }
  };

  const handleProductChange = (productId) => {
    setSelectedProduct(productId);
    const prod = products.find(p => String(p.id) === String(productId));
    if (prod) {
      setCustomPrice(prod.mrp);
    }
  };

  const handleSavePricing = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;

      await API.post('/api/pricing/set', {
        productId: Number(selectedProduct),
        roleTarget,
        ownerId: currentUser?.id || 1,
        customPrice: Number(customPrice)
      });

      setMessage('Custom pricing bracket successfully updated in the network database!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage('Failed to update custom pricing bracket.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto text-slate-800 min-h-screen bg-slate-50">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Percent className="w-8 h-8 text-amber-600" /> Custom Pricing & Margin Control
        </h1>
        <p className="text-sm text-slate-500 mt-1">Set customized wholesale and purchase pricing brackets for specific downline tiers and partners.</p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-amber-600" /> Configure Tier Pricing Bracket
        </h3>

        <form onSubmit={handleSavePricing} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Product</label>
              <select
                value={selectedProduct}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 text-black bg-white"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Base MRP: ₹{p.mrp})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Target Downline Role</label>
              <select
                value={roleTarget}
                onChange={(e) => setRoleTarget(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 text-black bg-white"
              >
                <option value="super_stockist">Super Stockist Tier</option>
                <option value="distributor">Distributor Tier</option>
                <option value="shop">Retail Shop / Storefront</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Custom Wholesale Price (₹)</label>
            <input
              type="number"
              step="0.01"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Enter custom agreed rate"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">This price will automatically apply when partners belonging to the selected tier checkout items.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-amber-600 text-white font-bold rounded-xl shadow-lg hover:bg-amber-700 transition text-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Saving Pricing Rules...' : 'Save Custom Pricing Bracket'}
          </button>
        </form>
      </div>
    </div>
  );
}