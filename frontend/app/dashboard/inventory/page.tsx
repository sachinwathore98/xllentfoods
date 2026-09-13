'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { Package, Plus, FolderPlus, Tag, Edit3, X, Trash2 } from 'lucide-react';

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
  pieces_per_packet: number;
  packets_per_carton: number;
  gst_percent: number;
}

interface Category {
  id: number;
  name: string;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [catName, setCatName] = useState('');

  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [sku, setSku] = useState('');
  const [mrp, setMrp] = useState<number>(0);
  const [superStockistPrice, setSuperStockistPrice] = useState<number>(0);
  const [distributorPrice, setDistributorPrice] = useState<number>(0);
  const [shopPrice, setShopPrice] = useState<number>(0);
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [piecesPerPacket, setPiecesPerPacket] = useState<number>(1);
  const [packetsPerCarton, setPacketsPerCarton] = useState<number>(1);
  const [gstPercent, setGstPercent] = useState<number>(0);
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

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;
    try {
      if (editingCatId) {
        await API.put(`/api/admin/categories/${editingCatId}`, { name: catName });
        setMessage('Category updated successfully!');
      } else {
        await API.post('/api/admin/categories', { name: catName });
        setMessage('Category added successfully!');
      }
      setCatName('');
      setEditingCatId(null);
      fetchCategories();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Operation failed.');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await API.delete(`/api/admin/categories/${id}`);
      setMessage('Category deleted successfully!');
      fetchCategories();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to delete category.');
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { 
      name, category, sku, mrp, superStockistPrice, distributorPrice, shopPrice, 
      status, image, description, piecesPerPacket, packetsPerCarton, gstPercent 
    };
    try {
      if (editingProductId) {
        await API.put(`/api/admin/products/${editingProductId}`, payload);
        setMessage('Product updated successfully!');
      } else {
        await API.post('/api/admin/products', payload);
        setMessage('Product added successfully!');
      }
      resetProductForm();
      fetchProducts();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage('Operation failed.');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product from the catalog?')) return;
    try {
      await API.delete(`/api/admin/products/${id}`);
      setMessage('Product deleted successfully!');
      fetchProducts();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to delete product.');
    }
  };

  const startEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
  };

  const startEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setName(prod.name);
    setCategory(prod.category);
    setSku(prod.sku);
    setMrp(prod.mrp);
    setSuperStockistPrice(prod.super_stockist_price);
    setDistributorPrice(prod.distributor_price);
    setShopPrice(prod.shop_price);
    setStatus(prod.status || 'In Stock');
    setImage(prod.image || '');
    setDescription(prod.description || '');
    setPiecesPerPacket(prod.pieces_per_packet || 1);
    setPacketsPerCarton(prod.packets_per_carton || 1);
    setGstPercent(prod.gst_percent || 0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setName(''); setSku(''); setMrp(0); setSuperStockistPrice(0); setDistributorPrice(0); setShopPrice(0); setImage(''); setDescription('');
    setPiecesPerPacket(1); setPacketsPerCarton(1); setGstPercent(0);
  };

  const filteredCatalogProducts = selectedCategoryFilter === 'All'
    ? products
    : products.filter(p => p.category === selectedCategoryFilter);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-slate-800 bg-slate-50 min-h-screen">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Package className="w-8 h-8 text-amber-600" /> Inventory, Categories & Multi-Tier Pricing
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Manage categories, product descriptions, packing ratios, GST percentages, and corporate tier pricing structures.</p>
      </div>

      {message && <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-2xl shadow-sm">{message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Category Form Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm h-fit space-y-5">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wide">
              <FolderPlus className="w-4 h-4 text-amber-600" /> {editingCatId ? 'Edit Category' : 'Add Category'}
            </h3>
            {editingCatId && (
              <button onClick={() => { setEditingCatId(null); setCatName(''); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1.5">Category Name</label>
              <input
                type="text"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                required
                placeholder="e.g. Confectionery"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-amber-500 shadow-inner"
              />
            </div>
            <button type="submit" className="w-full py-3 bg-slate-900 text-white font-extrabold rounded-2xl text-xs hover:bg-slate-800 transition shadow-md cursor-pointer">
              {editingCatId ? 'Update Category' : 'Create Category'}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Existing Categories ({categories.length})</h4>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <div key={c.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold shadow-sm">
                  <span>{c.name}</span>
                  <button onClick={() => startEditCategory(c)} className="text-amber-600 hover:text-amber-700 p-0.5 cursor-pointer" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDeleteCategory(c.id)} className="text-rose-600 hover:text-rose-700 p-0.5 ml-1 cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Product Form Section */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wide">
              <Plus className="w-4 h-4 text-amber-600" /> {editingProductId ? 'Edit Product Details' : 'Add New Product & Tier Prices'}
            </h3>
            {editingProductId && (
              <button onClick={resetProductForm} className="text-xs text-rose-600 font-bold flex items-center gap-1 hover:underline cursor-pointer">
                <X className="w-3.5 h-3.5" /> Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleProductSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1.5">Product Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Item Name" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-amber-500 shadow-inner" />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1.5">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-amber-500 bg-white cursor-pointer shadow-sm">
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1.5">SKU</label>
                <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} required placeholder="SKU-01" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-amber-500 shadow-inner" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1.5">MRP (₹)</label>
                <input type="number" value={mrp} onChange={(e) => setMrp(Number(e.target.value))} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-900 outline-none focus:border-amber-500 shadow-inner" />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-amber-700 uppercase mb-1.5">Super Stockist (₹)</label>
                <input type="number" value={superStockistPrice} onChange={(e) => setSuperStockistPrice(Number(e.target.value))} required className="w-full px-4 py-3 bg-amber-50/50 border border-amber-200 rounded-2xl text-xs font-black text-amber-900 outline-none focus:border-amber-500 shadow-inner" />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-blue-700 uppercase mb-1.5">Distributor (₹)</label>
                <input type="number" value={distributorPrice} onChange={(e) => setDistributorPrice(Number(e.target.value))} required className="w-full px-4 py-3 bg-blue-50/50 border border-blue-200 rounded-2xl text-xs font-black text-blue-900 outline-none focus:border-amber-500 shadow-inner" />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-emerald-700 uppercase mb-1.5">Shop Price (₹)</label>
                <input type="number" value={shopPrice} onChange={(e) => setShopPrice(Number(e.target.value))} required className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl text-xs font-black text-emerald-900 outline-none focus:border-amber-500 shadow-inner" />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-purple-700 uppercase mb-1.5">GST %</label>
                <input type="number" step="0.01" value={gstPercent} onChange={(e) => setGstPercent(Number(e.target.value))} required placeholder="e.g. 5, 12, 18" className="w-full px-4 py-3 bg-purple-50/50 border border-purple-200 rounded-2xl text-xs font-black text-purple-900 outline-none focus:border-amber-500 shadow-inner" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1.5">Pieces per Packet</label>
                <input type="number" value={piecesPerPacket} onChange={(e) => setPiecesPerPacket(Number(e.target.value))} required className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none shadow-sm" />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1.5">Packets per Carton</label>
                <input type="number" value={packetsPerCarton} onChange={(e) => setPacketsPerCarton(Number(e.target.value))} required className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none shadow-sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1.5">Product Image URL</label>
                <input type="url" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none shadow-inner" />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1.5">Product Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief product details..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none shadow-inner" />
              </div>
            </div>

            <button type="submit" className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer">
              {editingProductId ? 'Update Product in Catalog' : 'Save Product to Catalog'}
            </button>
          </form>
        </div>

      </div>

      {/* Catalog Display Section */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
          <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-600" /> Active Inventory Catalog ({filteredCatalogProducts.length})
          </h3>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategoryFilter('All')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedCategoryFilter === 'All' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCategoryFilter(c.name)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedCategoryFilter === c.name ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {filteredCatalogProducts.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xs font-bold">No products found in this category.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCatalogProducts.map(p => (
              <div key={p.id} className="bg-slate-50/80 p-5 rounded-3xl border border-slate-200/80 space-y-4 flex flex-col justify-between shadow-sm hover:shadow-md transition">
                <div>
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-40 object-cover rounded-2xl mb-4 bg-white border border-slate-200/60" />
                  ) : (
                    <div className="w-full h-40 bg-slate-200 rounded-2xl mb-4 flex items-center justify-center text-slate-400">
                      <Package className="w-10 h-10" />
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-black px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg uppercase tracking-wider">{p.category}</span>
                    <span className="text-[11px] font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">GST: {p.gst_percent || 0}%</span>
                  </div>
                  
                  <h4 className="font-black text-base text-slate-900 tracking-tight">{p.name}</h4>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs font-bold text-slate-500">SKU: <span className="font-mono text-slate-700">{p.sku}</span></span>
                    <span className="text-xs font-black text-slate-900">MRP: ₹{p.mrp}</span>
                  </div>

                  {p.description && <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{p.description}</p>}
                  
                  <div className="mt-3 text-[11px] text-slate-700 bg-amber-50/80 p-2.5 rounded-2xl border border-amber-200/80 flex justify-between font-bold">
                    <span>📦 Pkt: {p.pieces_per_packet || 1} Pcs</span>
                    <span>📦 Ctn: {p.packets_per_carton || 1} Pkts</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-white rounded-2xl space-y-1.5 text-xs border border-slate-200/60 shadow-inner">
                    <div className="flex justify-between font-semibold"><span className="text-slate-500">Super Stockist:</span> <span className="font-black text-amber-600">₹{p.super_stockist_price}</span></div>
                    <div className="flex justify-between font-semibold"><span className="text-slate-500">Distributor:</span> <span className="font-black text-blue-600">₹{p.distributor_price}</span></div>
                    <div className="flex justify-between font-semibold"><span className="text-slate-500">Retail Shop:</span> <span className="font-black text-emerald-600">₹{p.shop_price}</span></div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => startEditProduct(p)} className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" /> Edit
                    </button>
                    <button onClick={() => handleDeleteProduct(p.id)} className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200 shadow-sm">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}