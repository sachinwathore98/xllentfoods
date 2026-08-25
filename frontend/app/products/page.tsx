'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { Package, ArrowRight } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await API.get('/products/public');
      setProducts(res.data.products || []);
    } catch (err) {
      console.error("Error fetching products", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow">
        <div className="bg-slate-900 text-white py-24 px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <span className="bg-amber-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block">
              Catalog & Inventory
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">
              Our FMCG Product Range
            </h1>
            <p className="text-slate-300 text-sm sm:text-base font-light">
              High-quality consumer packaged goods manufactured for maximum market demand.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-20">
          {loading ? (
            <div className="text-center py-20 text-slate-400 text-xs font-semibold">Loading catalog items...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs font-semibold">
              No products available at the moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <div key={product._id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition duration-300 flex flex-col justify-between group">
                  <div>
                    <div className="h-60 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      ) : (
                        <Package className="w-16 h-16 text-slate-300" />
                      )}
                      <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider">
                        {product.category || 'FMCG'}
                      </span>
                    </div>
                    <div className="p-6">
                      <h3 className="font-extrabold text-slate-900 text-lg mb-2">{product.name}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{product.description || 'Premium quality product manufactured for high consumer demand and rapid retail turnover.'}</p>
                    </div>
                  </div>
                  <div className="p-6 pt-0 flex justify-between items-center border-t border-slate-100 mt-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">MRP</span>
                      <span className="text-lg font-black text-slate-900">₹{product.mrp}</span>
                    </div>
                    <a href="/login" className="px-4 py-2.5 bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white font-bold rounded-xl text-xs transition duration-300 flex items-center gap-1.5">
                      <span>Order Bulk</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}