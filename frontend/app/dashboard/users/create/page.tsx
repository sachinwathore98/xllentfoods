'use client';
import { useState } from 'react';
import API from '@/app/lib/api';

export default function CreateUserPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('distributor');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await API.post('/api/admin/users/create', {
        name,
        email,
        password,
        role,
        phone,
        location,
      });
      setMessage('User created successfully and credentials assigned!');
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setLocation('');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to create user account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto bg-slate-50 min-h-screen">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-black text-slate-900 mb-1">Provision Downline User</h1>
        <p className="text-sm text-slate-500 mb-6">Create accounts for network tiers (Super Stockist, Distributor, Shop, Employee)</p>

        {message && (
          <div className={`p-4 mb-6 rounded-lg text-sm font-medium ${message.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg text-sm text-black outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Partner Name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg text-sm text-black outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="partner@xllent.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Temporary Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg text-sm text-black outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Assign Role Tier</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm text-black bg-white outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="admin">Admin</option>
                <option value="super_stockist">Super Stockist</option>
                <option value="distributor">Distributor</option>
                <option value="shop">Shop / Retailer</option>
                <option value="employee">Field Employee</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg text-sm text-black outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="9876543210"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Target Location / Region</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg text-sm text-black outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="e.g. Chhatrapati Sambhajinagar"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 text-white font-semibold py-2.5 rounded-lg hover:bg-amber-700 transition-colors mt-4 disabled:opacity-50"
          >
            {loading ? 'Provisioning Account...' : 'Create User Account'}
          </button>
        </form>
      </div>
    </div>
  );
}