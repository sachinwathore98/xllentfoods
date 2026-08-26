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
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  
  // Product Form States
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [sku, setSku] = useState('');
  const [mrp, setMrp] = useState<number>(0);
  const [superStockistPrice, setSuperStockistPrice] = useState<number>(0);
  const [distributorPrice, setDistributorPrice] = useState<number>(0);
  const [shopPrice, setShopPrice] = useState<number>(0);
  const [image, setImage] = useState('');
  const [status, setStatus] = useState('In Stock');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    const res = await API.get('/api/categories');
    setCategories(res.data.categories || []);
    if (res.data.categories?.length > 0) setCategory(res.data.categories[0].name);
  };

  const fetchProducts = async () => {
    const res = await API.get('/api/admin/products');
    setProducts(res.data.products || []);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await API.post('/api/admin/products', {
        name, category, sku, mrp, superStockistPrice, distributorPrice, shopPrice, status, image
      });
      setMessage('Product added successfully with hierarchical pricing and image!');
      setName(''); setSku(''); setMrp(0); setSuperStockistPrice(0); setDistributorPrice(0); setShopPrice(0); setImage('');
      fetchProducts();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage('Failed to add product.');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto text-slate-800 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
        <Package className="w-8 h-8 text-amber-600" /> Catalog & Hierarchical Pricing Management
      </h1>

      {message && <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">{message}</div>}

      {/* Add Product Form with Tier Pricing & Images */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-amber-600" /> Add Product with Tier Pricing & Image URL
        </h3>
        <form onSubmit={handleAddProduct} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Item Name" className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs outline-none">
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
              <label className="block text-xs font-bold text-amber-700 uppercase mb-1">Super Stockist Price (₹)</label>
              <input type="number" value={superStockistPrice} onChange={(e) => setSuperStockistPrice(Number(e.target.value))} required className="w-full px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-blue-700 uppercase mb-1">Distributor Price (₹)</label>
              <input type="number" value={distributorPrice} onChange={(e) => setDistributorPrice(Number(e.target.value))} required className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-emerald-700 uppercase mb-1">Shop Price (₹)</label>
              <input type="number" value={shopPrice} onChange={(e) => setShopPrice(Number(e.target.value))} required className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Image URL</label>
            <input type="url" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://example.com/product-image.jpg" className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs outline-none" />
          </div>

          <button type="submit" className="w-full py-3 bg-amber-600 text-white font-bold rounded-xl text-xs hover:bg-amber-700 transition">
            Save Product with All Hierarchy Prices
          </button>
        </form>
      </div>

      {/* Product Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map(p => (
          <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            {p.image && <img src={p.image} alt={p.name} className="w-full h-40 object-cover rounded-xl mb-2" />}
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md uppercase">{p.category}</span>
              <span className="text-xs font-bold text-slate-500">MRP: ₹{p.mrp}</span>
            </div>
            <h4 className="font-bold text-base text-slate-900">{p.name}</h4>
            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between"><span>Super Stockist:</span> <span className="font-bold text-amber-600">₹{p.super_stockist_price}</span></div>
              <div className="flex justify-between"><span>Distributor:</span> <span className="font-bold text-blue-600">₹{p.distributor_price}</span></div>
              <div className="flex justify-between"><span>Retail Shop:</span> <span className="font-bold text-emerald-600">₹{p.shop_price}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}