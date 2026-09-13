'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import API from '@/app/lib/api';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { Package, Search, Plus, ShoppingCart, SlidersHorizontal, ArrowUpDown, Zap, Sparkles, TrendingUp, ShieldCheck, Award, ChevronRight, X, ShoppingBag, ExternalLink } from 'lucide-react';

const SLIDER_IMAGES = [
  '/images/slider-1.png',
  '/images/slider-2.png',
  '/images/slider-3.png'
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDER_IMAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [catRes, prodRes, adsRes] = await Promise.all([
        API.get('/api/categories').catch(() => ({ data: { categories: [] } })),
        API.get('/api/products/public').catch(() => ({ data: { products: [] } })),
        API.get('/api/advertisements/public').catch(() => ({ data: { advertisements: [] } }))
      ]);

      const rawCats = catRes.data.categories || [];
      const rawProds = prodRes.data.products || [];

      const enhancedCats = rawCats.map((cat: any) => {
        const matchProd = rawProds.find((p: any) => p.category?.toLowerCase() === cat.name.toLowerCase() && p.image);
        return {
          ...cat,
          image: cat.image || matchProd?.image || 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400'
        };
      });

      setCategories(enhancedCats);
      setProducts(rawProds);
      setAds(adsRes.data.advertisements || []);
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
      const res = await API.get('/api/products/public');
      let allProds = res.data.products || [];
      if (categoryName !== 'All') {
        allProds = allProds.filter((p: any) => p.category?.toLowerCase() === categoryName.toLowerCase());
      }
      setProducts(allProds);
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
    setIsCartOpen(true);
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

  const cartSubtotal = cart.reduce((acc, item) => acc + (item.quantity * Number(item.mrp)), 0);
  const totalGstAmount = cart.reduce((acc, item) => {
    const itemTotal = item.quantity * Number(item.mrp);
    const gstRate = Number(item.gst_percent || 0);
    return acc + (itemTotal * (gstRate / 100));
  }, 0);
  const cartGrandTotal = cartSubtotal + totalGstAmount;

  const horizontalAds = ads.filter((ad) => ad.banner_type === 'horizontal' || !ad.banner_type);
  const verticalAds = ads.filter((ad) => ad.banner_type === 'vertical');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between selection:bg-amber-500 selection:text-white">
      <Navbar cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} onOpenCart={() => setIsCartOpen(true)} />

      {/* Top Animated Ticker */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-white text-[10px] sm:text-xs font-black py-2.5 px-3 text-center tracking-wider uppercase shadow-md flex items-center justify-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 animate-spin shrink-0" />
        <span className="truncate">⚡ B2B Wholesale Margins & Automated GST Billing Live!</span>
        <Sparkles className="w-3.5 h-3.5 animate-spin shrink-0 hidden sm:inline" />
      </div>

      {/* Main Hero Slider with Premium Mobile Padding & Glass Overlay */}
      <section className="relative w-full overflow-hidden bg-slate-950 shadow-2xl">
        <div className="relative w-full h-[260px] sm:h-[460px] flex items-center justify-center">
          {SLIDER_IMAGES.map((img, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
                index === currentSlide ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0'
              }`}
            >
              <img src={img} alt={`Banner ${index + 1}`} className="w-full h-full object-cover brightness-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent flex flex-col justify-end p-5 sm:p-12">
                <div className="max-w-[95rem] mx-auto w-full space-y-1.5 sm:space-y-3">
                  <span className="bg-amber-500 text-slate-950 text-[9px] sm:text-xs font-black uppercase px-3 py-1 rounded-full shadow-lg tracking-widest inline-block animate-pulse">
                    Verified CPG Network
                  </span>
                  <h1 className="text-xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-lg">
                    Direct Distribution & Bulk Supply Hub
                  </h1>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-3 left-0 right-0 z-30 flex justify-center gap-1.5">
          {SLIDER_IMAGES.map((_, idx) => (
            <button key={idx} onClick={() => setCurrentSlide(idx)} className={`h-2 rounded-full transition-all duration-500 ${idx === currentSlide ? 'w-8 bg-amber-500 shadow-md' : 'w-2 bg-white/40'}`} />
          ))}
        </div>
      </section>

      {/* Spotlight Horizontal Ad Banner */}
      {horizontalAds.length > 0 && (
        <section className="max-w-[95rem] mx-auto px-3 sm:px-6 pt-6 w-full">
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-amber-500/30 bg-slate-950 group">
            <a href={horizontalAds[0].target_url || '#'} target="_blank" rel="noopener noreferrer" className="block relative h-36 sm:h-64">
              <img src={horizontalAds[0].image_url} alt="Spotlight Banner" className="w-full h-full object-cover group-hover:scale-105 transition duration-700 opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-center p-4 sm:p-10">
                <span className="bg-amber-500 text-slate-950 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full shadow tracking-widest w-fit mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Spotlight Promo
                </span>
                <h2 className="text-sm sm:text-3xl font-black text-white drop-shadow line-clamp-1">{horizontalAds[0].title || 'Wholesale Campaign'}</h2>
                <p className="text-[10px] sm:text-xs text-amber-300 font-bold mt-0.5 flex items-center gap-1">Tap to explore bulk margins <ExternalLink className="w-3 h-3" /></p>
              </div>
            </a>
          </div>
        </section>
      )}

      {/* Trust Badges - Premium Mobile Grid */}
      <section className="bg-white border-y border-slate-200/80 py-3.5 my-4 shadow-xs">
        <div className="max-w-[95rem] mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-700"><Award className="w-4 h-4 text-amber-600 shrink-0" /> Direct Pricing</div>
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-700"><TrendingUp className="w-4 h-4 text-amber-600 shrink-0" /> High Margins</div>
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-700"><ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" /> Secure GST</div>
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-700"><Zap className="w-4 h-4 text-amber-600 shrink-0" /> Smart Routing</div>
        </div>
      </section>

      {/* Search & Filter Bar */}
      <section className="max-w-[95rem] mx-auto px-3 sm:px-6 w-full">
        <div className="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200/80 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="w-full md:w-[480px]">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-amber-600" />
              <input
                type="text"
                placeholder="Search confectionery, snacks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-between">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 flex-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <select value={selectedCategory} onChange={(e) => handleCategoryChange(e.target.value)} className="bg-transparent text-[11px] sm:text-xs font-bold text-slate-700 focus:outline-none cursor-pointer w-full">
                <option value="All">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 flex-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent text-[11px] sm:text-xs font-bold text-slate-700 focus:outline-none cursor-pointer w-full">
                <option value="default">Sort: Featured</option>
                <option value="low-high">Price: Low to High</option>
                <option value="high-low">Price: High to Low</option>
                <option value="name-az">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Main Full-Screen Catalog View */}
      <main className="flex-grow max-w-[95rem] mx-auto px-3 sm:px-6 py-6 sm:py-10 w-full">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/10 text-amber-600 rounded-xl shadow-xs"><Zap className="w-4 h-4" /></span>
            <h2 className="text-lg sm:text-3xl font-black text-slate-900 tracking-tight">Wholesale Product Catalog</h2>
          </div>
          <span className="text-[11px] sm:text-sm font-extrabold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 shadow-xs">
            {filteredProducts.length} Live
          </span>
        </div>

        <div className="w-full">
          {loading ? (
            <div className="text-center py-20 text-slate-400 text-xs font-bold animate-pulse">Loading live inventory...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs font-bold">No products found.</div>
          ) : (
            <div>
              {filteredProducts.map((product, index) => {
                const isGridStart = index % 10 === 0;
                const gridChunk = filteredProducts.slice(index, index + 10);

                if (!isGridStart) return null;

                const chunkCycleIndex = Math.floor(index / 10);
                const isCategoryTicker = chunkCycleIndex % 2 === 0;
                const tickerProductsSlice = products.slice((chunkCycleIndex * 5) % Math.max(1, products.length - 5), ((chunkCycleIndex * 5) % Math.max(1, products.length - 5)) + 6);

                const activeHorizontalAd = horizontalAds.length > 0 ? horizontalAds[chunkCycleIndex % horizontalAds.length] : null;
                const showHorizontalAd = activeHorizontalAd && (chunkCycleIndex % 2 === 1);
                const activeVerticalAd = verticalAds.length > 0 ? verticalAds[chunkCycleIndex % verticalAds.length] : null;

                return (
                  <React.Fragment key={`chunk-${index}`}>
                    {/* Premium Product Grid & Embedded Ad Card */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
                      <div className={activeVerticalAd ? "lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-6" : "lg:col-span-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6"}>
                        {gridChunk.map((p) => (
                          <div key={p.id} className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group relative">
                            <div className="absolute top-2.5 right-2.5 z-10 bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full shadow uppercase tracking-wider">
                              In Stock
                            </div>
                            <div>
                              <Link href={`/products/${p.id}`} className="block relative">
                                <div className="h-32 sm:h-44 bg-gradient-to-b from-slate-100 to-slate-200/50 relative overflow-hidden flex items-center justify-center p-3">
                                  {p.image ? (
                                    <img src={p.image} alt={p.name} className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition duration-500 shadow-xs" />
                                  ) : (
                                    <Package className="w-10 h-10 text-slate-300" />
                                  )}
                                  <span className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md text-amber-400 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow">
                                    {p.category || 'FMCG'}
                                  </span>
                                </div>
                              </Link>
                              <div className="p-3 sm:p-4 space-y-1">
                                <Link href={`/products/${p.id}`}>
                                  <h3 className="font-black text-slate-900 text-xs sm:text-sm truncate group-hover:text-amber-600 transition">{p.name}</h3>
                                </Link>
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] text-slate-400 font-mono font-bold">SKU: {p.sku || 'N/A'}</span>
                                  <span className="text-[9px] font-black text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">GST {p.gst_percent || 0}%</span>
                                </div>
                                <p className="text-[10px] text-slate-500 line-clamp-2 font-light">{p.description || 'Premium quality FMCG product.'}</p>
                                
                                <div className="mt-2 text-[9px] text-slate-600 bg-amber-50/90 p-2 rounded-xl border border-amber-200/60 flex flex-col gap-0.5 font-bold">
                                  <span className="text-amber-800">📦 Pkt: {p.pieces_per_packet || 1} Pcs</span>
                                  <span className="text-blue-800">📦 Ctn: {p.packets_per_carton || 1} Pkts</span>
                                </div>
                              </div>
                            </div>
                            <div className="p-3 sm:p-4 pt-0 flex justify-between items-center border-t border-slate-100 mt-2">
                              <div>
                                <span className="text-[8px] uppercase font-black text-slate-400 block">MRP</span>
                                <span className="text-xs sm:text-base font-black text-slate-900">₹{p.mrp}</span>
                              </div>
                              <button
                                onClick={() => addToCart(p)}
                                className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-[11px] transition shadow-md shadow-amber-600/30 flex items-center gap-1 cursor-pointer active:scale-95"
                              >
                                <Plus className="w-3 h-3" /> Add
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {activeVerticalAd && (
                        <div className="lg:col-span-1 flex flex-col justify-between">
                          <div className="bg-slate-950 p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-800 text-white h-full flex flex-col justify-between">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase text-amber-400 tracking-widest border-b border-slate-800 pb-2 mb-2">
                              <span>Sponsored Spotlight</span>
                              <Sparkles className="w-3 h-3 animate-spin" />
                            </div>
                            <div className="rounded-xl overflow-hidden border border-slate-800 group relative flex-grow">
                              <a href={activeVerticalAd.target_url || '#'} target="_blank" rel="noopener noreferrer" className="block relative h-full min-h-[220px]">
                                <img src={activeVerticalAd.image_url} alt="Vertical Ad" className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-95" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/20 to-transparent p-3 flex flex-col justify-end">
                                  <span className="text-xs font-black text-white">{activeVerticalAd.title || 'Exclusive Promo'}</span>
                                  <span className="text-[10px] text-amber-400 font-bold mt-0.5 flex items-center gap-1">Tap to explore <ExternalLink className="w-3 h-3" /></span>
                                </div>
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Live Alternating Ticker Slider with Images */}
                    <div className="my-8 bg-slate-900 py-4 sm:py-6 px-3 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden relative border border-slate-800">
                      <div className="px-2 mb-3 flex items-center justify-between">
                        <span className="text-[11px] sm:text-xs font-black uppercase text-amber-400 tracking-widest flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 animate-spin" /> {isCategoryTicker ? 'Graphical Categories Spotlight' : 'Best-Selling Products'}
                        </span>
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Interactive Ticker</span>
                      </div>
                      <div className="flex overflow-x-hidden whitespace-nowrap relative w-full">
                        <div className="flex animate-marquee gap-4 items-center">
                          {isCategoryTicker
                            ? categories.concat(categories).map((cat, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleCategoryChange(cat.name)}
                                  className="flex items-center gap-3 bg-slate-800/90 border border-slate-700 p-2.5 pr-5 rounded-xl shadow-lg shrink-0 hover:border-amber-500 transition cursor-pointer text-left group"
                                >
                                  <div className="w-11 h-11 rounded-lg bg-slate-700 overflow-hidden flex items-center justify-center shrink-0 border border-slate-600 shadow-inner">
                                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                                  </div>
                                  <div>
                                    <span className="text-white text-[11px] font-black tracking-wide uppercase block group-hover:text-amber-400 transition">{cat.name}</span>
                                    <span className="text-[9px] text-amber-400 font-bold flex items-center gap-0.5 mt-0.5">Explore <ChevronRight className="w-2.5 h-2.5" /></span>
                                  </div>
                                </button>
                              ))
                            : tickerProductsSlice.concat(tickerProductsSlice).map((prod, idx) => (
                                <a
                                  key={idx}
                                  href={`/products/${prod.id}`}
                                  className="flex items-center gap-3 bg-slate-800/90 border border-slate-700 p-2.5 pr-5 rounded-xl shadow-lg shrink-0 hover:border-amber-500 transition cursor-pointer text-left group"
                                >
                                  <div className="w-11 h-11 rounded-lg bg-slate-700 overflow-hidden flex items-center justify-center shrink-0 border border-slate-600 shadow-inner">
                                    {prod.image ? (
                                      <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                                    ) : (
                                      <Package className="w-5 h-5 text-slate-400" />
                                    )}
                                  </div>
                                  <div>
                                    <span className="text-white text-[11px] font-black tracking-wide truncate max-w-[130px] block group-hover:text-amber-400 transition">{prod.name}</span>
                                    <span className="text-[9px] text-amber-400 font-bold flex items-center gap-0.5 mt-0.5">₹{prod.mrp} <ChevronRight className="w-2.5 h-2.5" /></span>
                                  </div>
                                </a>
                              ))}
                        </div>
                      </div>
                    </div>

                    {/* Horizontal Ad Banner */}
                    {showHorizontalAd && (
                      <div className="my-6 overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl border-2 border-amber-400/50 bg-slate-950">
                        <a href={activeHorizontalAd.target_url || '#'} target="_blank" rel="noopener noreferrer" className="block relative h-36 sm:h-56 group">
                          <img src={activeHorizontalAd.image_url} alt="Sponsored Banner" className="w-full h-full object-cover group-hover:scale-105 transition duration-700 opacity-90" />
                          <div className="absolute top-3 left-3 bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-full shadow tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Promotional Ad
                          </div>
                        </a>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Floating / Sliding Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm sm:max-w-md h-full shadow-2xl flex flex-col justify-between p-5 sm:p-8 animate-in slide-in-from-right duration-300">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-amber-500/10 text-amber-600 rounded-xl"><ShoppingBag className="w-4 h-4" /></span>
                  <h3 className="font-black text-slate-900 text-base sm:text-lg">Your Cart ({cart.reduce((acc, item) => acc + item.quantity, 0)})</h3>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-20 space-y-3">
                  <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto animate-bounce" />
                  <p className="text-xs sm:text-sm text-slate-400 font-semibold">Your cart is empty. Add products to build your order.</p>
                </div>
              ) : (
                <div className="max-h-[55vh] overflow-y-auto space-y-2.5 pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs border-b border-slate-100 pb-2.5">
                      <div>
                        <p className="font-extrabold text-slate-900 max-w-[150px]">{item.name}</p>
                        <p className="text-slate-400 text-[11px]">Qty: {item.quantity} × ₹{item.mrp} <span className="text-purple-700 font-bold">({item.gst_percent || 0}% GST)</span></p>
                      </div>
                      <p className="font-black text-slate-900 text-sm">₹{item.quantity * item.mrp}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="space-y-1 text-xs sm:text-sm">
                  <div className="flex justify-between text-slate-600"><span>Subtotal:</span><span className="font-bold">₹{cartSubtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Total GST:</span><span className="font-bold text-purple-700">+ ₹{totalGstAmount.toFixed(2)}</span></div>
                  <div className="pt-2 flex justify-between items-center font-black text-base border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span className="text-amber-600">₹{cartGrandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <a href="/login" className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-xs sm:text-sm uppercase tracking-wider block text-center shadow-lg shadow-amber-600/30 transition-all">
                  Proceed to Checkout
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 35s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}