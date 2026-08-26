'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { UserCheck, Mail, Phone, MapPin, Building, CheckCircle2, Clock, Trash2 } from 'lucide-react';

interface Enquiry {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role_type: string;
  location: string;
  message: string;
  created_at: string;
}

export default function PartnershipEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [assignedRole, setAssignedRole] = useState('distributor');
  const [tempPassword, setTempPassword] = useState('Admin@123');
  const [notification, setNotification] = useState('');

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const res = await API.get('/api/admin/enquiries');
      setEnquiries(res.data.enquiries || []);
    } catch (err) {
      console.error('Error fetching partnership enquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAndConvert = async (enquiry: Enquiry) => {
    try {
      await API.post(`/api/admin/enquiries/${enquiry.id}/approve`, {
        assignedRole,
        temporaryPassword: tempPassword,
      });
      setNotification(`Successfully converted ${enquiry.full_name} into an active ${assignedRole} account!`);
      setSelectedEnquiry(null);
      fetchEnquiries();
      setTimeout(() => setNotification(''), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve enquiry');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto text-slate-100 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-amber-500" />
            Partnership Enquiry Review Panel
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review incoming distributor/franchise applications and provision active network accounts.
          </p>
        </div>
      </div>

      {notification && (
        <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {loading ? (
        <p className="text-slate-400 text-center py-12 text-sm">Loading applications...</p>
      ) : enquiries.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">No pending partnership enquiries at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enquiries.map((enq) => (
            <div key={enq.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-80" />

              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full font-semibold">
                    {enq.role_type}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(enq.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-3">{enq.full_name}</h3>

                <div className="space-y-2 text-xs text-slate-300 mb-6">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="truncate">{enq.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{enq.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{enq.location}</span>
                  </div>
                  {enq.message && (
                    <div className="mt-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-slate-400 italic">
                      "{enq.message}"
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedEnquiry(enq)}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition shadow-lg shadow-amber-600/20 cursor-pointer"
              >
                Approve & Convert to Account
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Approval Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <h3 className="text-lg font-bold text-white">Approve Application</h3>
            <p className="text-xs text-slate-400">
              Converting <span className="text-white font-semibold">{selectedEnquiry.full_name}</span> ({selectedEnquiry.email}) into an active platform user.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Assign Network Role</label>
                <select
                  value={assignedRole}
                  onChange={(e) => setAssignedRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                >
                  <option value="super_stockist">Super Stockist</option>
                  <option value="distributor">Distributor</option>
                  <option value="shop">Retail Shop</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Set Initial Password</label>
                <input
                  type="text"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                  placeholder="Admin@123"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApproveAndConvert(selectedEnquiry)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                Confirm & Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}