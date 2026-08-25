'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldAlert, UserCheck, Package, ShoppingCart, 
  TrendingUp, Users, PlusCircle, FileText, LogOut, Building2 
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userStr));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-medium">Loading portal session...</div>;

  // Role badge styling helper
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return { label: 'System Super Admin', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'super_stockist': return { label: 'Super Stockist', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'distributor': return { label: 'Verified Distributor', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'shop': return { label: 'Retail Shop Partner', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      default: return { label: 'Field Employee', color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const badge = getRoleBadge(user.role);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-amber-600 text-white p-2 rounded-xl font-black tracking-wider text-lg">X</div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900">Xellent DMS Portal</h1>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                {badge.label}
              </span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 text-xs font-bold bg-rose-50 text-rose-700 rounded-xl hover:bg-rose-100 transition flex items-center gap-1.5 border border-rose-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-8 text-white shadow-lg mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="bg-white/20 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              Welcome Back
            </span>
            <h2 className="text-3xl font-extrabold mt-2 tracking-tight">{user.name}</h2>
            <p className="text-sm opacity-90 mt-1 max-w-xl font-light">
              Manage your network downline, track confectionery inventory levels, and process distribution orders efficiently.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {(user.role === 'admin' || user.role === 'super_stockist' || user.role === 'distributor') && (
              <a 
                href="/dashboard/users/create" 
                className="bg-white text-amber-800 font-bold px-5 py-3 rounded-xl shadow-md hover:bg-slate-100 transition flex items-center gap-2 text-xs"
              >
                <PlusCircle className="w-4 h-4 text-amber-600" />
                <span>Create Downline Credential</span>
              </a>
            )}
            <a 
              href="/" 
              target="_blank"
              className="bg-black/20 backdrop-blur-md text-white font-semibold px-5 py-3 rounded-xl hover:bg-black/30 transition text-xs flex items-center gap-2 border border-white/20"
            >
              <span>View Public Catalogue ↗</span>
            </a>
          </div>
        </div>

        {/* Quick Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Users className="w-6 h-6" /></div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Downline Network</span>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">Active</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Package className="w-6 h-6" /></div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Catalogue Items</span>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">Live</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><ShoppingCart className="w-6 h-6" /></div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Bulk Orders</span>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">Processed</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl"><TrendingUp className="w-6 h-6" /></div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tier Status</span>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5 capitalize">{user.role.replace('_', ' ')}</h3>
            </div>
          </div>
        </div>

        {/* Role-Specific Action Center */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h3 className="text-xl font-extrabold text-slate-900 mb-4 tracking-tight">Tier Permissions & Quick Actions</h3>
          <p className="text-xs text-slate-500 mb-6">
            As a <span className="font-bold uppercase text-slate-700">{user.role}</span>, you have secure access to provision lower hierarchy partners and manage supply chain distribution logs.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(user.role === 'admin' || user.role === 'super_stockist' || user.role === 'distributor') && (
              <a href="/dashboard/users/create" className="p-5 bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-200 rounded-xl transition flex flex-col justify-between group">
                <div>
                  <UserCheck className="w-6 h-6 text-amber-600 mb-3" />
                  <h4 className="font-bold text-slate-900 text-sm">Provision Downline User</h4>
                  <p className="text-xs text-slate-500 mt-1">Create IDs and passwords for your immediate lower network level.</p>
                </div>
                <span className="text-xs font-semibold text-amber-600 mt-4 group-hover:underline">Open Form →</span>
              </a>
            )}

            <a href="/" className="p-5 bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-200 rounded-xl transition flex flex-col justify-between group">
              <div>
                <Package className="w-6 h-6 text-amber-600 mb-3" />
                <h4 className="font-bold text-slate-900 text-sm">Browse Public Catalogue</h4>
                <p className="text-xs text-slate-500 mt-1">Check official retail MRPs and product SKUs currently live on network.</p>
              </div>
              <span className="text-xs font-semibold text-amber-600 mt-4 group-hover:underline">View Items →</span>
            </a>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
              <div>
                <ShieldAlert className="w-6 h-6 text-slate-400 mb-3" />
                <h4 className="font-bold text-slate-900 text-sm">Secure Session</h4>
                <p className="text-xs text-slate-500 mt-1">Authenticated via JWT with Brevo encrypted recovery protocols.</p>
              </div>
              <span className="text-xs font-semibold text-slate-400 mt-4">Active & Secured</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}