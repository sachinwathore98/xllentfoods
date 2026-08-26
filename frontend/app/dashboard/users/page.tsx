'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { Users, Edit3, Key, Shield, MapPin, Phone, Mail, X, CheckCircle2 } from 'lucide-react';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  location?: string;
}

export default function DownlineUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  
  // Edit Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      fetchDownlineUsers(user.id, user.role);
    }
  }, []);

  const fetchDownlineUsers = async (userId: number, role: string) => {
    try {
      setLoading(true);
      const res = await API.get(`/api/admin/downline-users?userId=${userId}&role=${role}`);
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Failed to fetch downline users', err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone || '');
    setLocation(user.location || '');
    setNewPassword('');
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await API.put(`/api/admin/users/${editingUser.id}`, {
        name,
        email,
        phone,
        location,
        password: newPassword
      });
      setMessage('User profile updated successfully!');
      setEditingUser(null);
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        fetchDownlineUsers(u.id, u.role);
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user.');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto text-slate-800 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Users className="w-8 h-8 text-amber-600" /> Downline Network Partners
        </h1>
        <p className="text-sm text-slate-500 mt-1">View, edit, and manage passwords for partner accounts under your network hierarchy.</p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Users Grid */}
      {loading ? (
        <p className="text-xs text-slate-400 text-center py-12">Loading downline network...</p>
      ) : users.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
          No downline partners found connected to your account.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map(u => (
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

              <button
                onClick={() => openEditModal(u)}
                className="w-full py-2.5 bg-slate-900 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Profile & Password
              </button>
            </div>
          ))}
        </div>
      )}

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
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Location / Address</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-700 uppercase mb-1">New Password (Leave blank to keep current)</label>
                <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password if changing" className="w-full px-4 py-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs outline-none font-bold" />
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