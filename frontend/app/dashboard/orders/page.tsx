'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { ShoppingCart, CheckCircle, XCircle, FileText, Truck, Edit3, User, Building, ArrowRight, Printer, X } from 'lucide-react';

export default function SmartOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setCurrentUser(u);
      fetchOrders(u.id, u.role);
    }
  }, []);

  const fetchOrders = async (userId: number, role: string) => {
    try {
      setLoading(true);
      const res = await API.get(`/api/orders?userId=${userId}&role=${role}`);
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error('Error fetching orders', err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      await API.put(`/api/orders/${orderId}/status`, { status });
      setSuccessMsg(`Order #${orderId} marked as ${status}`);
      setTimeout(() => setSuccessMsg(''), 3000);
      if (currentUser) fetchOrders(currentUser.id, currentUser.role);
    } catch (err) {
      setErrorMsg('Failed to update order status');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
            Smart Supply Chain & Fulfillment
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Orders & Downstream Feed</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Portal Role: <b className="text-slate-900 uppercase">{currentUser?.role || 'USER'}</b>. Fulfill downline orders or track upstream requests.
          </p>
        </div>
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
        <div className="text-center py-20 text-slate-400 text-xs font-semibold animate-pulse">Loading network orders feed...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">No orders found for your account scope.</p>
          <p className="text-xs text-slate-400 mt-1">Orders placed by your downline or network vendors will appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((ord) => (
            <div key={ord.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              
              {/* Order Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black bg-slate-900 text-white px-3 py-1 rounded-xl">
                    Order #{ord.id}
                  </span>
                  <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase ${
                    ord.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                    ord.status === 'Dispatched' ? 'bg-blue-100 text-blue-800' :
                    ord.status === 'Denied' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {ord.status || 'Pending'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(ord.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    <span><b>Buyer:</b> {ord.buyer_name} ({ord.buyer_role?.toUpperCase()})</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                    <Building className="w-3.5 h-3.5 text-blue-600" />
                    <span><b>Assigned Seller:</b> {ord.seller_name || 'Direct Admin Fulfillment'}</span>
                  </div>
                </div>
              </div>

              {/* Total & Action Buttons */}
              <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 w-full lg:w-auto border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0">
                <div className="text-left lg:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Amount</span>
                  <span className="text-lg font-black text-slate-900">₹{ord.total_amount}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateOrderStatus(ord.id, 'Approved')}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1 shadow-sm"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => updateOrderStatus(ord.id, 'Dispatched')}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1 shadow-sm"
                  >
                    <Truck className="w-3.5 h-3.5" /> Dispatch
                  </button>
                  <button
                    onClick={() => updateOrderStatus(ord.id, 'Denied')}
                    className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1 shadow-sm"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Deny
                  </button>
                  <button
                    onClick={() => setSelectedOrderForInvoice(ord)}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1 shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5" /> Invoice
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Invoice Modal */}
      {selectedOrderForInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-slate-200 relative">
            <button 
              onClick={() => setSelectedOrderForInvoice(null)} 
              className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center border-b border-slate-100 pb-6 mb-6">
              <h2 className="text-2xl font-black text-slate-900">XLLENT FOODS</h2>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Official B2B Supply Chain Tax Invoice</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-50 p-4 rounded-2xl">
              <div>
                <p className="text-slate-400 font-bold uppercase">Invoice Details:</p>
                <p className="font-bold text-slate-900 mt-1">Invoice #INV-2026-{selectedOrderForInvoice.id}</p>
                <p className="text-slate-600">Date: {new Date(selectedOrderForInvoice.created_at).toLocaleDateString()}</p>
                <p className="text-slate-600">Status: <b className="text-amber-600">{selectedOrderForInvoice.status}</b></p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">Buyer Information:</p>
                <p className="font-bold text-slate-900 mt-1">{selectedOrderForInvoice.buyer_name}</p>
                <p className="text-slate-600">Email: {selectedOrderForInvoice.buyer_email}</p>
                <p className="text-slate-600">Role: {selectedOrderForInvoice.buyer_role?.toUpperCase()}</p>
              </div>
            </div>

            <div className="border-t border-b border-slate-200 py-4 mb-6 flex justify-between items-center text-sm font-black">
              <span>Total Payable Amount:</span>
              <span className="text-amber-600 text-lg">₹{selectedOrderForInvoice.total_amount}</span>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print / Download PDF Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}