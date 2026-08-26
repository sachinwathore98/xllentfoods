'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/app/lib/api';
import { Package, UserPlus, ShoppingCart, FileText, ArrowRight } from 'lucide-react';

interface FinancialOverview {
  totalProducts: number;
  inventoryValue: number;
  activePartners: number;
  pendingEnquiries: number;
  estimatedRevenue: number;
  monthlyGrowthRate: string;
}

export default function DashboardOverviewPage() {
  const router = useRouter();
  const [financials, setFinancials] = useState<FinancialOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialOverview();
  }, []);

  const fetchFinancialOverview = async () => {
    try {
      setLoading(true);
      const res = await API.get('/api/admin/financial-overview');
      setFinancials(res.data.overview);
    } catch (err) {
      console.error('Error fetching financial overview:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen text-slate-800">
      
      {/* Top Header Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time B2B financial metrics and distribution insights</p>
        </div>
        <button 
          onClick={fetchFinancialOverview}
          className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-100 transition cursor-pointer border border-amber-200"
        >
          Refresh Analytics
        </button>
      </div>

      {/* Quick Action Toolbar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <a href="/dashboard/inventory" className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-amber-500 transition flex items-center gap-3 group cursor-pointer">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900">Manage Catalog</h4>
            <p className="text-[10px] text-slate-400">Add or edit products</p>
          </div>
        </a>

        <a href="/dashboard/users/create" className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-amber-500 transition flex items-center gap-3 group cursor-pointer">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900">Provision User</h4>
            <p className="text-[10px] text-slate-400">Add downline tiers</p>
          </div>
        </a>

        <a href="/dashboard/orders" className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-amber-500 transition flex items-center gap-3 group cursor-pointer">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900">Smart Orders</h4>
            <p className="text-[10px] text-slate-400">Fulfillment & routing</p>
          </div>
        </a>

        <a href="/dashboard/enquiries" className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-amber-500 transition flex items-center gap-3 group cursor-pointer">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900">Enquiries</h4>
            <p className="text-[10px] text-slate-400">Review leads</p>
          </div>
        </a>
      </div>

      {/* Analytics Metric Cards Grid */}
      {loading ? (
        <p className="text-xs text-slate-500 text-center py-12">Loading financial metrics...</p>
      ) : financials ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Estimated Revenue</p>
              <h3 className="text-2xl font-black text-amber-600 mt-2">₹{financials.estimatedRevenue.toLocaleString()}</h3>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[11px] text-emerald-600 font-bold">Monthly Growth {financials.monthlyGrowthRate}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Inventory Valuation</p>
              <h3 className="text-2xl font-black text-slate-900 mt-2">₹{financials.inventoryValue.toLocaleString()}</h3>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
              <span className="font-bold">{financials.totalProducts} Total SKUs</span>
              <a href="/dashboard/inventory" className="text-amber-600 font-bold hover:underline flex items-center gap-0.5">View <ArrowRight className="w-3 h-3" /></a>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Network Partners</p>
              <h3 className="text-2xl font-black text-blue-600 mt-2">{financials.activePartners}</h3>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
              <span className="font-bold">Downline tiers connected</span>
              <a href="/dashboard/users/create" className="text-blue-600 font-bold hover:underline flex items-center gap-0.5">Add <ArrowRight className="w-3 h-3" /></a>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Enquiries</p>
              <h3 className="text-2xl font-black text-purple-600 mt-2">{financials.pendingEnquiries}</h3>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
              <span className="font-bold">Awaiting validation</span>
              <a href="/dashboard/enquiries" className="text-purple-600 font-bold hover:underline flex items-center gap-0.5">Review <ArrowRight className="w-3 h-3" /></a>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-red-500 text-center py-12">Failed to load analytics data.</p>
      )}
    </div>
  );
}