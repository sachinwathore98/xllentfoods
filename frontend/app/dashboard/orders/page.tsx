'use client';
import React, { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { ShoppingCart, Plus, FileText, X, Trash2, Download, Package } from 'lucide-react';
import jsPDF from 'jspdf';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [downlineUsers, setDownlineUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [partnerPricing, setPartnerPricing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedBuyerId, setSelectedBuyerId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [orderItems, setOrderItems] = useState<{ productId: number; name: string; sku?: string; category: string; quantity: number; unitPrice: number; gstPercent: number }[]>([]);
  
  // Invoice State
  const [invoiceOrder, setInvoiceOrder] = useState<any | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setCurrentUser(u);
      fetchOrders(u.id, u.role);
      fetchDownlineUsers(u.id, u.role);
    }
    fetchProducts();
    fetchCategories();
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

  const fetchCategories = async () => {
    try {
      const res = await API.get('/api/categories');
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const handlePartnerSelect = async (buyerId: string) => {
    setSelectedBuyerId(buyerId);
    if (!buyerId) {
      setPartnerPricing([]);
      return;
    }
    try {
      const res = await API.get(`/api/downline-pricing/${buyerId}`);
      setPartnerPricing(res.data.pricing || []);
    } catch (err) {
      console.error('Failed to fetch partner pricing', err);
    }
  };

  const getProductEffectivePrice = (productId: number) => {
    const pricingMatch = partnerPricing.find((p) => p.product_id === productId);
    if (pricingMatch) {
      return Number(pricingMatch.effective_price || pricingMatch.mrp || 0);
    }
    const prod = products.find((p) => p.id === productId);
    return prod ? Number(prod.mrp) : 0;
  };

  const handleQuantityChange = (product: any, qty: number) => {
    const quantity = Math.max(0, qty);
    const unitPrice = getProductEffectivePrice(product.id);

    setOrderItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (quantity === 0) {
        return prev.filter((item) => item.productId !== product.id);
      }
      if (existing) {
        return prev.map((item) => item.productId === product.id ? { ...item, quantity, unitPrice } : item);
      } else {
        return [...prev, { 
          productId: product.id, 
          name: product.name, 
          sku: product.sku || 'N/A',
          category: product.category, 
          quantity, 
          unitPrice, 
          gstPercent: Number(product.gst_percent || 0) 
        }];
      }
    });
  };

  const handleRemoveItem = (productId: number) => {
    setOrderItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuyerId || orderItems.length === 0) {
      alert('Please select a downstream stockist partner and add at least one product with quantity.');
      return;
    }

    const subtotal = orderItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const totalGst = orderItems.reduce((acc, item) => acc + ((item.quantity * item.unitPrice * item.gstPercent) / 100), 0);
    const totalAmount = Number((subtotal + totalGst).toFixed(2));

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
      setPartnerPricing([]);
      fetchOrders(currentUser.id, currentUser.role);
      alert('Order successfully created for the selected stockist partner and synced to dashboard!');
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

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    try {
      await API.delete(`/api/orders/${orderId}`);
      fetchOrders(currentUser.id, currentUser.role);
    } catch (err) {
      console.error('Failed to delete order', err);
      alert('Failed to delete order.');
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoiceOrder) return;
    try {
      setIsDownloading(true);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const getBase64Image = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = (error) => reject(error);
          img.src = url;
        });
      };

      let logoBase64 = '';
      try {
        logoBase64 = await getBase64Image('/images/logo.png');
      } catch (e) {
        console.warn('Could not load logo image for PDF:', e);
      }

      // Top Accent Bar
      pdf.setFillColor(217, 119, 6);
      pdf.rect(0, 0, 210, 4, 'F');

      // Header Background
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 4, 210, 36, 'F');

      let textXOffset = 18;
      if (logoBase64) {
        pdf.addImage(logoBase64, 'PNG', 15, 9, 24, 24);
        textXOffset = 44;
      }

      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.text('XLLENT FOODS', textXOffset, 19);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(217, 119, 6);
      pdf.text('DISTRIBUTION MANAGEMENT SYSTEM', textXOffset, 25);

      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Official Tax Invoice & Stockist Billing Statement', textXOffset, 30);

      // Invoice Meta
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`INVOICE #XFP-INV-${invoiceOrder.id}`, 192, 18, { align: 'right' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(210, 215, 225);
      pdf.text(`Date: ${new Date(invoiceOrder.created_at).toLocaleDateString()}`, 192, 25, { align: 'right' });

      // GSTIN Banner
      pdf.setFillColor(254, 243, 199);
      pdf.rect(15, 48, 180, 10, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(180, 83, 9);
      pdf.text('GSTIN: 27AABCX1234F1Z5', 20, 54.5);

      // Selected Vendor & Upline Details Box
      pdf.setDrawColor(226, 232, 240);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(15, 63, 180, 44, 3, 3, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text('BILLED TO (SELECTED STOCKIST / PARTNER)', 20, 71);
      pdf.text('FULFILLED BY (UPLINE HUB)', 110, 71);

      // Selected Stockist Details (e.g. Munja Mandge - Parbhani, Rajtilak - Jalna)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(15, 23, 42);
      pdf.text(invoiceOrder.buyer_name || 'N/A', 20, 79);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text(`Email: ${invoiceOrder.buyer_email || 'N/A'}`, 20, 85);
      pdf.text(`Role: ${(invoiceOrder.buyer_role || 'SUPER_STOCKIST').toUpperCase()}`, 20, 91);
      pdf.text(`Territory / Location: ${invoiceOrder.buyer_location || 'Registered Territory'}`, 20, 97);

      // Seller Details
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(15, 23, 42);
      pdf.text(invoiceOrder.seller_name || 'Xllent Foods Central Hub', 110, 79);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text(`Email: support@xllentfoods.com`, 110, 85);
      pdf.text(`Network Role: ${(invoiceOrder.seller_role || 'Admin').toUpperCase()}`, 110, 91);
      pdf.text(`Support Phone: +91 99999 99999`, 110, 97);

      // Itemized Table Header
      let startY = 114;
      pdf.setFillColor(241, 245, 249);
      pdf.rect(15, startY, 180, 8, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(71, 85, 105);
      pdf.text('PRODUCT NAME & SKU', 20, startY + 5.5);
      pdf.text('QTY', 110, startY + 5.5, { align: 'right' });
      pdf.text('PRICE/PC', 135, startY + 5.5, { align: 'right' });
      pdf.text('GST%', 160, startY + 5.5, { align: 'right' });
      pdf.text('TOTAL', 190, startY + 5.5, { align: 'right' });

      // Itemized Data Rows
      startY += 12;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(15, 23, 42);

      const itemsList = invoiceOrder.items || [{ name: `Standard Order Fulfillment (#XFP-${invoiceOrder.id})`, sku: 'XFP-GEN', quantity: 1, unitPrice: invoiceOrder.total_amount, gstPercent: 5 }];

      itemsList.forEach((item: any, idx: number) => {
        const itemY = startY + (idx * 9);
        const qty = item.quantity || 1;
        const pricePerPc = item.unitPrice || invoiceOrder.total_amount;
        const gst = item.gstPercent || 0;
        const lineTotal = qty * pricePerPc * (1 + gst / 100);

        pdf.text(`${item.name || 'Product'} [SKU: ${item.sku || 'N/A'}]`, 20, itemY);
        pdf.text(String(qty), 110, itemY, { align: 'right' });
        pdf.text(`Rs. ${Number(pricePerPc).toFixed(2)}`, 135, itemY, { align: 'right' });
        pdf.text(`${gst}%`, 160, itemY, { align: 'right' });
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Rs. ${lineTotal.toFixed(2)}`, 190, itemY, { align: 'right' });
        pdf.setFont('helvetica', 'normal');
      });

      startY += (itemsList.length * 9) + 4;
      // Divider Line
      pdf.setDrawColor(226, 232, 240);
      pdf.line(15, startY, 195, startY);

      startY += 10;
      // Grand Total Summary Box
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Grand Total (Incl. GST):', 120, startY);
      pdf.setTextColor(217, 119, 6);
      pdf.text(`Rs. ${invoiceOrder.total_amount}`, 190, startY, { align: 'right' });

      // Terms & Conditions
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Terms & Conditions: Goods once sold will not be taken back. Subject to local jurisdiction.', 15, 245);

      // Footer
      pdf.setFillColor(248, 250, 252);
      pdf.rect(0, 280, 210, 17, 'F');
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text('Thank you for your business partnership with Xllent Foods!', 105, 290, { align: 'center' });

      pdf.save(`Xllent_Foods_Invoice_${invoiceOrder.buyer_name || invoiceOrder.id}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to download PDF invoice.');
    } finally {
      setIsDownloading(false);
    }
  };

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Orders & Downstream Feed</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Portal Role: <span className="text-amber-600 font-extrabold uppercase">{currentUser?.role}</span>. Manage automated fulfillment and stockist tax invoices.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Order for Stockist
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-xs font-bold animate-pulse">Loading orders feed...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24 space-y-3">
            <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-slate-600 text-xs font-bold">No orders found for your account scope.</p>
            <p className="text-slate-400 text-[11px]">Orders placed by your downline stockist network will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Stockist Partner (Billed To)</th>
                  <th className="p-4">Seller / Upline</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions / Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-mono font-bold text-amber-600">#XFP-{o.id}</td>
                    <td className="p-4 font-bold text-slate-900">{o.buyer_name} <span className="text-[10px] text-slate-400 block">({o.buyer_role})</span></td>
                    <td className="p-4 text-slate-600">{o.seller_name || 'Direct Admin'}</td>
                    <td className="p-4 font-black text-slate-900">₹{o.total_amount}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        o.status === 'Completed' || o.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        {o.status || 'Pending'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setInvoiceOrder(o)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl inline-flex items-center gap-1 transition cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-600" /> Invoice
                      </button>
                      <select
                        value={o.status || 'Pending'}
                        onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                        className="bg-white border border-slate-200 text-slate-700 text-[11px] rounded-xl px-2 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer shadow-sm"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Completed">Completed</option>
                        <option value="Approved">Approved</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <button
                        onClick={() => handleDeleteOrder(o.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer inline-flex items-center"
                        title="Delete Order"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl p-6 md:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Create Order for Downline Stockist Partner</h3>
                <p className="text-xs text-slate-500 mt-0.5">Rates automatically apply per stockist pricing structure (Packet/Carton & GST).</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl bg-slate-50"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-6">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-2">Select Stockist Partner Account (e.g. Jalna, Parbhani, Sambhajinagar)</label>
                <select
                  value={selectedBuyerId}
                  onChange={(e) => handlePartnerSelect(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:bg-white transition"
                >
                  <option value="">-- Choose Stockist Partner --</option>
                  {downlineUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role.toUpperCase()}) — {u.location || 'Territory N/A'}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">Product Catalog & Categories</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('All')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedCategory === 'All' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Products
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        selectedCategory === cat.name ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                <div className="border border-slate-200 rounded-2xl max-h-72 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50 p-3">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400 font-medium">No products found in this category.</div>
                  ) : (
                    filteredProducts.map((p) => {
                      const currentItem = orderItems.find(i => i.productId === p.id);
                      const qty = currentItem ? currentItem.quantity : 0;
                      const effectivePrice = getProductEffectivePrice(p.id);
                      return (
                        <div key={p.id} className="flex items-center justify-between py-3 px-3 hover:bg-white rounded-2xl transition gap-4">
                          <div className="flex items-center gap-3.5">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0" />
                            ) : (
                              <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center shrink-0 text-slate-400">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-black text-slate-900">{p.name}</p>
                              <p className="text-[10px] text-slate-500">
                                SKU: {p.sku || 'N/A'} | Rate: <span className="font-bold text-slate-800">₹{effectivePrice}</span> | GST: <span className="text-amber-600 font-bold">{p.gst_percent || 0}%</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Qty:</span>
                            <input
                              type="number"
                              min="0"
                              value={qty}
                              onChange={(e) => handleQuantityChange(p, Number(e.target.value))}
                              className="w-20 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-black text-slate-900 text-center focus:outline-none focus:border-amber-500 shadow-sm"
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {orderItems.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-amber-900 uppercase tracking-wider">Order Summary ({orderItems.length} items)</span>
                    <div className="text-right text-xs font-black text-amber-900">
                      <span>Subtotal: ₹{orderItems.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0).toFixed(2)}</span>
                      <span className="block text-[11px] text-amber-700">Total with GST: ₹{orderItems.reduce((acc, i) => acc + (i.quantity * i.unitPrice * (1 + i.gstPercent/100)), 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {orderItems.map((item) => (
                      <div key={item.productId} className="flex justify-between items-center text-xs bg-white p-2.5 rounded-xl border border-amber-100 shadow-sm">
                        <span className="font-bold text-slate-900">{item.name} <span className="text-[10px] text-slate-500">({item.sku})</span></span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-600 font-medium">{item.quantity} × ₹{item.unitPrice} (+{item.gstPercent}% GST) = <strong className="text-slate-900">₹{(item.quantity * item.unitPrice * (1 + item.gstPercent/100)).toFixed(2)}</strong></span>
                          <button type="button" onClick={() => handleRemoveItem(item.productId)} className="text-rose-500 hover:text-rose-700 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs hover:bg-slate-200 transition cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer">Confirm & Place Stockist Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {invoiceOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl w-full max-w-2xl p-8 space-y-6 shadow-2xl relative border border-slate-200 my-8">
            <button onClick={() => setInvoiceOrder(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl bg-slate-50"><X className="w-5 h-5" /></button>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <img src="/images/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                  <div>
                    <h3 className="text-base font-black text-slate-900">XLLENT FOODS STOCKIST INVOICE</h3>
                    <p className="text-[11px] text-slate-500">Order #XFP-{invoiceOrder.id} — Billed To: {invoiceOrder.buyer_name}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold rounded-xl text-xs">₹{invoiceOrder.total_amount}</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs">
                <p><strong>Selected Stockist Partner:</strong> {invoiceOrder.buyer_name} ({invoiceOrder.buyer_email})</p>
                <p><strong>Role & Territory:</strong> {invoiceOrder.buyer_role?.toUpperCase()} — <span className="text-amber-600 font-bold">{invoiceOrder.status}</span></p>
                <p><strong>Fulfiller Upline:</strong> {invoiceOrder.seller_name || 'Direct Admin Hub'}</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Download PDF invoice with SKU, price per piece, quantity, and GST breakdown.</span>
              <button 
                onClick={handleDownloadPDF} 
                disabled={isDownloading}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> {isDownloading ? 'Generating PDF...' : 'Download PDF Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}