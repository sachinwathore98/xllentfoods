'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { Package, Search, Plus, ShoppingCart, SlidersHorizontal, ArrowUpDown, ShieldCheck, TrendingUp, Users, ArrowRight } from 'lucide-react';

const SLIDER_IMAGES = [
  '/images/slider-1.png',
  '/images/slider-2.png',
  '/images/slider-3.png'
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto slide effect every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDER_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [catRes, prodRes] = await Promise.all([
        API.get('/api/categories').catch(() => ({ data: { categories: [] } })),
        API.get('/api/admin/products').catch(() => ({ data: { products: [] } }))
      ]);

      setCategories(catRes.data.categories || []);
      setProducts(prodRes.data.products || []);
    } catch (err) {
      console.error('Error loading home data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = async (categoryName: string) => {
    setSelectedCategory(categoryName);
    try {
      setLoading(true);
      const endpoint = categoryName === 'All' 
        ? '/api/admin/products' 
        : `/api/admin/products?category=${encodeURIComponent(categoryName)}`;
      
      const res = await API.get(endpoint);
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Error filtering products', err);
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

  // Filter products by search term
  let filteredProducts = products.filter((p) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Apply Sorting Options
  if (sortBy === 'low-high') {
    filteredProducts.sort((a, b) => Number(a.mrp) - Number(b.mrp));
  } else if (sortBy === 'high-low') {
    filteredProducts.sort((a, b) => Number(b.mrp) - Number(a.mrp));
  } else if (sortBy === 'name-az') {
    filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col justify-between">
      <Navbar />

      {/* Hero Image Slider Banner */}
      <section className="relative w-full overflow-hidden bg-slate-900 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          {SLIDER_IMAGES.map((img, index) => (
            <div
              key={index}
              className={`transition-opacity duration-700 ease-in-out ${
                index === currentSlide ? 'opacity-100 relative block' : 'opacity-0 absolute inset-0 hidden'
              }`}
            >
              <img 
                src={img} 
                alt={`Banner ${index + 1}`} 
                className="w-full h-[240px] sm:h-[400px] lg:h-[480px] object-cover rounded-2xl shadow-lg block mx-auto" 
              />
            </div>
          ))}
        </div>
      </section>

      {/* E-Commerce Search & Filter Header Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 w-full pt-8">
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="w-full md:w-96">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search for products, brands and more..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {/* Category Dropdown */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 flex-1 sm:flex-none">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 flex-1 sm:flex-none">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="default">Sort By: Featured</option>
                <option value="low-high">Price: Low to High</option>
                <option value="high-low">Price: High to Low</option>
                <option value="name-az">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Main E-Commerce Catalog Grid & Cart Section */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Featured FMCG Products</h2>
          <span className="text-xs font-bold text-slate-500">{filteredProducts.length} items available</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Products Grid (Spans 3 cols on desktop, 2 cols on mobile) */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-20 text-slate-400 text-xs font-semibold">Loading store inventory...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs font-semibold shadow-sm">
                No products found matching your search.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between group">
                    <div>
                      <div className="h-36 sm:h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                        ) : (
                          <Package className="w-10 h-10 text-slate-300" />
                        )}
                        <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-md text-slate-800 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase shadow-sm">
                          {product.category || 'FMCG'}
                        </span>
                      </div>
                      <div className="p-3 sm:p-4">
                        <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">{product.name}</h3>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {product.sku || 'N/A'}</p>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{product.description || 'Premium quality FMCG product.'}</p>
                        
                        <div className="mt-2 text-[9px] text-slate-600 bg-amber-50 p-1.5 rounded-lg border border-amber-100 flex justify-between font-semibold">
                          <span>📦 Pkt: {product.pieces_per_packet || 1} Pcs</span>
                          <span>📦 Ctn: {product.packets_per_carton || 1} Pkts</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 pt-0 flex justify-between items-center border-t border-slate-100 mt-2">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">MRP</span>
                        <span className="text-sm sm:text-base font-black text-slate-900">₹{product.mrp}</span>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-[11px] sm:text-xs transition flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Quick Cart (Amazon / Flipkart Style Sidebar) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm sticky top-24">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <ShoppingCart className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-slate-900 text-sm">Shopping Cart ({cart.reduce((acc, item) => acc + item.quantity, 0)})</h3>
              </div>

              {cart.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Your cart is empty. Add products to place an order.</p>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                      <div>
                        <p className="font-bold text-slate-900 truncate max-w-[120px]">{item.name}</p>
                        <p className="text-slate-400">Qty: {item.quantity} × ₹{item.mrp}</p>
                      </div>
                      <p className="font-black text-slate-900">₹{item.quantity * item.mrp}</p>
                    </div>
                  ))}
                  <div className="pt-3 flex justify-between items-center font-black text-sm border-t border-slate-200">
                    <span>Subtotal:</span>
                    <span className="text-amber-600">₹{cart.reduce((acc, item) => acc + (item.quantity * item.mrp), 0)}</span>
                  </div>
                  <a href="/login" className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider block text-center shadow-md transition">
                    Proceed to Checkout
                  </a>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Partnership Callout Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 w-full pb-16">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 sm:p-12 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              B2B Growth Opportunity
            </span>
            <h3 className="text-2xl sm:text-3xl font-black mt-3 tracking-tight">Become a Super Stockist or Distributor</h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl">
              Scale your business with high profit margins, protected regional territories, and complete digital downline management.
            </p>
          </div>
          <a href="/partnership" className="px-6 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shrink-0 flex items-center gap-2">
            <span>Apply For Partnership</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}