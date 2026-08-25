'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { Package, PlusCircle, CheckCircle2, AlertCircle, Layers } from 'lucide-react';

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Confectionery',
    sku: '',
    mrp: '',
    status: 'In Stock'
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await API.get('/products/public');
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      await API.post('/admin/products', formData);
      setMessage(`Successfully added ${formData.name} to inventory!`);
      setFormData({ name: '', category: 'Confectionery', sku: '', mrp: '', status: 'In Stock' });
      fetchProducts(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <span className="bg-amber-600 text-white p-2 rounded-xl font-black text-lg">X</span>
            <h1 className="font-extrabold text-lg tracking-tight">XELLENT DMS</h1>
          </div>
          <nav className="space-y-2">
            <a href="/dashboard/overview" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-xl text-sm font-medium text-slate-300 transition">
              Overview
            </a>
            <a href="/dashboard/inventory" className="flex items-center gap-3 px-4 py-3 bg-amber-600 rounded-xl text-sm font-semibold transition">
              Inventory & Stock
            </a>
            <a href="/dashboard/pricing" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-xl text-sm font-medium text-slate-300 transition">
              Partner Network
            </a>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-10 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Inventory & Stock Control</h2>
            <p className="text-sm text-slate-500">Monitor SKU availability, update catalogue items, and manage warehouse stock.</p>
          </div>
          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Layers className="w-4 h-4" /> Live Catalog Sync
          </span>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Product Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Add New Product SKU</h3>
                <p className="text-xs text-slate-500">Instantly populates public catalogue.</p>
              </div>
            </div>

            {message && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold p-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {message}
              </div>
            )}

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Xellent Rich Chocolate Bar" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 text-slate-900 font-medium"
                >
                  <option value="Confectionery">Confectionery</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Namkeen">Namkeen</option>
                  <option value="Candies">Candies</option>
                  <option value="Dry Fruits">Dry Fruits</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">SKU Code</label>
                  <input 
                    type="text" 
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="XEL-RCB-07" 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Retail MRP (₹)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                    placeholder="150" 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 text-slate-900"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 text-sm mt-2"
              >
                <span>{submitting ? 'Adding...' : 'Save Product SKU'}</span>
              </button>
            </form>
          </div>

          {/* Product Listing Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-base text-slate-900">Current Inventory Registry</h3>
              <span className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full">
                {products.length} Items Total
              </span>
            </div>

            <div className="flex-1 overflow-x-auto">
              {loading ? (
                <div className="text-center py-20 text-slate-400 text-sm">Loading inventory data...</div>
              ) : products.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-sm">No products found in database.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="py-3 px-6 font-bold">Product Name</th>
                      <th className="py-3 px-6 font-bold">Category</th>
                      <th className="py-3 px-6 font-bold">SKU</th>
                      <th className="py-3 px-6 font-bold">MRP</th>
                      <th className="py-3 px-6 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {products.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-6 font-semibold text-slate-900">{item.name}</td>
                        <td className="py-4 px-6 text-slate-500 text-xs font-bold uppercase">{item.category}</td>
                        <td className="py-4 px-6 text-slate-400 font-mono text-xs">{item.sku}</td>
                        <td className="py-4 px-6 font-black text-slate-900">₹{item.mrp}</td>
                        <td className="py-4 px-6">
                          <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-100">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}