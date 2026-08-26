'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { Package, Plus, FolderPlus, Tag } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  category: string;
  sku: string;
  mrp: number;
  status: string;
}

interface Category {
  id: number;
  name: string;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  
  // New Product Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [sku, setSku] = useState('');
  const [mrp, setMrp] = useState<number>(0);
  const [status, setStatus] = useState('In Stock');

  // New Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchProducts('All');
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await API.get('/api/categories');
      const fetchedCats = res.data.categories || [];
      setCategories(fetchedCats);
      if (fetchedCats.length > 0 && !category) {
        setCategory(fetchedCats[0].name);
      }
    } catch (err) {
      console.error('Error loading categories', err);
    }
  };

  const fetchProducts = async (cat: string) => {
    try {
      const res = await API.get(`/api/admin/products?category=${cat}`);
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Error loading products', err);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      await API.post('/api/admin/categories', { name: newCatName });
      setMessage('Category added successfully and propagated!');
      setNewCatName('');
      fetchCategories();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to add category.');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await API.post('/api/admin/products', { name, category, sku, mrp, status });
      setMessage('Product added successfully and synced to public catalog!');
      setName('');
      setSku('');
      setMrp(0);
      fetchProducts(selectedCategoryFilter);
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to add product.');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto text-slate-800 min-h-screen bg-slate-50">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Package className="w-8 h-8 text-amber-600" /> Inventory & Catalog Propagation
        </h1>
        <p className="text-sm text-slate-500 mt-1">Manage categories and product catalogs visible globally across network portals and the public website.</p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">
          {message}
        </div>
      )}

      {/* Creation Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Add Category Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-amber-600" /> Add New Category
          </h3>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Category Name</label>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                required
                placeholder="e.g. Organic Beverages"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button type="submit" className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition">
              Create Category
            </button>
          </form>
        </div>

        {/* Add Product Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-600" /> Add New Product
          </h3>
          <form onSubmit={handleAddProduct} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Item Name" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none">
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">SKU</label>
                <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} required placeholder="SKU-01" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">MRP (₹)</label>
                <input type="number" value={mrp} onChange={(e) => setMrp(Number(e.target.value))} required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none">
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full py-2.5 bg-amber-600 text-white font-bold rounded-xl text-xs hover:bg-amber-700 transition mt-2">
              Add Product to Global Catalog
            </button>
          </form>
        </div>
      </div>

      {/* Product Catalog List */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-600" /> Active Catalog Inventory
          </h3>
          <div className="flex gap-2">
            {['All', ...categories.map(c => c.name)].map(cat => (
              <button
                key={cat}
                onClick={() => { setSelectedCategoryFilter(cat); fetchProducts(cat); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${selectedCategoryFilter === cat ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md uppercase">{p.category}</span>
                  <span className="text-xs font-extrabold text-slate-900">₹{p.mrp}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">{p.name}</h4>
                <p className="text-xs text-slate-500 mt-1">SKU: {p.sku}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Status:</span>
                <span className="font-bold text-emerald-600">{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}