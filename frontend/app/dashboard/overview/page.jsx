'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/app/lib/api';
import { LayoutDashboard, Package, Users, ShieldCheck, LogOut, ArrowUpRight } from 'lucide-react';

export default function DashboardOverview() {
  const [productsCount, setProductsCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch catalogue summary count
    API.get('/products/public')
      .then((res) => {
        setProductsCount(res.data.products?.length || 0);
      })
      .catch((err) => console.error(err));
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <span className="bg-amber-600 text-white p-2 rounded-xl font-black text-lg">X</span>
            <h1 className="font-extrabold text-lg tracking-tight">XELLENT DMS</h1>
          </div>
          <nav className="space-y-2">
            <a href="/dashboard/overview" className="flex items-center gap-3 px-4 py-3 bg-amber-600 rounded-xl text-sm font-semibold transition">
              <LayoutDashboard className="w-4 h-4" /> Overview
            </a>
            <a href="/dashboard/inventory" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-xl text-sm font-medium text-slate-300 transition">
              <Package className="w-4 h-4" /> Inventory & Stock
            </a>
            <a href="/dashboard/pricing" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-xl text-sm font-medium text-slate-300 transition">
              <Users className="w-4 h-4" /> Partner Network
            </a>
          </nav>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-semibold transition">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-10 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Super Admin Control Center</h2>
            <p className="text-sm text-slate-500">Manage distribution networks, pricing tiers, and inventory flow.</p>
          </div>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> System Online & Secure
          </span>
        </header>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Products</span>
            <div className="text-3xl font-black text-slate-900 mt-2">{productsCount} SKU Items</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Distribution Tier</span>
            <div className="text-3xl font-black text-amber-600 mt-2">Multi-Level Active</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Database Status</span>
            <div className="text-3xl font-black text-emerald-600 mt-2">MongoDB Connected</div>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Navigation Modules</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a href="/dashboard/inventory" className="p-5 rounded-xl border border-slate-100 bg-slate-50 hover:border-amber-500 transition flex justify-between items-center group">
              <div>
                <h4 className="font-bold text-slate-900">Manage Inventory Stock</h4>
                <p className="text-xs text-slate-500 mt-0.5">Add or update stock levels across warehouses.</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 transition" />
            </a>
            <a href="/dashboard/pricing" className="p-5 rounded-xl border border-slate-100 bg-slate-50 hover:border-amber-500 transition flex justify-between items-center group">
              <div>
                <h4 className="font-bold text-slate-900">Tiered Pricing Control</h4>
                <p className="text-xs text-slate-500 mt-0.5">Configure discounts for Stockists and Distributors.</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 transition" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}