'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { Package, Search, Boxes, AlertTriangle, ShoppingCart, CheckCircle2, PlusCircle, X } from 'lucide-react';
import Link from 'next/link';

interface ProductStock {
  product_id: number;
  name: string;
  category: string;
  sku: string;
  mrp: number;
  status: string;
  image?: string;
  pieces_per_packet: number;
  packets_per_carton: number;
  gst_percent: number;
  quantity: number;
}

export default function LiveInventoryStockPage() {
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [message, setMessage] = useState('');

  // Stock edit modal state for Super Stockist
  const [editingItem, setEditingItem] = useState<ProductStock | null>(null);
  const [inputQty, setInputQty] = useState<number>(0);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setCurrentUser(u);
      fetchData(u);
    }
  }, []);

  const fetchData = async (u: any) => {
    try {
      setLoading(true);
      const catRes = await API.get('/api/categories');
      setCategories(catRes.data.categories || []);

      const isSuperStockist = u.role === 'super_stockist';
      if (isSuperStockist) {
        const invRes = await API.get(`/api/partner/inventory/${u.id}`);
        setProducts(invRes.data.inventory || []);
      } else {
        const prodRes = await API.get('/api/products/public');
        const formatted = (prodRes.data.products || []).map((p: any) => ({
          ...p,
          product_id: p.id,
          quantity: p.status === 'Out of Stock' ? 0 : 50
        }));
        setProducts(formatted);
      }
    } catch (err) {
      console.error('Failed to fetch stock feed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStockQuantity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !currentUser) return;

    const newStatus = inputQty <= 5 ? 'Low Stock' : inputQty === 0 ? 'Out of Stock' : 'In Stock';

    try {
      await API.post('/api/partner/inventory/set', {
        userId: currentUser.id,
        productId: editingItem.product_id,
        quantity: inputQty,
        status: newStatus
      });
      setMessage('Stock quantity updated successfully!');
      setEditingItem(null);
      fetchData(currentUser);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert('Failed to update stock quantity.');
    }
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || currentUser?.role === 'superadmin@xllentfoods.com';
  const isSuperStockist = currentUser?.role === 'super_stockist';

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const lowStockCount = products.filter(p => p.quantity <= 5 || p.status === 'Out of Stock' || p.status === 'Low Stock').length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-800 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Boxes className="w-8 h-8 text-amber-600" /> Stock Management & Live Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {isAdmin ? 'Admin Portal: Monitor global stock statuses.' : 'Super Stockist Portal: Manage local warehouse stock and fulfillment.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lowStockCount > 0 && (
            <Link
              href="/dashboard/orders"
              className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-rose-500/25 transition cursor-pointer animate-pulse"
            >
              <ShoppingCart className="w-4 h-4" /> Reorder Low Stock Items ({lowStockCount})
            </Link>
          )}
          <button
            onClick={() => currentUser && fetchData(currentUser)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs transition cursor-pointer shadow-sm"
          >
            Refresh Feed
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {message}
        </div>
      )}

      {/* Low Stock Warning Banner */}
      {lowStockCount > 0 && (
        <div className="p-5 bg-rose-50 border border-rose-200 text-rose-900 rounded-3xl flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500 text-white rounded-2xl shadow-inner shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-xs uppercase tracking-wider">Low Stock Notification</h4>
              <p className="text-xs text-rose-700 mt-0.5">{lowStockCount} product(s) have low stock or are out of stock. Place an order to replenish inventory.</p>
            </div>
          </div>
          <Link href="/dashboard/orders" className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shrink-0">
            Order from Admin
          </Link>
        </div>
      )}

      {/* Search and Category Filters */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Product Name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition shadow-inner"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedCategory === 'All' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.name)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedCategory === c.name ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Table Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-xs font-bold animate-pulse">Loading live inventory stocks...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24 space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-slate-600 text-xs font-bold">No products found matching your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                  <th className="p-4 pl-6">Product & SKU</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">MRP</th>
                  {isSuperStockist && <th className="p-4">Available Quantity</th>}
                  <th className="p-4">GST %</th>
                  <th className="p-4 pr-6 text-right">Stock Status & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredProducts.map((p) => (
                  <tr key={p.product_id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4 pl-6 flex items-center gap-3">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-xl border border-slate-200 shrink-0 bg-white" />
                      ) : (
                        <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                        <span className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-700">
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-[10px] uppercase font-black border border-amber-200">{p.category}</span>
                    </td>
                    <td className="p-4 font-black text-slate-900">₹{p.mrp}</td>
                    {isSuperStockist && (
                      <td className="p-4 font-black text-slate-900">
                        <span className={`px-2.5 py-1 rounded-lg ${p.quantity <= 5 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-800'}`}>
                          {p.quantity} Units
                        </span>
                      </td>
                    )}
                    <td className="p-4 font-bold text-purple-700">{p.gst_percent || 0}%</td>
                    <td className="p-4 pr-6 text-right flex items-center justify-end gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                        p.quantity === 0 || p.status === 'Out of Stock' ? 'bg-rose-100 text-rose-700 border border-rose-200' : p.quantity <= 5 || p.status === 'Low Stock' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.quantity === 0 ? 'bg-rose-500' : p.quantity <= 5 ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                        {p.quantity === 0 ? 'Out of Stock' : p.quantity <= 5 ? 'Low Stock' : 'In Stock'}
                      </span>

                      {isSuperStockist && (
                        <button
                          onClick={() => { setEditingItem(p); setInputQty(p.quantity); }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-[11px] transition cursor-pointer shadow-sm flex items-center gap-1"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-amber-400" /> Edit Stock
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Super Stockist Stock Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-sm w-full space-y-5 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">Manage Stock: {editingItem.name}</h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleUpdateStockQuantity} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">Update Warehouse Units</label>
                <input
                  type="number"
                  value={inputQty}
                  onChange={(e) => setInputQty(Number(e.target.value))}
                  required
                  min="0"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:border-amber-500 shadow-inner"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingItem(null)} className="w-1/2 py-2.5 bg-slate-100 text-slate-700 font-extrabold rounded-xl text-xs hover:bg-slate-200 transition cursor-pointer">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer">Save Quantity</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}