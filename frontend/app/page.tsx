'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import API from '@/app/lib/api';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { Package, Search, Plus, ShoppingCart, SlidersHorizontal, ArrowUpDown, Zap } from 'lucide-react';

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

  // Calculate Subtotal, GST, and Grand Total
  const cartSubtotal = cart.reduce((acc, item) => acc + (item.quantity * Number(item.mrp)), 0);
  const totalGstAmount = cart.reduce((acc, item) => {
    const itemTotal = item.quantity * Number(item.mrp);
    const gstRate = Number(item.gst_percent || 0);
    return acc + (itemTotal * (gstRate / 100));
  }, 0);
  const cartGrandTotal = cartSubtotal + totalGstAmount;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col justify-between selection:bg-amber-500 selection:text-white">
      <Navbar />

      <section className="relative w-full overflow-hidden bg-slate-950 shadow-md">
        <div className="relative w-full">
          {SLIDER_IMAGES.map((img, index) => (
            <div
              key={index}
              className={`transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100 relative block' : 'opacity-0 absolute inset-0 hidden'
              }`}
            >
              <img 
                src={img} 
                alt={`Banner ${index + 1}`} 
                className="w-full h-auto object-contain block mx-auto" 
              />
            </div>
          ))}
        </div>
        <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-2">
          {SLIDER_IMAGES.map((_, idx) => (
            <button key={idx} onClick={() => setCurrentSlide(idx)} className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-amber-500' : 'w-2 bg-white/50'}`} />
          ))}
        </div>
      </section>

      <section className="max-w-[90rem] mx-auto px-4 sm:px-6 w-full pt-6">
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-md border border-slate-200/80 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="w-full md:w-[420px]">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search for snacks, confectionery, namkeen & more..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 flex-1 sm:flex-none">
              <SlidersHorizontal className="w-4 h-4 text-amber-600" />
              <select value={selectedCategory} onChange={(e) => handleCategoryChange(e.target.value)} className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer">
                <option value="All">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 flex-1 sm:flex-none">
              <ArrowUpDown className="w-4 h-4 text-amber-600" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer">
                <option value="default">Sort By: Featured</option>
                <option value="low-high">Price: Low to High</option>
                <option value="high-low">Price: High to Low</option>
                <option value="name-az">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-grow max-w-[90rem] mx-auto px-4 sm:px-6 py-8 w-full">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/10 text-amber-600 rounded-xl"><Zap className="w-4 h-4" /></span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Featured FMCG Products</h2>
          </div>
          <span className="text-sm font-bold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            {filteredProducts.length} Items Live
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-20 text-slate-400 text-sm font-semibold animate-pulse">Loading store inventory...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm font-semibold shadow-sm">
                No products found matching your search.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {filteredProducts.map((product, index) => {
                  const adIndex = Math.floor(index / 50);
                  const showAdHere = (index + 1) % 50 === 0 && ads.length > 0 && ads[adIndex % ads.length];

                  return (
                    <React.Fragment key={product.id}>
                      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group">
                        <div>
                          <Link href={`/products/${product.id}`} className="block relative">
                            <div className="h-32 sm:h-36 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                              {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                              ) : (
                                <Package className="w-8 h-8 text-slate-300" />
                              )}
                              <span className="absolute top-1.5 left-1.5 bg-white/95 backdrop-blur-md text-slate-800 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase shadow-sm border border-slate-100">
                                {product.category || 'FMCG'}
                              </span>
                            </div>
                          </Link>
                          <div className="p-3">
                            <Link href={`/products/${product.id}`}>
                              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate group-hover:text-amber-600 transition">{product.name}</h3>
                            </Link>
                            <div className="flex justify-between items-center mt-0.5">
                              <span className="text-[10px] text-slate-400 font-mono">SKU: {product.sku || 'N/A'}</span>
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">GST {product.gst_percent || 0}%</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 font-light">{product.description || 'Premium quality FMCG product.'}</p>
                            
                            <div className="mt-2 text-[10px] text-slate-600 bg-amber-50 p-2 rounded-xl border border-amber-100 flex flex-col gap-0.5 font-semibold">
                              <span className="text-amber-700">📦 Pkt: {product.pieces_per_packet || 1} Pcs</span>
                              <span className="text-blue-700">📦 Ctn: {product.packets_per_carton || 1} Pkts</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 pt-0 flex justify-between items-center border-t border-slate-100 mt-2">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">MRP</span>
                            <span className="text-xs sm:text-sm font-black text-slate-900">₹{product.mrp}</span>
                          </div>
                          <button
                            onClick={() => addToCart(product)}
                            className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-all duration-200 flex items-center gap-1 cursor-pointer shadow-md hover:scale-105 active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add
                          </button>
                        </div>
                      </div>

                      {showAdHere && (
                        <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5 my-6 overflow-hidden rounded-3xl shadow-lg border border-amber-200 bg-amber-50">
                          <a href={ads[adIndex % ads.length].target_url || '#'} target="_blank" rel="noopener noreferrer" className="block relative h-44 sm:h-56">
                            <img src={ads[adIndex % ads.length].image_url} alt="Advertisement" className="w-full h-full object-cover" />
                            <div className="absolute top-3 left-3 bg-slate-900/80 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-widest backdrop-blur-sm">
                              Sponsored Ad
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

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm sticky top-24">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                <ShoppingCart className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-slate-900 text-sm sm:text-base">Shopping Cart ({cart.reduce((acc, item) => acc + item.quantity, 0)})</h3>
              </div>

              {cart.length === 0 ? (
                <p className="text-xs sm:text-sm text-slate-400 text-center py-8">Your cart is empty. Add products to place an order.</p>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs sm:text-sm border-b border-slate-100 pb-2">
                      <div>
                        <p className="font-bold text-slate-900 truncate max-w-[120px]">{item.name}</p>
                        <p className="text-slate-400 text-xs">Qty: {item.quantity} × ₹{item.mrp} <span className="text-purple-600 font-bold">({item.gst_percent || 0}% GST)</span></p>
                      </div>
                      <p className="font-black text-slate-900">₹{item.quantity * item.mrp}</p>
                    </div>
                  ))}

                  {/* Bill Breakdown with GST */}
                  <div className="pt-3 space-y-1.5 border-t border-slate-200 text-xs sm:text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-bold">₹{cartSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Total GST Applicable:</span>
                      <span className="font-bold text-purple-700">+ ₹{totalGstAmount.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 flex justify-between items-center font-black text-sm sm:text-base border-t border-slate-200">
                      <span>Grand Total:</span>
                      <span className="text-amber-600">₹{cartGrandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <a href="/login" className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs sm:text-sm uppercase tracking-wider block text-center shadow-lg transition hover:scale-[1.02] mt-3">
                    Proceed to Checkout
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}