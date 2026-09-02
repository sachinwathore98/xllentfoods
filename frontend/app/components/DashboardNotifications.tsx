'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import API from '@/app/lib/api';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { Package, ShoppingCart, Plus, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (id) fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const res = await API.get('/api/products/public');
      const found = (res.data.products || []).find((p: any) => p.id === Number(id));
      setProduct(found || null);
    } catch (err) {
      console.error('Error fetching product details', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm font-semibold text-slate-400">Loading product details...</div>;
  }

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center text-sm font-semibold text-slate-400">Product not found.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between selection:bg-amber-500 selection:text-white">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-8 py-12 w-full">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-12 shadow-xl grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          <div className="bg-slate-100 rounded-3xl overflow-hidden flex items-center justify-center h-[350px] sm:h-[480px] border border-slate-200 relative">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-20 h-20 text-slate-300" />
            )}
            <span className="absolute top-4 left-4 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider">
              {product.category || 'FMCG'}
            </span>
          </div>

          <div className="flex flex-col justify-between space-y-6">
            <div>
              <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                SKU: {product.sku || 'N/A'}
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 mt-3">{product.name}</h1>
              
              <div className="mt-4 flex items-baseline gap-4">
                <span className="text-3xl sm:text-5xl font-black text-slate-900">₹{product.mrp}</span>
                <span className="text-xs sm:text-sm text-slate-400 uppercase font-bold">Inclusive of all wholesale taxes</span>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-6 space-y-4">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold uppercase text-slate-400 tracking-wider">Product Description</h4>
                  <p className="text-base sm:text-lg text-slate-600 mt-1 leading-relaxed">{product.description || 'Premium high-grade FMCG product manufactured under strict quality standards.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm sm:text-base">
                  <div>
                    <span className="text-slate-400 text-xs block font-bold">Pieces per Packet:</span>
                    <span className="font-black text-slate-900">{product.pieces_per_packet || 1} Pcs</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block font-bold">Packets per Carton:</span>
                    <span className="font-black text-slate-900">{product.packets_per_carton || 1} Pkts</span>
                  </div>
                </div>

                {product.ingredients && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold uppercase text-slate-400 tracking-wider">Ingredients</h4>
                    <p className="text-sm sm:text-base text-slate-600 mt-1">{product.ingredients}</p>
                  </div>
                )}

                {product.expiry_date && (
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs sm:text-sm text-amber-900 flex items-center gap-2 font-semibold">
                    <RefreshCw className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Expiry Date: {product.expiry_date} (Eligible for 60-day unsold return policy)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center text-xs sm:text-sm text-slate-600 font-semibold">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col items-center gap-1">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                  <span>Verified Quality</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col items-center gap-1">
                  <Truck className="w-5 h-5 text-amber-600" />
                  <span>Direct Dispatch</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col items-center gap-1">
                  <RefreshCw className="w-5 h-5 text-amber-600" />
                  <span>60-Day Returns</span>
                </div>
              </div>

              <button
                onClick={() => setAdded(true)}
                className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl text-base sm:text-lg uppercase tracking-wider transition shadow-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingCart className="w-5 h-5" /> {added ? 'Added to Cart!' : 'Add to Distribution Cart'}
              </button>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}