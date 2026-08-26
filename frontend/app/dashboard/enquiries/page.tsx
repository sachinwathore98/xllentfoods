'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { UserCheck, Mail, Phone, MapPin, CheckCircle2, Clock } from 'lucide-react';

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
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto text-slate-800 min-h-screen bg-slate-50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-8 h-8 text-amber-600" />
            Partnership Enquiry Review Panel
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review incoming distributor and franchise applications from the public website and provision active supply chain accounts.
          </p>
        </div>
      </div>

      {notification && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {loading ? (
        <p className="text-slate-400 text-center py-12 text-sm font-medium">Loading applications...</p>
      ) : enquiries.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">No pending partnership enquiries at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enquiries.map((enq) => (
            <div key={enq.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-amber-500 transition">
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 opacity-80" />

              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full font-bold">
                    {enq.role_type}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(enq.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-3">{enq.full_name}</h3>

                <div className="space-y-2 text-xs text-slate-600 mb-6">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{enq.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{enq.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{enq.location}</span>
                  </div>
                  {enq.message && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-500 italic">
                      "{enq.message}"
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedEnquiry(enq)}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-md cursor-pointer"
              >
                Approve & Convert to Account
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Approval Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <h3 className="text-lg font-black text-slate-900">Approve Application</h3>
            <p className="text-xs text-slate-500">
              Converting <span className="text-slate-900 font-bold">{selectedEnquiry.full_name}</span> ({selectedEnquiry.email}) into an active network user account.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assign Network Role</label>
                <select
                  value={assignedRole}
                  onChange={(e) => setAssignedRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="super_stockist">Super Stockist</option>
                  <option value="distributor">Distributor</option>
                  <option value="shop">Retail Shop</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Set Initial Password</label>
                <input
                  type="text"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Admin@123"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApproveAndConvert(selectedEnquiry)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-md"
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