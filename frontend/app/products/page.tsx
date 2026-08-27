'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { Package, Search, ShoppingCart, Plus, Check } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchProducts('All');
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await API.get('/categories');
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error('Error fetching categories', err);
    }
  };

  const fetchProducts = async (categoryName: string) => {
    try {
      setLoading(true);
      setSelectedCategory(categoryName);
      const endpoint = categoryName === 'All' 
        ? '/admin/products' 
        : `/admin/products?category=${encodeURIComponent(categoryName)}`;
      
      const res = await API.get(endpoint);
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Error fetching products', err);
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

  const filteredProducts = products.filter((p) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-6 py-12 w-full">
        {/* Catalog Header */}
        <div className="bg-slate-900 text-white p-8 sm:p-12 rounded-3xl mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Wholesale & Retail Portal
            </span>
            <h1 className="text-3xl sm:text-4xl font-black mt-3 tracking-tight">Xllent Foods Catalog</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2">
              Browse live inventory items, wholesale tiers, and place direct distribution orders.
            </p>
          </div>
          <div className="w-full md:w-72">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search items or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Category Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none">
          <button
            onClick={() => fetchProducts('All')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer shadow-sm ${
              selectedCategory === 'All' 
                ? 'bg-amber-600 text-white shadow-amber-600/20' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => fetchProducts(cat.name)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer shadow-sm ${
                selectedCategory === cat.name 
                  ? 'bg-amber-600 text-white shadow-amber-600/20' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid & Cart Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {loading ? (
              <div className="text-center py-20 text-slate-400 text-xs font-semibold">Loading catalog items...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs font-semibold">
                No products found matching your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
                    <div>
                      <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-12 h-12 text-slate-300" />
                        )}
                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase">
                          {product.category || 'FMCG'}
                        </span>
                      </div>
                      <div className="p-5">
                        <h3 className="font-extrabold text-slate-900 text-base">{product.name}</h3>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">SKU: {product.sku || 'N/A'}</p>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">{product.description || 'Premium quality FMCG product.'}</p>
                        
                        <div className="mt-3 text-[10px] text-slate-600 bg-amber-50 p-2 rounded-xl border border-amber-100 flex justify-between font-semibold">
                          <span>📦 Pkt: {product.pieces_per_packet || 1} Pcs</span>
                          <span>📦 Ctn: {product.packets_per_carton || 1} Pkts</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 pt-0 flex justify-between items-center border-t border-slate-100 mt-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">MRP</span>
                        <span className="text-base font-black text-slate-900">₹{product.mrp}</span>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Order Cart */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm h-fit sticky top-28">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <ShoppingCart className="w-5 h-5 text-amber-600" />
              <h3 className="font-black text-slate-900 text-base">Order Cart ({cart.reduce((acc, item) => acc + item.quantity, 0)})</h3>
            </div>

            {cart.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">Your cart is empty. Add products to begin smart routing.</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs border-b border-slate-100 pb-3">
                    <div>
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-slate-400">Qty: {item.quantity} × ₹{item.mrp}</p>
                    </div>
                    <p className="font-black text-slate-900">₹{item.quantity * item.mrp}</p>
                  </div>
                ))}
                <div className="pt-4 flex justify-between items-center font-black text-sm border-t border-slate-200">
                  <span>Total Amount:</span>
                  <span className="text-amber-600">₹{cart.reduce((acc, item) => acc + (item.quantity * item.mrp), 0)}</span>
                </div>
                <a href="/login" className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider block text-center shadow-lg transition">
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