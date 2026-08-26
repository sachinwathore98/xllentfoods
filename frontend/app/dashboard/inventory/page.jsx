'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';

export default function DashboardInventoryPage() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Confectionery');
  const [sku, setSku] = useState('');
  const [mrp, setMrp] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/api/admin/products?category=${selectedCategory}`);
      setProducts(res.data.products);
    } catch (err) {
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await API.post('/api/admin/products', { name, category, sku, mrp: parseFloat(mrp) });
      setName('');
      setSku('');
      setMrp('');
      fetchProducts();
      alert('Product added successfully!');
    } catch (err) {
      alert('Failed to add product');
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Inventory & Category Catalog</h1>
          <p className="text-sm text-slate-500">Manage stock availability, SKUs, and distribution categories</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Add Product Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Add Catalog Item</h2>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Product Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                className="w-full px-3 py-2 border rounded-lg text-sm text-black outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="e.g. Xllent Butter Cookies"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Category</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm text-black bg-white outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Confectionery">Confectionery</option>
                <option value="Snacks">Snacks</option>
                <option value="Namkeen">Namkeen</option>
                <option value="Candies">Candies</option>
                <option value="Dry Fruits">Dry Fruits</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">SKU Code</label>
              <input 
                type="text" 
                value={sku} 
                onChange={(e) => setSku(e.target.value)} 
                required 
                className="w-full px-3 py-2 border rounded-lg text-sm text-black outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="e.g. XEL-BC-07"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">MRP (₹)</label>
              <input 
                type="number" 
                value={mrp} 
                onChange={(e) => setMrp(e.target.value)} 
                required 
                className="w-full px-3 py-2 border rounded-lg text-sm text-black outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="150"
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-amber-600 text-white font-semibold py-2 rounded-lg hover:bg-amber-700 transition-colors"
            >
              Save Product
            </button>
          </form>
        </div>

        {/* Catalog Table & Category Filtering */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900">Inventory Catalog</h2>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm text-black font-medium bg-slate-50 outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="All">All Categories</option>
              <option value="Confectionery">Confectionery</option>
              <option value="Snacks">Snacks</option>
              <option value="Namkeen">Namkeen</option>
              <option value="Candies">Candies</option>
              <option value="Dry Fruits">Dry Fruits</option>
            </select>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500 py-12 text-center">Loading items...</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-slate-500 py-12 text-center">No products found under this category.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-xs uppercase text-slate-400 font-semibold">
                    <th className="pb-3">Product Name</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">SKU</th>
                    <th className="pb-3">MRP</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {products.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-3 font-medium text-slate-800">{item.name}</td>
                      <td className="py-3">
                        <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">{item.sku}</td>
                      <td className="py-3 font-semibold text-slate-900">₹{item.mrp}</td>
                      <td className="py-3">
                        <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-semibold">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}