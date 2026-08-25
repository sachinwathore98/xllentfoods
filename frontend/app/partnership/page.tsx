'use client';
import { useState } from 'react';
import API from '@/app/lib/api';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { TrendingUp, ShieldCheck, Users, ArrowRight, CheckCircle2, Send, Loader2 } from 'lucide-react';

export default function PartnershipPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    roleType: 'Super Stockist',
    location: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await API.post('/partnership/enquiry', formData);
      setSuccessMsg(res.data.message || 'Enquiry submitted successfully!');
      setFormData({ fullName: '', email: '', phone: '', roleType: 'Super Stockist', location: '', message: '' });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit enquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow">
        <div className="bg-slate-900 text-white py-24 px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <span className="bg-amber-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block">
              Lucrative B2B Opportunity
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">
              Scale Your Distribution Business
            </h1>
            <p className="text-slate-300 text-sm sm:text-base font-light">
              Partner with Xllent Foods as a Super Stockist or Distributor and dominate your regional market with massive profit margins.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:border-amber-400 transition duration-300">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl w-fit mb-6"><TrendingUp className="w-8 h-8" /></div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">High Profit Margins</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Enjoy industry-leading margins designed specifically to ensure rapid ROI and substantial earnings for both Super Stockists and Distributors.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Tiered wholesale pricing</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Volume incentive bonuses</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:border-amber-400 transition duration-300">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-6"><ShieldCheck className="w-8 h-8" /></div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">Exclusive Territory Rights</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Secure protected operating zones for Super Stockists, ensuring zero internal channel conflict and complete regional market capture.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Protected regional distribution</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Direct brand marketing backing</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:border-amber-400 transition duration-300">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-6"><Users className="w-8 h-8" /></div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">Complete Downline Control</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Easily provision and manage your retail shops and subordinate distributors using our advanced digital management portal.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Instant digital credential generation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Real-time order tracking</li>
              </ul>
            </div>
          </div>

          {/* Partnership Enquiry Form Section */}
          <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xl">
            <div className="text-center mb-10">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Application Form
              </span>
              <h2 className="text-3xl font-black text-slate-900 mt-3 tracking-tight">Become a Partner Today</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">
                Fill out the application below. Our management team will review your location and credentials promptly.
              </p>
            </div>

            {successMsg && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl text-center">
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-2xl text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="partner@example.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 99999 99999"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Partnership Tier</label>
                  <select
                    value={formData.roleType}
                    onChange={(e) => setFormData({ ...formData, roleType: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-600"
                  >
                    <option value="Super Stockist">Super Stockist</option>
                    <option value="Distributor">Distributor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Target Operating Location (City / State)</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Chhatrapati Sambhajinagar, Maharashtra"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Additional Details / Warehouse Capacity (Optional)</label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your current distribution network or experience..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl shadow-xl transition text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Partnership Enquiry</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}