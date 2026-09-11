'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { Megaphone, Plus, Trash2, Image as ImageIcon, ExternalLink, CheckCircle2 } from 'lucide-react';

export default function AdminAdsPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
      await API.post('/api/admin/advertisements', { title, imageUrl, targetUrl });
      setMessage('Advertisement banner added successfully!');
      setTitle('');
      setImageUrl('');
      setTargetUrl('');
      fetchAds();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add ad banner');
    } finally {
      setLoading(false);
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
        <p className="text-sm text-slate-500 mt-1">Add promotional banners that will automatically display across product grids after every 10 rows.</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <div className="p-4 space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">{ad.title}</h4>
                    {ad.target_url && (
                      <p className="text-xs text-amber-600 truncate flex items-center gap-1 font-mono">
                        <ExternalLink className="w-3 h-3" /> {ad.target_url}
                      </p>
                    )}
                  </div>
                </div>
                <div className="p-4 pt-0">
                  <button
                    onClick={() => handleDeleteAd(ad.id)}
                    className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Banner
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}