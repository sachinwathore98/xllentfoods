'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { ShieldCheck, TrendingUp, Users, ArrowRight, Package, CheckCircle2 } from 'lucide-react';

const SLIDER_IMAGES = [
  '/images/slider-1.jpg',
  '/images/slider-2.jpg',
  '/images/slider-3.jpg'
];

export default function PublicHomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto slide effect every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDER_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchPublicProducts();
  }, []);

  const fetchPublicProducts = async () => {
    try {
      const res = await API.get('/products/public');
      setProducts(res.data.products || []);
    } catch (err) {
      console.error("Error fetching public products", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <Navbar />

      {/* Cut-to-Cut Full-Length Image Slider */}
      <section className="relative w-full h-[450px] sm:h-[550px] overflow-hidden bg-slate-900">
        {SLIDER_IMAGES.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
          >
            <img src={img} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-8 sm:p-16">
              <div className="max-w-3xl">
                <span className="bg-amber-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 inline-block">
                  FMCG & Beyond Network
                </span>
                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                  Scale Your Distribution Business With Massive Profit Margins
                </h1>
                <p className="text-sm sm:text-base text-slate-200 mt-2 font-light">
                  Partner with Xllent Foods as a Super Stockist or Distributor and dominate your regional market.
                </p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* About Us & Vision / Mission Section */}
      <section id="about" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              About Xllent Foods
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3 tracking-tight">
              Pioneering Excellence in FMCG & Beyond
            </h2>
            <p className="text-sm text-slate-600 mt-4 leading-relaxed font-light">
              Xllent Foods is a dynamic leader in the consumer packaged goods industry, dedicated to manufacturing and distributing exceptional confectionery, snacks, and daily essentials. Our robust multi-tier distribution ecosystem connects top-tier manufacturers seamlessly with Super Stockists, regional Distributors, and local retail shops.
            </p>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed font-light">
              By combining high-volume operational efficiency with advanced digital management workflows, we ensure complete transparency, rapid stock replenishment, and maximum profitability across our entire network.
            </p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 sm:p-12 rounded-3xl text-white shadow-xl">
            <h3 className="text-2xl font-black tracking-tight mb-4">The Xllent Advantage</h3>
            <ul className="space-y-4 text-xs sm:text-sm font-medium">
              <li className="flex items-start gap-3">
                <span className="bg-white/20 p-1.5 rounded-lg mt-0.5">✓</span>
                <span>Robust supply chain network spanning multi-state distribution channels.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-white/20 p-1.5 rounded-lg mt-0.5">✓</span>
                <span>Empowering local entrepreneurs with protected regional territory rights.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-white/20 p-1.5 rounded-lg mt-0.5">✓</span>
                <span>Cutting-edge digital portal tracking live orders, invoices, and downline partners.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Vision & Mission Cards */}
        <div id="vision-mission" className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-slate-200">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="text-amber-600 font-extrabold text-xs uppercase tracking-widest mb-2">Our Vision</div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">Empowering Global Distribution Networks</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              To build the most trusted, transparent, and technologically advanced FMCG distribution network globally—fostering long-term prosperity and unmatched market reach for every partner in our hierarchy.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="text-amber-600 font-extrabold text-xs uppercase tracking-widest mb-2">Our Mission</div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">Quality Products & Profitable Growth</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              To consistently deliver superior quality food products that consumers love, while equipping our Super Stockists and Distributors with high profit margins, secure territories, and digital tools to scale effortlessly.
            </p>
          </div>
        </div>
      </section>

      {/* High-Conversion Partnership Section */}
      <section id="partner-section" className="py-20 px-6 max-w-7xl mx-auto bg-slate-100 rounded-3xl mb-20 border border-slate-200">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Lucrative Opportunity
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3 tracking-tight">
            Why Partner With Xllent Foods?
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Our tiered distribution structure is engineered to maximize profitability for Super Stockists and regional Distributors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-400 transition">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl w-fit mb-6"><TrendingUp className="w-8 h-8" /></div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">High Profit Margins</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enjoy industry-leading margins designed specifically to ensure rapid ROI and substantial earnings for both Super Stockists and Distributors.
            </p>
            <ul className="mt-6 space-y-2 text-xs font-semibold text-slate-700">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Tiered wholesale pricing</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Volume incentive bonuses</li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-400 transition">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-6"><ShieldCheck className="w-8 h-8" /></div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Exclusive Territory Rights</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Secure protected operating zones for Super Stockists, ensuring zero internal channel conflict and complete regional market capture.
            </p>
            <ul className="mt-6 space-y-2 text-xs font-semibold text-slate-700">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Protected regional distribution</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Direct brand marketing backing</li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-400 transition">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-6"><Users className="w-8 h-8" /></div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Complete Downline Control</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Easily provision and manage your retail shops and subordinate distributors using our advanced digital management portal.
            </p>
            <ul className="mt-6 space-y-2 text-xs font-semibold text-slate-700">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Instant digital credential generation</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Real-time order tracking</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 text-center">
          <a href="/login" className="inline-flex items-center gap-2 px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl shadow-xl transition text-sm">
            <span>Apply For Super Stockist / Distributor Access</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Dynamic Products Showcase Section */}
      <section id="products" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Official Catalog
            </span>
            <h2 className="text-3xl font-black text-slate-900 mt-3 tracking-tight">Our FMCG Product Range</h2>
          </div>
          <p className="text-xs text-slate-500 max-w-md">
            High-quality consumer products added and managed directly through our administrative dashboard, ready for bulk dispatch.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs font-semibold">Loading catalog items...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs font-semibold">
            No products available yet. Check back soon or log in as admin to add inventory.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
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
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{product.description || 'Premium quality product manufactured for high consumer demand.'}</p>
                  </div>
                </div>
                <div className="p-5 pt-0 flex justify-between items-center border-t border-slate-100 mt-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">MRP</span>
                    <span className="text-base font-black text-slate-900">₹{product.mrp}</span>
                  </div>
                  <a href="/login" className="px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold rounded-xl text-xs transition">
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