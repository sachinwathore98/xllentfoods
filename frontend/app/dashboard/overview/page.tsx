'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/app/lib/api';

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
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Dashboard Overview</h1>
          <p className="text-sm text-slate-500">Real-time B2B financial metrics and distribution insights</p>
        </div>
        <button 
          onClick={fetchFinancialOverview}
          className="bg-amber-50 text-amber-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-100 transition-colors"
        >
          Refresh Analytics
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 text-center py-12">Loading financial metrics...</p>
      ) : financials ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm font-medium text-slate-500">Estimated Revenue</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-2">₹{financials.estimatedRevenue.toLocaleString()}</h3>
            <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">Monthly Growth {financials.monthlyGrowthRate}</span>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm font-medium text-slate-500">Total Inventory Valuation</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">₹{financials.inventoryValue.toLocaleString()}</h3>
            <span className="text-xs text-slate-400 mt-1 inline-block">{financials.totalProducts} Total SKUs</span>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm font-medium text-slate-500">Active Network Partners</p>
            <h3 className="text-2xl font-bold text-blue-600 mt-2">{financials.activePartners}</h3>
            <span className="text-xs text-slate-400 mt-1 inline-block">Downline tiers connected</span>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <p className="text-sm font-medium text-slate-500">Pending Enquiries</p>
            <h3 className="text-2xl font-bold text-purple-600 mt-2">{financials.pendingEnquiries}</h3>
            <span className="text-xs text-slate-400 mt-1 inline-block">Awaiting validation</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-red-500 text-center py-12">Failed to load analytics data.</p>
      )}
    </div>
  );
}