'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { UserPlus, MapPin, CheckCircle2, Shield } from 'lucide-react';

interface UserProfile {
  id: number;
  name: string;
  role: string;
}

export default function CreateUserPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Admin@123');
  const [role, setRole] = useState('shop');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [parentId, setParentId] = useState<string>('');
  
  const [parentsList, setParentsList] = useState<UserProfile[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPotentialParents();
  }, []);

  const fetchPotentialParents = async () => {
    try {
      const res = await API.get('/api/admin/users-list');
      setParentsList(res.data.users || []);
    } catch (err) {
      console.error('Failed to load parent hierarchy', err);
    }
  };

  // Dynamic Filtering based on selected role tier:
  // - Super Stockist -> Parent must be Admin (admin, superadmin)
  // - Distributor -> Parent must be Super Stockist (super_stockist)
  // - Retail Shop / Field Employee -> Parent must be Super Stockist or Distributor
  // - Admin -> No parent required
  const getFilteredParents = () => {
    if (role === 'super_stockist') {
      return parentsList.filter(p => p.role === 'admin' || p.role === 'superadmin');
    }
    if (role === 'distributor') {
      return parentsList.filter(p => p.role === 'super_stockist');
    }
    if (role === 'shop' || role === 'employee') {
      return parentsList.filter(p => p.role === 'super_stockist' || p.role === 'distributor');
    }
    return parentsList;
  };

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    setParentId(''); // Reset parent selection when role changes to avoid invalid uplink mapping
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        setMessage('GPS Location successfully pinned!');
        setTimeout(() => setMessage(''), 3000);
      },
      () => {
        alert('Unable to retrieve your location. Please check permissions.');
      }
    );
  };

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
        location: role === 'shop' ? location : null,
        latitude: role === 'shop' ? latitude : null,
        longitude: role === 'shop' ? longitude : null,
        parentId: parentId ? Number(parentId) : null
      });

      setMessage(`Successfully provisioned new ${role} account for ${name}!`);
      setName('');
      setEmail('');
      setPhone('');
      setLocation('');
      setLatitude(null);
      setLongitude(null);
      setParentId('');
      setTimeout(() => setMessage(''), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create user account.');
    } finally {
      setLoading(false);
    }
  };

  const filteredParents = getFilteredParents();

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto text-slate-800 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <UserPlus className="w-8 h-8 text-amber-600" /> Provision Downline User & Geolocation
        </h1>
        <p className="text-sm text-slate-500 mt-1">Create accounts for network tiers with strict hierarchical uplink mapping.</p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Partner Name"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="partner@xellent.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Temporary Password</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assign Role Tier</label>
              <select
                value={role}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="super_stockist">Super Stockist</option>
                <option value="distributor">Distributor</option>
                <option value="shop">Retail Shop</option>
                <option value="employee">Field Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Parent Account Mapping with Dynamic Filtering */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Assign Parent Uplink {role === 'admin' ? '(Not Required)' : `(Required for ${role.replace('_', ' ')})`}
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                required={role !== 'admin'}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium"
              >
                <option value="">-- Select Authorized Parent Uplink --</option>
                {filteredParents.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.role.replace('_', ' ').toUpperCase()})</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                {role === 'super_stockist' && 'Super Stockists must report directly to Admin accounts.'}
                {role === 'distributor' && 'Distributors must report directly to Super Stockist accounts.'}
                {(role === 'shop' || role === 'employee') && 'Retail Shops and Field Employees report to Super Stockists or Distributors.'}
                {role === 'admin' && 'Admins operate independently at the apex level.'}
              </p>
            </div>
          </div>

          {/* Conditional Google Maps / GPS Tagging Section: ONLY for Retail Shops */}
          {role === 'shop' && (
            <div className="p-6 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-600" />
                <h4 className="font-bold text-xs uppercase text-amber-900">Retail Shop GPS Geolocation</h4>
              </div>
              
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Click 'Pin GPS' to auto-detect coordinates"
                  className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="px-6 py-3 bg-slate-900 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-md"
                >
                  <MapPin className="w-4 h-4 text-amber-400" /> Pin GPS
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-2xl text-sm transition shadow-lg shadow-amber-600/20 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Provisioning Account...' : 'Create User Account & Save'}
          </button>
        </form>
      </div>
    </div>
  );
}