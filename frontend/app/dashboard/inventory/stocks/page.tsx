'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { Package, Search, Layers, AlertCircle, Boxes } from 'lucide-react';

interface ProductStock {
  id: number;
  name: string;
  category: string;
  sku: string;
  mrp: number;
  status: string;
  image?: string;
  pieces_per_packet: number;
  packets_per_carton: number;
  gst_percent: number;
}

export default function LiveInventoryStockPage() {
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchLiveStocks();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await API.get('/api/categories');
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const fetchLiveStocks = async () => {
    try {
      setLoading(true);
      const res = await API.get('/api/products/public');
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Failed to fetch stock feed', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-800 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Boxes className="w-8 h-8 text-amber-600" /> Live Inventory & Stock Status
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Real-time tracking of product stock availability across distribution channels.</p>
        </div>
        <button
          onClick={fetchLiveStocks}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs transition cursor-pointer shadow-sm"
        >
          Refresh Stock Feed
        </button>
      </div>

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
                  <th className="p-4">Packing Ratio</th>
                  <th className="p-4">GST %</th>
                  <th className="p-4 pr-6 text-right">Live Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
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
                    <td className="p-4 text-slate-600 font-medium">
                      {p.pieces_per_packet || 1} Pcs/Pkt | {p.packets_per_carton || 1} Pkts/Ctn
                    </td>
                    <td className="p-4 font-bold text-purple-700">{p.gst_percent || 0}%</td>
                    <td className="p-4 pr-6 text-right">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                        p.status === 'Out of Stock' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'Out of Stock' ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                        {p.status || 'In Stock'}
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
  );
}