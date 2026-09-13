'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { Megaphone, Plus, Trash2, ExternalLink, CheckCircle2, Edit3, X } from 'lucide-react';

export default function AdminAdsPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [bannerType, setBannerType] = useState('horizontal');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Edit Modal States
  const [editingAd, setEditingAd] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editTargetUrl, setEditTargetUrl] = useState('');
  const [editBannerType, setEditBannerType] = useState('horizontal');

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const res = await API.get('/api/admin/advertisements');
      setAds(res.data.advertisements || []);
    } catch (err) {
      console.error('Failed to fetch advertisements', err);
    }
  };

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await API.post('/api/admin/advertisements', { title, imageUrl, targetUrl, bannerType });
      setMessage('Advertisement banner added successfully!');
      setTitle('');
      setImageUrl('');
      setTargetUrl('');
      setBannerType('horizontal');
      fetchAds();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add ad banner');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (ad: any) => {
    setEditingAd(ad);
    setEditTitle(ad.title || '');
    setEditImageUrl(ad.image_url || '');
    setEditTargetUrl(ad.target_url || '');
    setEditBannerType(ad.banner_type || 'horizontal');
  };

  const handleUpdateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAd) return;

    try {
      await API.put(`/api/admin/advertisements/${editingAd.id}`, {
        title: editTitle,
        imageUrl: editImageUrl,
        targetUrl: editTargetUrl,
        bannerType: editBannerType
      });
      setMessage('Advertisement banner updated successfully!');
      setEditingAd(null);
      fetchAds();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update ad banner');
    }
  };

  const handleDeleteAd = async (id: number) => {
    if (!confirm('Are you sure you want to delete this ad banner?')) return;
    try {
      await API.delete(`/api/admin/advertisements/${id}`);
      setMessage('Ad banner deleted successfully.');
      fetchAds();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert('Failed to delete ad banner');
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 text-slate-800 bg-slate-50 min-h-screen">
      <div>
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-100">
          Super Admin & Admin Control
        </span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-2">
          <Megaphone className="w-8 h-8 text-amber-600" /> Advertisement Banners Management
        </h1>
        <p className="text-sm text-slate-500 mt-1">Upload, manage, and edit horizontal or vertical promotional banners separately.</p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Add Ad Form */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-black text-slate-900 mb-6 pb-3 border-b border-slate-100 flex items-center gap-2">
          <Plus className="w-5 h-5 text-amber-600" /> Add New Ad Banner
        </h3>
        <form onSubmit={handleCreateAd} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Banner Title / Campaign Name</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Diwali Special Offer"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Banner Orientation Type</label>
              <select
                value={bannerType}
                onChange={(e) => setBannerType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="horizontal">Horizontal Banner (Catalog Full-Width)</option>
                <option value="vertical">Vertical Banner (Sidebar / Grid Spotlight)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Banner Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                required
                placeholder="https://images.unsplash.com/..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Link URL (Optional)</label>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="/products or https://..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-2xl text-sm transition shadow-lg shadow-amber-600/20 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Publishing Banner...' : 'Publish Advertisement Banner'}
          </button>
        </form>
      </div>

      {/* Active Ads List */}
      <div className="space-y-4">
        <h3 className="text-xl font-black text-slate-900">Active Banners ({ads.length})</h3>
        {ads.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-sm shadow-sm">
            No advertisement banners added yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad) => (
              <div key={ad.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
                <div>
                  <div className="h-40 bg-slate-100 relative overflow-hidden">
                    <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded uppercase ${ad.banner_type === 'vertical' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {ad.banner_type || 'horizontal'}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{ad.title}</h4>
                    {ad.target_url && (
                      <p className="text-xs text-amber-600 truncate flex items-center gap-1 font-mono">
                        <ExternalLink className="w-3 h-3" /> {ad.target_url}
                      </p>
                    )}
                  </div>
                </div>
                <div className="p-4 pt-0 flex gap-2">
                  <button
                    onClick={() => openEditModal(ad)}
                    className="w-1/2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteAd(ad.id)}
                    className="w-1/2 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Banner Modal */}
      {editingAd && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl max-w-lg w-full space-y-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="font-bold text-lg text-slate-900">Edit Banner: {editingAd.title}</h3>
              <button onClick={() => setEditingAd(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleUpdateAd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Banner Title / Campaign Name</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Banner Orientation Type</label>
                <select value={editBannerType} onChange={(e) => setEditBannerType(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-slate-900 outline-none bg-white">
                  <option value="horizontal">Horizontal Banner (Catalog Full-Width)</option>
                  <option value="vertical">Vertical Banner (Sidebar / Grid Spotlight)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Banner Image URL</label>
                <input type="url" value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Link URL (Optional)</label>
                <input type="text" value={editTargetUrl} onChange={(e) => setEditTargetUrl(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingAd(null)} className="w-1/2 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition cursor-pointer">Cancel</button>
                <button type="submit" className="w-1/2 py-3 bg-amber-600 text-white font-bold rounded-xl text-xs hover:bg-amber-700 transition cursor-pointer shadow-lg shadow-amber-600/20">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}