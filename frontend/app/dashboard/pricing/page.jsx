'use client';
import { useState } from 'react';
import API from '@/app/lib/api';
import { Users, UserPlus, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PartnerNetworkPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'superstockist',
    phone: '',
    location: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await API.post('/admin/create-user', formData);
      setMessage(`Successfully created ${formData.role} account for ${res.data.user.name}!`);
      setFormData({ name: '', email: '', password: '', role: 'superstockist', phone: '', location: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create partner account.');
    } finally {
      setLoading(false);
    }
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
            <a href="/dashboard/overview" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-xl text-sm font-medium text-slate-300 transition">
              Overview
            </a>
            <a href="/dashboard/inventory" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-xl text-sm font-medium text-slate-300 transition">
              Inventory & Stock
            </a>
            <a href="/dashboard/pricing" className="flex items-center gap-3 px-4 py-3 bg-amber-600 rounded-xl text-sm font-semibold transition">
              Partner Network
            </a>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-10 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Partner Network Management</h2>
            <p className="text-sm text-slate-500">Onboard Super Stockists, Distributors, Shops, and Field Employees.</p>
          </div>
          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Tier Control Active
          </span>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Onboarding Form */}
          <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Register New Partner Account</h3>
                <p className="text-xs text-slate-500">Create access credentials for downstream supply chain members.</p>
              </div>
            </div>

            {message && (
              <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold p-4 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {message}
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold p-4 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Full Name / Business Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Shri Ganesh Enterprises" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="partner@xellent.com" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Temporary Password</label>
                  <input 
                    type="password" 
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Assign Role Tier</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 text-slate-900 font-medium"
                  >
                    <option value="superstockist">Super Stockist</option>
                    <option value="distributor">Distributor</option>
                    <option value="shop">Shop / Wholesaler</option>
                    <option value="employee">Field Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Phone Number</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9876543210" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Location / Region</label>
                  <input 
                    type="text" 
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Chhatrapati Sambhajinagar" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 text-slate-900"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Provisioning Account...' : 'Create Partner Account'}</span>
              </button>
            </form>
          </div>

          {/* Quick Info Box */}
          <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <Shield className="w-8 h-8 text-amber-500 mb-4" />
              <h4 className="font-bold text-lg mb-2">Hierarchy Protocol</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Accounts created here immediately receive role-based permissions. Super Stockists can manage downstream distributors, while field employees can log in to place proxy orders for local shops.
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-400">
              Xellent DMS v1.0 Secure Node
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}