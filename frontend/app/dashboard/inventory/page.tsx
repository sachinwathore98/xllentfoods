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
  super_stockist_price: number;
  distributor_price: number;
  shop_price: number;
  status: string;
  image?: string;
  description?: string;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  
  // Category Form State
  const [newCatName, setNewCatName] = useState('');

  // Product Form States
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [sku, setSku] = useState('');
  const [mrp, setMrp] = useState<number>(0);
  const [superStockistPrice, setSuperStockistPrice] = useState<number>(0);
  const [distributorPrice, setDistributorPrice] = useState<number>(0);
  const [shopPrice, setShopPrice] = useState<number>(0);
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('In Stock');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await API.get('/api/categories');
      const cats = res.data.categories || [];
      setCategories(cats);
      if (cats.length > 0 && !category) setCategory(cats[0].name);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await API.get('/api/admin/products');
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      await API.post('/api/admin/categories', { name: newCatName });
      setMessage('Category added successfully!');
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
      await API.post('/api/admin/products', {
        name, category, sku, mrp, superStockistPrice, distributorPrice, shopPrice, status, image, description
      });
      setMessage('Product added successfully with tier pricing and description!');
      setName(''); setSku(''); setMrp(0); setSuperStockistPrice(0); setDistributorPrice(0); setShopPrice(0); setImage(''); setDescription('');
      fetchProducts();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage('Failed to add product.');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto text-slate-800 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Package className="w-8 h-8 text-amber-600" /> Inventory, Categories & Hierarchical Pricing
        </h1>
        <p className="text-sm text-slate-500 mt-1">Manage categories, product descriptions, and multi-tier pricing structures.</p>
      </div>

      {message && <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">{message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Add Category Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-amber-600" /> Add Product Category
          </h3>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category Name</label>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                required
                placeholder="e.g. Beverages"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>
            <button type="submit" className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition">
              Create Category
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Existing Categories ({categories.length})</h4>
            <div className="flex flex-wrap gap-1.5">
              {categories.map(c => (
                <span key={c.id} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">{c.name}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Add Product Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-600" /> Add New Product & Tier Prices
          </h3>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Item Name" className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs outline-none bg-white">
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">SKU</label>
                <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} required placeholder="SKU-01" className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">MRP (₹)</label>
                <input type="number" value={mrp} onChange={(e) => setMrp(Number(e.target.value))} required className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-700 uppercase mb-1">Super Stockist (₹)</label>
                <input type="number" value={superStockistPrice} onChange={(e) => setSuperStockistPrice(Number(e.target.value))} required className="w-full px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-700 uppercase mb-1">Distributor (₹)</label>
                <input type="number" value={distributorPrice} onChange={(e) => setDistributorPrice(Number(e.target.value))} required className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-emerald-700 uppercase mb-1">Shop Price (₹)</label>
                <input type="number" value={shopPrice} onChange={(e) => setShopPrice(Number(e.target.value))} required className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Image URL</label>
                <input type="url" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief product details..." className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs outline-none" />
              </div>
            </div>

            <button type="submit" className="w-full py-3 bg-amber-600 text-white font-bold rounded-xl text-xs hover:bg-amber-700 transition">
              Save Product to Catalog
            </button>
          </form>
        </div>

      </div>

      {/* Catalog Display Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <Tag className="w-5 h-5 text-amber-600" /> Active Inventory Catalog
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map(p => (
            <div key={p.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
              <div>
                {p.image && <img src={p.image} alt={p.name} className="w-full h-36 object-cover rounded-xl mb-3 bg-white" />}
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md uppercase">{p.category}</span>
                  <span className="text-xs font-bold text-slate-500">MRP: ₹{p.mrp}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">{p.name}</h4>
                {p.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>}
              </div>

              <div className="p-3 bg-white rounded-xl space-y-1 text-xs border border-slate-100">
                <div className="flex justify-between"><span>Super Stockist:</span> <span className="font-bold text-amber-600">₹{p.super_stockist_price}</span></div>
                <div className="flex justify-between"><span>Distributor:</span> <span className="font-bold text-blue-600">₹{p.distributor_price}</span></div>
                <div className="flex justify-between"><span>Retail Shop:</span> <span className="font-bold text-emerald-600">₹{p.shop_price}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}