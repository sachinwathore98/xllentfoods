'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import API from '@/app/lib/api';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { Package, Search, Plus, ShoppingCart, SlidersHorizontal, ArrowUpDown, Zap, Sparkles, TrendingUp, ShieldCheck, Award, ChevronRight } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);

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
      const [catRes, prodRes, adsRes] = await Promise.all([
        API.get('/api/categories').catch(() => ({ data: { categories: [] } })),
        API.get('/api/products/public').catch(() => ({ data: { products: [] } })),
        API.get('/api/advertisements/public').catch(() => ({ data: { advertisements: [] } }))
      ]);

      setCategories(catRes.data.categories || []);
      setProducts(prodRes.data.products || []);
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

  // Separate horizontal and vertical ads
  const horizontalAds = ads.filter((ad) => ad.banner_type === 'horizontal' || !ad.banner_type);
  const verticalAds = ads.filter((ad) => ad.banner_type === 'vertical');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between selection:bg-amber-500 selection:text-white">
      <Navbar />

      {/* Top Animated Ticker */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-white text-xs font-bold py-2.5 px-4 text-center tracking-wider uppercase shadow-inner flex items-center justify-center gap-2 animate-pulse">
        <Sparkles className="w-4 h-4" />
        <span>⚡ Exclusive B2B Wholesale Margins & Automated GST Billing Live Nationwide!</span>
        <Sparkles className="w-4 h-4" />
      </div>

      {/* Main Hero Slider */}
      <section className="relative w-full overflow-hidden bg-slate-950 shadow-2xl">
        <div className="relative w-full min-h-[300px] sm:min-h-[440px] flex items-center justify-center">
          {SLIDER_IMAGES.map((img, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
                index === currentSlide ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0'
              }`}
            >
              <img src={img} alt={`Banner ${index + 1}`} className="w-full h-full object-cover brightness-95" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-6 sm:p-12">
                <div className="max-w-7xl mx-auto w-full space-y-2">
                  <span className="bg-amber-500 text-slate-950 text-[10px] sm:text-xs font-black uppercase px-3.5 py-1 rounded-full shadow-lg tracking-widest inline-block">
                    Verified CPG Network
                  </span>
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight drop-shadow-md">
                    Direct Distribution & Bulk Supply Hub
                  </h1>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-4 left-0 right-0 z-30 flex justify-center gap-2">
          {SLIDER_IMAGES.map((_, idx) => (
            <button key={idx} onClick={() => setCurrentSlide(idx)} className={`h-2.5 rounded-full transition-all duration-500 ${idx === currentSlide ? 'w-10 bg-amber-500' : 'w-2.5 bg-white/50 hover:bg-white'}`} />
          ))}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-white border-b border-slate-200 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-700"><Award className="w-5 h-5 text-amber-600" /> Direct Manufacturer Pricing</div>
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-700"><TrendingUp className="w-5 h-5 text-amber-600" /> High-Margin Tiers</div>
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-700"><ShieldCheck className="w-5 h-5 text-amber-600" /> Secure GST Invoicing</div>
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-700"><Zap className="w-5 h-5 text-amber-600" /> Smart Order Routing</div>
        </div>
      </section>

      {/* Search & Filter Bar */}
      <section className="max-w-[90rem] mx-auto px-4 sm:px-6 w-full pt-8">
        <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="w-full md:w-[460px]">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-amber-600" />
              <input
                type="text"
                placeholder="Search confectionery, snacks, chocolates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex-1 sm:flex-none">
              <SlidersHorizontal className="w-4 h-4 text-amber-600" />
              <select value={selectedCategory} onChange={(e) => handleCategoryChange(e.target.value)} className="bg-transparent text-xs sm:text-sm font-bold text-slate-700 focus:outline-none cursor-pointer">
                <option value="All">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex-1 sm:flex-none">
              <ArrowUpDown className="w-4 h-4 text-amber-600" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent text-xs sm:text-sm font-bold text-slate-700 focus:outline-none cursor-pointer">
                <option value="default">Sort By: Featured</option>
                <option value="low-high">Price: Low to High</option>
                <option value="high-low">Price: High to Low</option>
                <option value="name-az">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog View */}
      <main className="flex-grow max-w-[90rem] mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-amber-500/10 text-amber-600 rounded-2xl shadow-sm"><Zap className="w-5 h-5" /></span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Wholesale Product Catalog</h2>
          </div>
          <span className="text-xs sm:text-sm font-extrabold text-amber-700 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-200 shadow-sm">
            {filteredProducts.length} Items Live
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            {loading ? (
              <div className="text-center py-24 text-slate-400 text-sm font-bold animate-pulse">Loading live catalog inventory...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 text-slate-400 text-sm font-bold">No products found.</div>
            ) : (
              <div>
                {filteredProducts.map((product, index) => {
                  const adIndex = Math.floor(index / 20);
                  const activeHorizontalAd = horizontalAds.length > 0 ? horizontalAds[adIndex % horizontalAds.length] : null;
                  const showHorizontalAd = (index + 1) % 20 === 0 && activeHorizontalAd;

                  const isGridStart = index % 10 === 0;
                  const gridChunk = filteredProducts.slice(index, index + 10);

                  if (!isGridStart) return null;

                  return (
                    <React.Fragment key={`chunk-${index}`}>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
                        {gridChunk.map((p) => (
                          <div key={p.id} className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group">
                            <div>
                              <Link href={`/products/${p.id}`} className="block relative">
                                <div className="h-36 sm:h-40 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                                  {p.image ? (
                                    <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                                  ) : (
                                    <Package className="w-10 h-10 text-slate-300" />
                                  )}
                                  <span className="absolute top-2 left-2 bg-slate-900/90 backdrop-blur-md text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                    {p.category || 'FMCG'}
                                  </span>
                                </div>
                              </Link>
                              <div className="p-4">
                                <Link href={`/products/${p.id}`}>
                                  <h3 className="font-black text-slate-900 text-xs sm:text-sm truncate group-hover:text-amber-600 transition">{p.name}</h3>
                                </Link>
                                <div className="flex justify-between items-center mt-1">
                                  <span className="text-[10px] text-slate-400 font-mono font-bold">SKU: {p.sku || 'N/A'}</span>
                                  <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">GST {p.gst_percent || 0}%</span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 font-light">{p.description || 'Premium quality FMCG product.'}</p>
                                
                                <div className="mt-3 text-[10px] text-slate-600 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/60 flex flex-col gap-0.5 font-bold">
                                  <span className="text-amber-800">📦 Pkt: {p.pieces_per_packet || 1} Pcs</span>
                                  <span className="text-blue-800">📦 Ctn: {p.packets_per_carton || 1} Pkts</span>
                                </div>
                              </div>
                            </div>
                            <div className="p-4 pt-0 flex justify-between items-center border-t border-slate-100 mt-2">
                              <div>
                                <span className="text-[9px] uppercase font-black text-slate-400 block tracking-wider">MRP</span>
                                <span className="text-sm sm:text-base font-black text-slate-900">₹{p.mrp}</span>
                              </div>
                              <button
                                onClick={() => addToCart(p)}
                                className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-2xl text-xs transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-600/30 hover:scale-105 active:scale-95"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Right-to-Left Ticker Slider Every 10 Products */}
                      <div className="my-10 bg-slate-900 py-6 rounded-3xl shadow-xl overflow-hidden relative border border-slate-800">
                        <div className="px-6 mb-3 flex items-center justify-between">
                          <span className="text-xs font-black uppercase text-amber-400 tracking-widest flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> Trending Categories & Highlights
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Live Ticker Feed</span>
                        </div>
                        <div className="flex overflow-x-hidden whitespace-nowrap relative w-full">
                          <div className="flex animate-marquee gap-6 items-center">
                            {categories.concat(categories).map((cat, idx) => (
                              <div key={idx} className="flex items-center gap-3 bg-slate-800/80 border border-slate-700 px-5 py-3 rounded-2xl shadow-md shrink-0 hover:border-amber-500 transition cursor-pointer">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                                <span className="text-white text-xs font-black tracking-wide uppercase">{cat.name} Collection</span>
                                <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Horizontal Ad Banner */}
                      {showHorizontalAd && (
                        <div className="my-8 overflow-hidden rounded-3xl shadow-2xl border-2 border-amber-400/50 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
                          <a href={activeHorizontalAd.target_url || '#'} target="_blank" rel="noopener noreferrer" className="block relative h-48 sm:h-60 group">
                            <img src={activeHorizontalAd.image_url} alt="Sponsored Banner" className="w-full h-full object-cover group-hover:scale-105 transition duration-700 opacity-90" />
                            <div className="absolute top-4 left-4 bg-amber-500 text-slate-950 text-xs font-black uppercase px-4 py-1.5 rounded-full tracking-widest shadow-xl flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" /> {activeHorizontalAd.title || 'Featured Promotional Ad'}
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

          {/* Right Sidebar containing Cart AND Vertical Ad Banners */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl sticky top-28 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <span className="p-2 bg-amber-500/10 text-amber-600 rounded-xl"><ShoppingCart className="w-5 h-5" /></span>
                <h3 className="font-black text-slate-900 text-base">Your Cart ({cart.reduce((acc, item) => acc + item.quantity, 0)})</h3>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto animate-bounce" />
                  <p className="text-xs text-slate-400 font-semibold">Your cart is empty. Add items to order.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-xs border-b border-slate-100 pb-2.5">
                        <div>
                          <p className="font-extrabold text-slate-900 truncate max-w-[130px]">{item.name}</p>
                          <p className="text-slate-400 text-[11px]">Qty: {item.quantity} × ₹{item.mrp} <span className="text-purple-700 font-bold">({item.gst_percent || 0}% GST)</span></p>
                        </div>
                        <p className="font-black text-slate-900 text-sm">₹{item.quantity * item.mrp}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 space-y-2 border-t-2 border-dashed border-slate-200 text-xs sm:text-sm">
                    <div className="flex justify-between text-slate-600"><span>Subtotal:</span><span className="font-bold">₹{cartSubtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-slate-600"><span>Total GST:</span><span className="font-bold text-purple-700">+ ₹{totalGstAmount.toFixed(2)}</span></div>
                    <div className="pt-3 flex justify-between items-center font-black text-base border-t border-slate-200">
                      <span>Grand Total:</span>
                      <span className="text-amber-600 text-lg">₹{cartGrandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <a href="/login" className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl text-xs sm:text-sm uppercase tracking-wider block text-center shadow-xl shadow-amber-600/30 transition-all hover:scale-[1.02]">
                    Proceed to Checkout
                  </a>
                </div>
              )}
            </div>

            {/* Vertical Promotional Ad Banners in Sidebar */}
            {verticalAds.length > 0 && (
              <div className="bg-slate-950 p-4 rounded-3xl shadow-xl border border-slate-800 space-y-4 text-white">
                <div className="flex items-center justify-between text-[10px] font-black uppercase text-amber-400 tracking-widest border-b border-slate-800 pb-2">
                  <span>Sponsored Spot</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                {verticalAds.map((ad, idx) => (
                  <div key={idx} className="rounded-2xl overflow-hidden border border-slate-800 group relative">
                    <a href={ad.target_url || '#'} target="_blank" rel="noopener noreferrer" className="block relative h-64 sm:h-72">
                      <img src={ad.image_url} alt="Vertical Ad" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent p-4 flex flex-col justify-end">
                        <span className="text-xs font-black text-white">{ad.title || 'Exclusive Wholesale Deal'}</span>
                        <span className="text-[10px] text-amber-400 uppercase font-bold mt-1">Tap to explore partner offers</span>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 25s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}