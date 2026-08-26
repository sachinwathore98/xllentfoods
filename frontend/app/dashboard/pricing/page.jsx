'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { Percent, DollarSign, CheckCircle2 } from 'lucide-react';

export default function DownlinePricingPage() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [targetRole, setTargetRole] = useState('shop');
  const [customPrice, setCustomPrice] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await API.get('/api/admin/products');
    setProducts(res.data.products || []);
    if (res.data.products?.length > 0) {
      setSelectedProduct(res.data.products[0].id);
      setCustomPrice(res.data.products[0].shop_price);
    }
  };

  const handleSaveOverride = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    try {
      await API.post('/api/downline-pricing/set', {
        productId: Number(selectedProduct),
        ownerId: user.id,
        targetRole,
        customPrice: Number(customPrice)
      });
      setMessage('Custom downline price updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to update price override.');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-black text-slate-900 mb-6 flex items-center gap-2">
        <Percent className="w-8 h-8 text-amber-600" /> Manage Downline Pricing
      </h1>

      {message && <div className="p-4 mb-4 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl">{message}</div>}

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSaveOverride} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase mb-1">Select Product</label>
            <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm bg-white">
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1">Target Downline Tier</label>
            <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm bg-white">
              <option value="distributor">Distributor</option>
              <option value="shop">Retail Shop</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1">Custom Selling Price (₹)</label>
            <input type="number" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} required className="w-full px-3 py-2 border rounded-xl text-sm" />
          </div>
          <button type="submit" className="w-full py-3 bg-amber-600 text-white font-bold rounded-xl text-xs hover:bg-amber-700">
            Update Downline Pricing
          </button>
        </form>
      </div>
    </div>
  );
}