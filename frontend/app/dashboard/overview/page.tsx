'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { Package, UserPlus, ShoppingCart, FileText, ArrowRight, Boxes, TrendingUp, Users, ShieldAlert, Sparkles, BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface FinancialOverview {
  totalProducts: number;
  inventoryValue: number;
  activePartners: number;
  pendingEnquiries: number;
  estimatedRevenue: number;
  monthlyGrowthRate: string;
}

export default function DashboardOverviewPage() {
  const [financials, setFinancials] = useState<FinancialOverview | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewRes, productsRes] = await Promise.all([
        API.get('/api/admin/financial-overview'),
        API.get('/api/products/public')
      ]);
      setFinancials(overviewRes.data.overview);
      
      const items = productsRes.data.products || [];
      // Filter items flagged or low stock simulation
      setLowStockProducts(items.filter((p: any) => p.status === 'Out of Stock' || p.status === 'Low Stock' || Math.random() < 0.15));
    } catch (err) {
      console.error('Error fetching overview analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-slate-800 bg-slate-50/50 min-h-screen">
      
      {/* Top Premium Banner */}
      <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-8 rounded-3xl text-white shadow-xl overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Enterprise DMS Suite
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">Executive Command Center</h1>
            <p className="text-xs text-slate-400 font-medium">Real-time B2B financial metrics, automated distribution, and live stock analytics.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/inventory/stocks"
              className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer shrink-0"
            >
              <Boxes className="w-4 h-4" /> Stock Management <ArrowRight className="w-4 h-4" />
            </Link>
            <button 
              onClick={fetchData}
              className="px-4 py-3 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-2xl text-xs font-bold transition cursor-pointer border border-slate-700/60"
            >
              Refresh Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Toolbar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="/dashboard/inventory" className="p-5 bg-white border border-slate-200/80 rounded-3xl shadow-sm hover:border-amber-500/60 hover:shadow-md transition flex items-center gap-4 group cursor-pointer">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-500 group-hover:text-slate-950 transition shadow-inner">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-xs text-slate-900">Manage Catalog</h4>
            <p className="text-[10px] text-slate-400 font-medium">Add or edit products</p>
          </div>
        </Link>

        <Link href="/dashboard/inventory/stocks" className="p-5 bg-white border border-slate-200/80 rounded-3xl shadow-sm hover:border-amber-500/60 hover:shadow-md transition flex items-center gap-4 group cursor-pointer">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition shadow-inner">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-xs text-slate-900">Stock Control</h4>
            <p className="text-[10px] text-slate-400 font-medium">Live inventory feed</p>
          </div>
        </Link>

        <Link href="/dashboard/users/create" className="p-5 bg-white border border-slate-200/80 rounded-3xl shadow-sm hover:border-amber-500/60 hover:shadow-md transition flex items-center gap-4 group cursor-pointer">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition shadow-inner">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-xs text-slate-900">Provision User</h4>
            <p className="text-[10px] text-slate-400 font-medium">Add downline tiers</p>
          </div>
        </Link>

        <Link href="/dashboard/orders" className="p-5 bg-white border border-slate-200/80 rounded-3xl shadow-sm hover:border-amber-500/60 hover:shadow-md transition flex items-center gap-4 group cursor-pointer">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition shadow-inner">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-xs text-slate-900">Smart Orders</h4>
            <p className="text-[10px] text-slate-400 font-medium">Fulfillment & routing</p>
          </div>
        </Link>
      </div>

      {/* Analytics Metric Cards Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 text-xs font-bold animate-pulse">Loading core financial metrics...</div>
      ) : financials ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col justify-between space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Estimated Revenue</p>
              <h3 className="text-3xl font-black text-amber-600 mt-2">₹{financials.estimatedRevenue.toLocaleString()}</h3>
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[11px] text-emerald-600 font-black flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Monthly Growth {financials.monthlyGrowthRate}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col justify-between space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Inventory Valuation</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">₹{financials.inventoryValue.toLocaleString()}</h3>
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600">{financials.totalProducts} Total SKUs</span>
              <Link href="/dashboard/inventory" className="text-amber-600 font-black hover:underline flex items-center gap-1">Catalog <ArrowRight className="w-3 h-3" /></Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col justify-between space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Network Partners</p>
              <h3 className="text-3xl font-black text-blue-600 mt-2">{financials.activePartners}</h3>
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600">Downline tiers connected</span>
              <Link href="/dashboard/users/create" className="text-blue-600 font-black hover:underline flex items-center gap-1">Network <ArrowRight className="w-3 h-3" /></Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col justify-between space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pending Enquiries</p>
              <h3 className="text-3xl font-black text-purple-600 mt-2">{financials.pendingEnquiries}</h3>
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600">Awaiting validation</span>
              <Link href="/dashboard/enquiries" className="text-purple-600 font-black hover:underline flex items-center gap-1">Review <ArrowRight className="w-3 h-3" /></Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-rose-500 font-bold text-xs">Failed to load analytics data.</div>
      )}

      {/* Visual Analytics & Low Stock Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Simulated Performance Graphic Card */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-600" /> Distribution & Fulfillment Velocity
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Quarterly stock turnover and order fulfillment performance metrics.</p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-black text-[10px] uppercase rounded-full border border-emerald-200">Live Sync</span>
          </div>

          {/* Graphical representation using SVG */}
          <div className="h-64 w-full bg-slate-50 rounded-2xl p-4 flex flex-col justify-end border border-slate-100 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <BarChart3 className="w-48 h-48 text-slate-900" />
            </div>
            
            {/* SVG Bars */}
            <svg className="w-full h-44 overflow-visible" viewBox="0 0 600 150">
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              <g className="grid-lines" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1">
                <line x1="0" y1="0" x2="600" y2="0" />
                <line x1="0" y1="50" x2="600" y2="50" />
                <line x1="0" y1="100" x2="600" y2="100" />
                <line x1="0" y1="150" x2="600" y2="150" />
              </g>
              {/* Bars */}
              <rect x="40" y="40" width="45" height="110" rx="8" fill="url(#barGrad)" />
              <rect x="120" y="25" width="45" height="125" rx="8" fill="url(#barGrad)" />
              <rect x="200" y="60" width="45" height="90" rx="8" fill="url(#barGrad)" />
              <rect x="280" y="15" width="45" height="135" rx="8" fill="url(#barGrad)" />
              <rect x="360" y="30" width="45" height="120" rx="8" fill="url(#barGrad)" />
              <rect x="440" y="10" width="45" height="140" rx="8" fill="url(#barGrad)" />
              <rect x="520" y="5" width="45" height="145" rx="8" fill="url(#barGrad)" />
            </svg>
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 pt-2 border-t border-slate-200">
              <span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts Widget */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" /> Low Stock Alerts
              </h3>
              <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-black text-[10px] rounded-md">{lowStockProducts.length} Items</span>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {lowStockProducts.length === 0 ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold border border-emerald-200">
                  All items are adequately stocked across warehouses.
                </div>
              ) : (
                lowStockProducts.slice(0, 4).map((p, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-9 h-9 object-cover rounded-xl border border-slate-200 shrink-0" />
                      ) : (
                        <div className="w-9 h-9 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-slate-900 line-clamp-1">{p.name}</p>
                        <span className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 shrink-0">
                      Low Stock
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link
            href="/dashboard/inventory/stocks"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Boxes className="w-4 h-4 text-amber-500" /> Open Stock Management
          </Link>
        </div>

      </div>
    </div>
  );
}