'use client';
import React, { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { ShoppingCart, Plus, FileText, X } from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [downlineUsers, setDownlineUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedBuyerId, setSelectedBuyerId] = useState('');
  const [orderItems, setOrderItems] = useState<{ productId: number; quantity: number; unitPrice: number }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Invoice Modal State
  const [invoiceOrder, setInvoiceOrder] = useState<any | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setCurrentUser(u);
      fetchOrders(u.id, u.role);
      fetchDownlineUsers(u.id, u.role);
    }
    fetchProducts();
  }, []);

  const fetchOrders = async (userId: string, role: string) => {
    try {
      setLoading(true);
      const res = await API.get(`/api/orders?userId=${userId}&role=${role}`);
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDownlineUsers = async (userId: string, role: string) => {
    try {
      const res = await API.get(`/api/admin/downline-users?userId=${userId}&role=${role}`);
      setDownlineUsers(res.data.users || []);
    } catch (err) {
      console.error('Failed to fetch downline users', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await API.get('/api/products/public');
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  };

  const handleAddItem = () => {
    if (!selectedProductId || quantity <= 0) return;
    const prod = products.find((p) => p.id === Number(selectedProductId));
    if (!prod) return;

    setOrderItems((prev) => [
      ...prev,
      { productId: prod.id, quantity: Number(quantity), unitPrice: Number(prod.mrp) }
    ]);
    setSelectedProductId('');
    setQuantity(1);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuyerId || orderItems.length === 0) {
      alert('Please select a downstream user and add at least one product.');
      return;
    }

    const totalAmount = orderItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

    try {
      await API.post('/api/orders/smart', {
        buyerId: selectedBuyerId,
        items: orderItems,
        totalAmount,
        proxyForId: currentUser.id
      });
      setIsCreateModalOpen(false);
      setOrderItems([]);
      setSelectedBuyerId('');
      fetchOrders(currentUser.id, currentUser.role);
      alert('Order successfully created for downstream user!');
    } catch (err) {
      console.error('Create Order Error', err);
      alert('Failed to create order.');
    }
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      await API.put(`/api/orders/${orderId}/status`, { status });
      fetchOrders(currentUser.id, currentUser.role);
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Orders & Downstream Feed</h1>
          <p className="text-xs text-slate-400 mt-1">Portal Role: <span className="text-amber-400 font-bold uppercase">{currentUser?.role}</span>. Manage orders and create direct downstream rate sheets.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Order for Downstream
        </button>
      </div>

      {/* Orders Table Feed */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-xs font-bold animate-pulse">Loading orders feed...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24 space-y-3">
            <ShoppingCart className="w-12 h-12 text-slate-700 mx-auto" />
            <p className="text-slate-400 text-xs font-bold">No orders found for your account scope.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-slate-800">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Buyer (Downstream)</th>
                  <th className="p-4">Seller / Upline</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions / Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 font-medium">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-900/50 transition">
                    <td className="p-4 font-mono font-bold text-amber-400">#XFP-{o.id}</td>
                    <td className="p-4 font-bold text-white">{o.buyer_name} <span className="text-[10px] text-slate-400 block">({o.buyer_role})</span></td>
                    <td className="p-4 text-slate-300">{o.seller_name || 'Direct Admin'}</td>
                    <td className="p-4 font-black text-white">₹{o.total_amount}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        o.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {o.status || 'Pending'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setInvoiceOrder(o)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-extrabold rounded-lg inline-flex items-center gap-1 transition cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" /> Invoice
                      </button>
                      <select
                        value={o.status || 'Pending'}
                        onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-300 text-[11px] rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-base font-black text-white">Create Order for Downstream User</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Downline Partner</label>
                <select
                  value={selectedBuyerId}
                  onChange={(e) => setSelectedBuyerId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Choose Downstream User --</option>
                  {downlineUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role.toUpperCase()}) - {u.location || 'N/A'}</option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">Add Products to Order</span>
                <div className="flex gap-2">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Select Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} (MRP: ₹{p.mrp})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-20 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white text-center focus:outline-none focus:border-amber-500"
                  />
                  <button type="button" onClick={handleAddItem} className="px-4 py-2 bg-amber-500 text-slate-950 font-black rounded-xl text-xs hover:bg-amber-600 transition">Add</button>
                </div>

                {orderItems.length > 0 && (
                  <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto">
                    {orderItems.map((item, idx) => {
                      const prod = products.find((p) => p.id === item.productId);
                      return (
                        <div key={idx} className="flex justify-between items-center text-xs bg-slate-900 p-2 rounded-xl border border-slate-800">
                          <span className="text-white font-bold">{prod?.name || 'Product'}</span>
                          <span className="text-slate-400">Qty: {item.quantity} × ₹{item.unitPrice}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-amber-500 text-slate-950 font-black rounded-xl text-xs hover:bg-amber-600 shadow-lg shadow-amber-500/20">Submit Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal / Bill Generator */}
      {invoiceOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl w-full max-w-xl p-8 space-y-6 shadow-2xl relative">
            <button onClick={() => setInvoiceOrder(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-black text-amber-600">XLLENT FOODS</h2>
                <p className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">Distribution Tax Invoice</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs font-bold">Invoice #XFP-INV-{invoiceOrder.id}</p>
                <p className="text-[11px] text-slate-500">{new Date(invoiceOrder.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 block font-bold uppercase text-[10px]">Billed To (Downstream):</span>
                <p className="font-black text-slate-900 mt-0.5">{invoiceOrder.buyer_name}</p>
                <p className="text-slate-600 text-[11px]">{invoiceOrder.buyer_email} ({invoiceOrder.buyer_role})</p>
              </div>
              <div>
                <span className="text-slate-400 block font-bold uppercase text-[10px]">Fulfilled By (Upline):</span>
                <p className="font-black text-slate-900 mt-0.5">{invoiceOrder.seller_name || 'Xllent Foods Central Hub'}</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-wider">
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-100">
                    <td className="p-3 font-bold">{invoiceOrder.status}</td>
                    <td className="p-3 text-right font-black text-slate-900">₹{invoiceOrder.total_amount}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Thank you for your business partnership!</span>
              <button onClick={() => window.print()} className="px-5 py-2.5 bg-amber-600 text-white font-black rounded-xl text-xs shadow hover:bg-amber-700 transition">Print Invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}