'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { UserPlus, MapPin, CheckCircle2, Shield, Edit3, Trash2, Mail, Phone, X, Users } from 'lucide-react';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  location?: string;
}

export default function CreateAndManageUsersPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
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
  const [downlineUsers, setDownlineUsers] = useState<UserProfile[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Edit Modal States
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editPassword, setEditPassword] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setCurrentUser(u);
      fetchDownlineUsers(u.id, u.role);
    }
    fetchPotentialParents();
  }, []);

  const fetchDownlineUsers = async (userId: number, role: string) => {
    try {
      const res = await API.get(`/api/admin/downline-users?userId=${userId}&role=${role}`);
      setDownlineUsers(res.data.users || []);
    } catch (err) {
      console.error('Failed to fetch downline users', err);
    }
  };

  const fetchPotentialParents = async () => {
    try {
      const res = await API.get('/api/admin/users-list');
      setParentsList(res.data.users || []);
    } catch (err) {
      console.error('Failed to load parent hierarchy', err);
    }
  };

  const getFilteredParents = () => {
    if (role === 'admin') {
      return parentsList.filter(p => p.role === 'superadmin');
    }
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
    setParentId('');
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

      setMessage(`Successfully provisioned new ${role.replace('_', ' ')} account for ${name}!`);
      setName('');
      setEmail('');
      setPhone('');
      setLocation('');
      setLatitude(null);
      setLongitude(null);
      setParentId('');
      
      if (currentUser) {
        fetchDownlineUsers(currentUser.id, currentUser.role);
      }
      fetchPotentialParents();
      setTimeout(() => setMessage(''), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create user account.');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone || '');
    setEditLocation(user.location || '');
    setEditPassword('');
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await API.put(`/api/admin/users/${editingUser.id}`, {
        name: editName,
        email: editEmail,
        phone: editPhone,
        location: editLocation,
        password: editPassword
      });
      setMessage('User profile updated successfully!');
      setEditingUser(null);
      if (currentUser) {
        fetchDownlineUsers(currentUser.id, currentUser.role);
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user.');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user account?')) return;
    try {
      await API.delete(`/api/admin/users/${userId}`);
      setMessage('User account deleted successfully.');
      if (currentUser) {
        fetchDownlineUsers(currentUser.id, currentUser.role);
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const filteredParents = getFilteredParents();

  return (
    <div className="p-6 md:p-8 space-y-10 max-w-7xl mx-auto text-slate-800 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <UserPlus className="w-8 h-8 text-amber-600" /> Provision & Manage Network Users
        </h1>
        <p className="text-sm text-slate-500 mt-1">Create accounts for network tiers and manage your active downstream partners below.</p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Provision Form */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-black text-slate-900 mb-6 pb-3 border-b border-slate-100 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-amber-600" /> Provision New Account
        </h3>
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
                <option value="admin">Admin</option>
                <option value="super_stockist">Super Stockist</option>
                <option value="distributor">Distributor</option>
                <option value="shop">Retail Shop</option>
                <option value="employee">Field Employee</option>
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

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Assign Parent Uplink (Required for {role.replace('_', ' ')})
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium"
              >
                <option value="">-- Select Authorized Parent Uplink --</option>
                {filteredParents.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.role.replace('_', ' ').toUpperCase()})</option>
                ))}
              </select>
            </div>
          </div>

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

      {/* Downstream Users List Section */}
      <div className="space-y-4 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-600" /> Your Downstream Network Accounts ({downlineUsers.length})
          </h3>
        </div>

        {downlineUsers.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs shadow-sm">
            No downstream partner accounts found connected to your account.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {downlineUsers.map(u => (
              <div key={u.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg uppercase">
                      {u.role.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900">{u.name}</h3>
                  
                  <div className="space-y-1 pt-2 text-xs text-slate-500">
                    <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" /> {u.email}</p>
                    {u.phone && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" /> {u.phone}</p>}
                    {u.location && <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {u.location}</p>}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => openEditModal(u)}
                    className="w-1/2 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="w-1/2 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl max-w-lg w-full space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="font-bold text-lg text-slate-900">Edit Partner: {editingUser.name}</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Location / Address</label>
                <input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-700 uppercase mb-1">New Password (Leave blank to keep current)</label>
                <input type="text" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Enter new password if changing" className="w-full px-4 py-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs outline-none font-bold" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingUser(null)} className="w-1/2 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition cursor-pointer">Cancel</button>
                <button type="submit" className="w-1/2 py-3 bg-amber-600 text-white font-bold rounded-xl text-xs hover:bg-amber-700 transition cursor-pointer shadow-lg shadow-amber-600/20">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}