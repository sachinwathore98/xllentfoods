'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { ShieldCheck, TrendingUp, Users, ArrowRight, Package, CheckCircle2, Sparkles, Award, Zap, Globe2 } from 'lucide-react';

const SLIDER_IMAGES = [
  '/images/slider-1.png',
  '/images/slider-2.png',
  '/images/slider-3.png'
];

export default function PublicHomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
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
      // Fetch categories and public products concurrently
      const [catRes, prodRes] = await Promise.all([
        API.get('/categories').catch(() => ({ data: { categories: [] } })),
        API.get('/products/public').catch(() => ({ data: { products: [] } }))
      ]);
      
      setCategories(catRes.data.categories || []);
      setProducts(prodRes.data.products || []);
    } catch (err) {
      console.error("Error loading home page data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryFilter = async (categoryName: string) => {
    setSelectedCategory(categoryName);
    try {
      setLoading(true);
      const endpoint = categoryName === 'All' 
        ? '/products/public' 
        : `/admin/products?category=${encodeURIComponent(categoryName)}`;
      
      const res = await API.get(endpoint);
      setProducts(res.data.products || []);
    } catch (err) {
      console.error("Error filtering products", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-white">
      <Navbar />

      {/* Hero Image Slider with Glow Accent */}
      <section className="relative w-full overflow-hidden bg-slate-900 border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none"></div>
        <div className="relative w-full max-w-7xl mx-auto px-4 py-6">
          {SLIDER_IMAGES.map((img, index) => (
            <div
              key={index}
              className={`transition-all duration-700 ease-in-out transform ${
                index === currentSlide ? 'opacity-100 scale-100 relative block' : 'opacity-0 scale-95 absolute inset-0 hidden'
              }`}
            >
              <img 
                src={img} 
                alt={`Slide ${index + 1}`} 
                className="w-full h-[320px] sm:h-[480px] lg:h-[560px] object-cover rounded-3xl shadow-2xl border border-slate-800 block mx-auto" 
              />
            </div>
          ))}
        </div>
      </section>

      {/* High-Impact Value Proposition Bar (Replaces text walls) */}
      <section className="py-12 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 p-6 rounded-3xl border border-slate-800 hover:border-amber-500/50 transition-all duration-300 group shadow-xl">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl w-fit mb-4 group-hover:scale-110 transition duration-300">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-1">Massive Profit Margins</h3>
            <p className="text-xs text-slate-400">Tiered wholesale pricing engineered for high turnover and rapid capital returns.</p>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 p-6 rounded-3xl border border-slate-800 hover:border-blue-500/50 transition-all duration-300 group shadow-xl">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl w-fit mb-4 group-hover:scale-110 transition duration-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-1">Exclusive Territory Rights</h3>
            <p className="text-xs text-slate-400">Zero internal channel competition with protected regional operating zones.</p>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 p-6 rounded-3xl border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 group shadow-xl">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl w-fit mb-4 group-hover:scale-110 transition duration-300">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-1">Full Downline Control</h3>
            <p className="text-xs text-slate-400">Automated digital portal to manage retail shops and track live order dispatches.</p>
          </div>
        </div>
      </section>

      {/* Animated Partnership CTA Banner */}
      <section className="px-6 max-w-7xl mx-auto mb-16">
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-8 sm:p-12 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
            <Award className="w-64 h-64 text-white" />
          </div>
          <div className="space-y-3 relative z-10 text-center md:text-left">
            <span className="bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md">
              Limited Regional Slots Available
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Ready to Dominate Your Local Market?
            </h2>
            <p className="text-amber-100 text-xs sm:text-sm max-w-xl font-medium">
              Join elite Super Stockists and Distributors scaling high-demand FMCG consumer goods with Xllent Foods.
            </p>
          </div>
          <div className="relative z-10 shrink-0">
            <a href="/partnership" className="px-8 py-4 bg-slate-950 hover:bg-slate-900 text-white font-black rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 text-xs uppercase tracking-wider flex items-center gap-2 border border-slate-800">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Apply For Partnership</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </a>
          </div>
        </div>
      </section>

      {/* Dynamic Products Showcase Section */}
      <section id="products" className="py-12 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b border-slate-800 pb-6">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Live Inventory Catalog
            </span>
            <h2 className="text-3xl font-black text-white mt-3 tracking-tight">Our Products</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            Browse our active product range ready for instant bulk allocation and regional dispatch.
          </p>
        </div>

        {/* Interactive Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none">
          <button
            onClick={() => handleCategoryFilter('All')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer shadow-md ${
              selectedCategory === 'All' 
                ? 'bg-amber-600 text-white shadow-amber-600/30 scale-105' 
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryFilter(cat.name)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer shadow-md ${
                selectedCategory === cat.name 
                  ? 'bg-amber-600 text-white shadow-amber-600/30 scale-105' 
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="text-center py-24 text-slate-500 text-xs font-semibold animate-pulse">Loading catalog inventory...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800 text-slate-400 text-xs font-semibold">
            No products available under this filter right now. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-lg hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group">
                <div>
                  <div className="h-52 bg-slate-950 relative overflow-hidden flex items-center justify-center">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    ) : (
                      <Package className="w-12 h-12 text-slate-700 group-hover:scale-110 transition duration-300" />
                    )}
                    <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-amber-400 text-[10px] font-extrabold px-3 py-1 rounded-lg uppercase border border-slate-800">
                      {product.category || 'FMCG'}
                    </span>
                  </div>
                  <div className="p-5 space-y-2">
                    <h3 className="font-black text-white text-base tracking-tight">{product.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 font-light">{product.description || 'Premium quality FMCG product manufactured for high consumer demand.'}</p>
                    
                    {/* Packaging specs badge */}
                    <div className="mt-3 text-[10px] text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between font-bold">
                      <span className="text-amber-400">📦 Pkt: {product.pieces_per_packet || 1} Pcs</span>
                      <span className="text-blue-400">📦 Ctn: {product.packets_per_carton || 1} Pkts</span>
                    </div>
                  </div>
                </div>
                <div className="p-5 pt-0 flex justify-between items-center border-t border-slate-800/60 mt-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">MRP Price</span>
                    <span className="text-lg font-black text-white">₹{product.mrp}</span>
                  </div>
                  <a href="/login" className="px-4 py-2.5 bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white font-bold rounded-xl text-xs transition duration-200 border border-amber-500/30 shadow-sm">
                    Order Bulk
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}