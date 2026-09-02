'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { Package, Search, ShoppingCart, Plus, SlidersHorizontal, ArrowUpDown, ExternalLink } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [catRes, prodRes] = await Promise.all([
        API.get('/api/categories').catch(() => ({ data: { categories: [] } })),
        API.get('/api/products/public').catch(() => ({ data: { products: [] } }))
      ]);

      setCategories(catRes.data.categories || []);
      setProducts(prodRes.data.products || []);
    } catch (err) {
      console.error('Error loading products and categories', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = async (categoryName: string) => {
    setSelectedCategory(categoryName);
    try {
      setLoading(true);
      const res = await API.get('/api/products/public');
      let allProds = res.data.products || [];
      if (categoryName !== 'All') {
        allProds = allProds.filter((p: any) => p.category?.toLowerCase() === categoryName.toLowerCase());
      }
      setProducts(allProds);
    } catch (err) {
      console.error('Error filtering products by category', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  let filteredProducts = products.filter((p) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (sortBy === 'low-high') {
    filteredProducts.sort((a, b) => Number(a.mrp) - Number(b.mrp));
  } else if (sortBy === 'high-low') {
    filteredProducts.sort((a, b) => Number(b.mrp) - Number(a.mrp));
  } else if (sortBy === 'name-az') {
    filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between selection:bg-amber-500 selection:text-white">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
        <div className="bg-slate-900 text-white p-6 sm:p-12 rounded-3xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
          <div>
            <span className="text-xs sm:text-sm font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3.5 py-1.5 rounded-full border border-amber-500/25">
              Wholesale & Retail Portal
            </span>
            <h1 className="text-3xl sm:text-5xl font-black mt-3 tracking-tight">Xllent Foods Catalog</h1>
            <p className="text-sm sm:text-base text-slate-300 mt-2">
              Browse live inventory items, wholesale tiers, and place direct distribution orders.
            </p>
          </div>
          <div className="w-full md:w-80">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search items or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 mb-8 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            <button onClick={() => handleCategoryChange('All')} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition shrink-0 cursor-pointer ${selectedCategory === 'All' ? 'bg-amber-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              All Categories
            </button>
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => handleCategoryChange(cat.name)} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition shrink-0 cursor-pointer ${selectedCategory === cat.name ? 'bg-amber-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 flex-1 sm:flex-none">
              <SlidersHorizontal className="w-4 h-4 text-slate-500 shrink-0" />
              <select value={selectedCategory} onChange={(e) => handleCategoryChange(e.target.value)} className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer w-full">
                <option value="All">Category: All</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 flex-1 sm:flex-none">
              <ArrowUpDown className="w-4 h-4 text-slate-500 shrink-0" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer w-full">
                <option value="default">Sort By: Featured</option>
                <option value="low-high">Price: Low to High</option>
                <option value="high-low">Price: High to Low</option>
                <option value="name-az">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {loading ? (
              <div className="text-center py-20 text-slate-400 text-sm font-semibold animate-pulse">Loading live inventory...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 text-slate-400 text-sm font-semibold shadow-sm">
                No products found matching your criteria.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
                    <div>
                      <a href={`/products/${product.id}`} target="_blank" rel="noopener noreferrer" className="block relative">
                        <div className="h-36 sm:h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-12 h-12 text-slate-300" />
                          )}
                          <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-lg uppercase shadow-sm">
                            {product.category || 'FMCG'}
                          </span>
                        </div>
                      </a>
                      <div className="p-4 sm:p-5">
                        <a href={`/products/${product.id}`} target="_blank" rel="noopener noreferrer">
                          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base truncate hover:text-amber-600 transition">{product.name}</h3>
                        </a>
                        <p className="text-xs text-slate-400 font-mono mt-1 truncate">SKU: {product.sku || 'N/A'}</p>
                        <p className="text-xs sm:text-sm text-slate-500 mt-2 line-clamp-2">{product.description || 'Premium quality FMCG product.'}</p>
                        
                        <div className="mt-3 text-xs text-slate-600 bg-amber-50 p-2.5 rounded-xl border border-amber-100 flex flex-col sm:flex-row justify-between font-semibold gap-1">
                          <span>📦 Pkt: {product.pieces_per_packet || 1} Pcs</span>
                          <span>📦 Ctn: {product.packets_per_carton || 1} Pkts</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 sm:p-5 pt-0 flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-slate-100 mt-4 gap-3">
                      <div>
                        <span className="text-[11px] uppercase font-bold text-slate-400 block">MRP</span>
                        <span className="text-base sm:text-lg font-black text-slate-900">₹{product.mrp}</span>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Plus className="w-4 h-4" /> Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm h-fit sticky top-28">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <ShoppingCart className="w-5 h-5 text-amber-600" />
              <h3 className="font-black text-slate-900 text-base sm:text-lg">Order Cart ({cart.reduce((acc, item) => acc + item.quantity, 0)})</h3>
            </div>

            {cart.length === 0 ? (
              <p className="text-xs sm:text-sm text-slate-400 text-center py-10">Your cart is empty. Add products to begin smart routing.</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs sm:text-sm border-b border-slate-100 pb-3">
                    <div>
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-slate-400 text-xs">Qty: {item.quantity} × ₹{item.mrp}</p>
                    </div>
                    <p className="font-black text-slate-900">₹{item.quantity * item.mrp}</p>
                  </div>
                ))}
                <div className="pt-4 flex justify-between items-center font-black text-base border-t border-slate-200">
                  <span>Total Amount:</span>
                  <span className="text-amber-600">₹{cart.reduce((acc, item) => acc + (item.quantity * item.mrp), 0)}</span>
                </div>
                <a href="/login" className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl text-xs sm:text-sm uppercase tracking-wider block text-center shadow-lg transition">
                  Proceed to Checkout / Login
                </a>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}