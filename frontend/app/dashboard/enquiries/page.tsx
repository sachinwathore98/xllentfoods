'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { Users, CheckCircle, XCircle, Edit3, Trash2, UserPlus, Phone, Mail, MapPin, Building, ShieldCheck } from 'lucide-react';

export default function PartnershipEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEnquiry, setEditingEnquiry] = useState<any>(null);
  const [provisioningEnquiry, setProvisioningEnquiry] = useState<any>(null);
  const [password, setPassword] = useState('Admin@123');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const res = await API.get('/api/admin/enquiries');
      setEnquiries(res.data.enquiries || []);
    } catch (err) {
      console.error('Error fetching enquiries', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const target = enquiries.find(e => e.id === id);
      await API.put(`/api/admin/enquiries/${id}`, { ...target, status: newStatus });
      setSuccessMsg(`Enquiry marked as ${newStatus}`);
      fetchEnquiries();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('Failed to update enquiry status');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this enquiry?')) return;
    try {
      await API.delete(`/api/admin/enquiries/${id}`);
      setSuccessMsg('Enquiry deleted successfully');
      fetchEnquiries();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('Failed to delete enquiry');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await API.put(`/api/admin/enquiries/${editingEnquiry.id}`, editingEnquiry);
      setEditingEnquiry(null);
      setSuccessMsg('Enquiry updated successfully');
      fetchEnquiries();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('Failed to update enquiry');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const handleProvisionAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Map role type string to database role
      let dbRole = 'shop';
      const roleLower = provisioningEnquiry.role_type.toLowerCase();
      if (roleLower.includes('super stockist')) dbRole = 'super_stockist';
      else if (roleLower.includes('distributor')) dbRole = 'distributor';
      else if (roleLower.includes('retailer') || roleLower.includes('shop')) dbRole = 'shop';

      await API.post('/api/admin/users/create', {
        name: provisioningEnquiry.full_name,
        email: provisioningEnquiry.email,
        password: password,
        role: dbRole,
        phone: provisioningEnquiry.phone,
        location: provisioningEnquiry.location
      });

      // Update enquiry status to Approved
      await API.put(`/api/admin/enquiries/${provisioningEnquiry.id}`, { ...provisioningEnquiry, status: 'Approved' });

      setProvisioningEnquiry(null);
      setSuccessMsg(`Account successfully created for ${provisioningEnquiry.full_name} (${dbRole})!`);
      fetchEnquiries();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to provision account');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
          Super Admin Control
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Partnership Enquiry Review Panel</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review incoming distributor and franchise applications, approve/deny status, and provision active supply chain accounts.
        </p>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold shadow-sm">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold shadow-sm">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-400 text-xs font-semibold animate-pulse">Loading live partnership enquiries...</div>
      ) : enquiries.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">No partnership enquiries at the moment.</p>
          <p className="text-xs text-slate-400 mt-1">Applications submitted from the public partnership page will appear here instantly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {enquiries.map((enq) => (
            <div key={enq.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg">
                      {enq.role_type}
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-2">{enq.full_name}</h3>
                  </div>
                  <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase ${
                    enq.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                    enq.status === 'Denied' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {enq.status || 'Pending'}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a href={`mailto:${enq.email}`} className="hover:text-amber-600 font-medium">{enq.email}</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a href={`tel:${enq.phone}`} className="hover:text-amber-600 font-medium">{enq.phone}</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium">{enq.location}</span>
                  </div>
                </div>

                {enq.message && (
                  <div className="mt-4 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs text-slate-600 font-light">
                    <p className="font-bold text-[10px] text-slate-400 uppercase mb-1">Message:</p>
                    <p>{enq.message}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateStatus(enq.id, 'Approved')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] transition flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => updateStatus(enq.id, 'Denied')}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-[11px] transition flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Deny
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setProvisioningEnquiry(enq)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-[11px] transition flex items-center gap-1 shadow-sm"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Create Account
                  </button>
                  <button
                    onClick={() => setEditingEnquiry(enq)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(enq.id)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingEnquiry && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-4">Edit Partnership Enquiry</h3>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingEnquiry.full_name}
                  onChange={(e) => setEditingEnquiry({ ...editingEnquiry, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Email</label>
                  <input
                    type="email"
                    value={editingEnquiry.email}
                    onChange={(e) => setEditingEnquiry({ ...editingEnquiry, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingEnquiry.phone}
                    onChange={(e) => setEditingEnquiry({ ...editingEnquiry, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Role Type</label>
                  <input
                    type="text"
                    value={editingEnquiry.role_type}
                    onChange={(e) => setEditingEnquiry({ ...editingEnquiry, role_type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Location</label>
                  <input
                    type="text"
                    value={editingEnquiry.location}
                    onChange={(e) => setEditingEnquiry({ ...editingEnquiry, location: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Message</label>
                <textarea
                  value={editingEnquiry.message || ''}
                  onChange={(e) => setEditingEnquiry({ ...editingEnquiry, message: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 h-24"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEnquiry(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provision Account Modal */}
      {provisioningEnquiry && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-2">Provision Partner Account</h3>
            <p className="text-xs text-slate-500 mb-4">
              Create an official login account for <b className="text-slate-900">{provisioningEnquiry.full_name}</b> as a <b className="text-amber-600">{provisioningEnquiry.role_type}</b>.
            </p>
            <form onSubmit={handleProvisionAccount} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Email (Login ID)</label>
                <input
                  type="email"
                  value={provisioningEnquiry.email}
                  disabled
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Assign Initial Password</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProvisioningEnquiry(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" /> Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}