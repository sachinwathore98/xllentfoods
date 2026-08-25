'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { ArrowRight, PackageCheck, Sparkles } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  category: string;
  sku: string;
  mrp: number;
  status: string;
}

export default function PublicCataloguePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    API.get('/products/public')
      .then((res) => {
        setProducts(res.data.products || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load catalogue", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="bg-amber-600 text-white p-2 rounded-xl font-black tracking-wider text-lg">X</span>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">XLLENT FOOD PRODUCTS</h1>
          </div>
          <a href="/login" className="px-5 py-2.5 text-sm font-semibold bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition flex items-center gap-2 shadow-sm">
            <span>Partner Portal Login</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </header>

      <section className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white py-20 px-6 text-center shadow-inner">
        <div className="max-w-4xl mx-auto">
          <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4 inline-block shadow-sm">
            B2B Distribution & Partner Network
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-6 tracking-tight">Premium Confectionery & Snack Distribution</h2>
          <p className="text-lg sm:text-xl opacity-95 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
            Empowering Super Stockists, Distributors, and Wholesalers with direct bulk ordering, tiered pricing, and automated inventory management.
          </p>
          <a href="/login" className="bg-white text-amber-700 font-bold px-8 py-3.5 rounded-xl shadow-xl hover:bg-slate-100 transition inline-block">
            Access Stockist Portal
          </a>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 border-b pb-4 border-slate-200 gap-4">
          <div>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">Product Showcase</h3>
            <p className="text-sm text-slate-500 mt-1">Explore our certified confectionery and snack range with official retail pricing.</p>
          </div>
          <span className="text-xs bg-amber-100 text-amber-800 font-bold px-3.5 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Retail MRP Showcase
          </span>
        </div>
        
        {loading ? (
          <div className="text-center py-24 text-slate-400 font-medium">Loading live product catalogue...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <div key={product._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-xl hover:border-amber-200 transition duration-300">
                <div className="h-44 bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center text-slate-400 font-medium p-4">
                  <PackageCheck className="w-10 h-10 text-amber-500 mb-2 opacity-80" />
                  <span className="text-xs text-slate-600 font-semibold">{product.name}</span>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between bg-white">
                  <div>
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">{product.category}</span>
                    <h4 className="font-bold text-lg text-slate-900 mt-1 line-clamp-1">{product.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">SKU: {product.sku}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-medium block">Retail MRP</span>
                      <span className="text-2xl font-black text-slate-900">₹{product.mrp}</span>
                    </div>
                    <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1.5 rounded-lg border border-emerald-100">
                      {product.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}