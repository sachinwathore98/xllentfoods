'use client';
import React, { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { ShoppingCart, Plus, FileText, X, Trash2, Download, Package, Search, Calendar, Edit3, Filter, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import jsPDF from 'jspdf';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [downlineUsers, setDownlineUsers] = useState<any[]>([]);
  const [upstreamVendors, setUpstreamVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [partnerPricing, setPartnerPricing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Super Stockist Mode State
  const [orderMode, setOrderMode] = useState<'upstream' | 'downstream'>('downstream');

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [orderItems, setOrderItems] = useState<{ productId: number; name: string; sku?: string; category: string; quantity: number; unitPrice: number; gstPercent: number; unitType: 'carton' | 'packet' }[]>([]);
  
  // Edit Order State
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [editStatus, setEditStatus] = useState('Pending');
  const [editItems, setEditItems] = useState<any[]>([]);
  const [editCategory, setEditCategory] = useState('All');

  // Invoice State
  const [invoiceOrder, setInvoiceOrder] = useState<any | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      setCurrentUser(u);
      fetchOrders(u.id, u.role);
      fetchPartnersAndVendors(u.id, u.role);
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

  const fetchPartnersAndVendors = async (userId: string, role: string) => {
    try {
      const res = await API.get(`/api/admin/downline-users?userId=${userId}&role=${role}`);
      const allUsers = res.data.users || [];
      
      setDownlineUsers(allUsers.filter((u: any) => u.id !== Number(userId)));
      const upVendors = allUsers.filter((u: any) => u.role === 'admin' || u.role === 'superadmin' || u.role === 'superadmin@xllentfoods.com');
      setUpstreamVendors(upVendors.length > 0 ? upVendors : [{ id: 1, name: 'Xllent Foods Central Admin', role: 'admin' }]);
    } catch (err) {
      console.error('Failed to fetch network partners', err);
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

  const handleTargetSelect = async (targetId: string) => {
    setSelectedTargetId(targetId);
    if (!targetId || orderMode === 'upstream') {
      setPartnerPricing([]);
      return;
    }
    try {
      const res = await API.get(`/api/downline-pricing/${targetId}`);
      setPartnerPricing(res.data.pricing || []);
    } catch (err) {
      console.error('Failed to fetch partner pricing', err);
    }
  };

  const getIsCartonOrder = () => {
    if (orderMode === 'upstream') return true;
    const targetUser = downlineUsers.find(u => String(u.id) === String(selectedTargetId));
    if (!targetUser) return true;
    return targetUser.role === 'super_stockist' || targetUser.role === 'distributor';
  };

  const getProductEffectivePrice = (product: any, unitType: 'carton' | 'packet') => {
    const isCarton = unitType === 'carton';
    let basePrice = Number(product.mrp);

    const pricingMatch = partnerPricing.find((p) => p.product_id === product.id);
    if (pricingMatch && pricingMatch.custom_price !== null) {
      basePrice = Number(pricingMatch.custom_price);
    } else {
      const targetUser = downlineUsers.find(u => String(u.id) === String(selectedTargetId));
      if (targetUser?.role === 'super_stockist') basePrice = Number(product.super_stockist_price || product.mrp);
      else if (targetUser?.role === 'distributor') basePrice = Number(product.distributor_price || product.mrp);
      else if (targetUser?.role === 'shop') basePrice = Number(product.shop_price || product.mrp);
    }

    const packetsPerCtn = Number(product.packets_per_carton || 1);
    return isCarton ? basePrice * packetsPerCtn : basePrice;
  };

  const handleUnitQuantityChange = (product: any, inputVal: number, unitType: 'carton' | 'packet') => {
    const count = Math.max(0, inputVal);
    const pktsPerCtn = Number(product.packets_per_carton || 1);
    
    // Explicit multiplication: Cartons * Packets Per Carton = Total Packets stored in DB
    const totalPackets = unitType === 'carton' ? count * pktsPerCtn : count;
    const unitPrice = getProductEffectivePrice(product, unitType);

    setOrderItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (totalPackets === 0) {
        return prev.filter((item) => item.productId !== product.id);
      }
      if (existing) {
        return prev.map((item) => item.productId === product.id ? { ...item, quantity: totalPackets, unitPrice, unitType } : item);
      } else {
        return [...prev, { 
          productId: product.id, 
          name: product.name, 
          sku: product.sku || 'N/A',
          category: product.category, 
          quantity: totalPackets, 
          unitPrice, 
          gstPercent: Number(product.gst_percent || 0),
          unitType
        }];
      }
    });
  };

  const handleRemoveItem = (productId: number) => {
    setOrderItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderItems.length === 0) {
      alert('Please add at least one product with quantity.');
      return;
    }

    const targetId = orderMode === 'upstream' 
      ? Number(selectedTargetId || upstreamVendors[0]?.id || 1) 
      : Number(selectedTargetId);

    if (!targetId) {
      alert('Please select a target partner or vendor.');
      return;
    }

    const subtotal = orderItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const totalGst = orderItems.reduce((acc, item) => acc + ((item.quantity * item.unitPrice * item.gstPercent) / 100), 0);
    const totalAmount = Number((subtotal + totalGst).toFixed(2));

    try {
      await API.post('/api/orders/smart', {
        buyerId: orderMode === 'upstream' ? currentUser.id : targetId,
        items: orderItems,
        totalAmount,
        proxyForId: orderMode === 'upstream' ? targetId : currentUser.id
      });
      setIsCreateModalOpen(false);
      setOrderItems([]);
      setSelectedTargetId('');
      setPartnerPricing([]);
      fetchOrders(currentUser.id, currentUser.role);
      alert(orderMode === 'upstream' ? 'Replenishment order successfully placed to Uplink!' : 'Invoice & Downstream order successfully generated!');
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

  const openEditModal = async (order: any) => {
    setEditingOrder(order);
    setEditStatus(order.status || 'Pending');
    setEditCategory('All');
    setEditItems(order.items ? order.items.map((i: any) => ({
      productId: i.product_id || i.productId,
      name: i.name,
      sku: i.sku || 'N/A',
      quantity: i.quantity,
      unitPrice: i.unit_price || i.unitPrice,
      gstPercent: i.gst_percent || i.gstPercent || 0
    })) : []);

    if (order.buyer_id) {
      try {
        const res = await API.get(`/api/downline-pricing/${order.buyer_id}`);
        setPartnerPricing(res.data.pricing || []);
      } catch (err) {
        console.error('Failed to fetch pricing for edit modal', err);
      }
    }
  };

  const handleEditItemQuantity = (productId: number, qty: number) => {
    const quantity = Math.max(0, qty);
    const prod = products.find(p => p.id === productId);
    const unitPrice = prod ? Number(prod.mrp) : 0;

    setEditItems((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (quantity === 0) {
        return prev.filter((item) => item.productId !== productId);
      }
      if (existing) {
        return prev.map((item) => item.productId === productId ? { ...item, quantity, unitPrice } : item);
      } else {
        return [...prev, {
          productId,
          name: prod?.name || 'Product',
          sku: prod?.sku || 'N/A',
          quantity,
          unitPrice,
          gstPercent: Number(prod?.gst_percent || 0)
        }];
      }
    });
  };

  const handleRemoveEditItem = (productId: number) => {
    setEditItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    const subtotal = editItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const totalGst = editItems.reduce((acc, item) => acc + ((item.quantity * item.unitPrice * (item.gstPercent || 0)) / 100), 0);
    const totalAmount = Number((subtotal + totalGst).toFixed(2));

    try {
      await API.put(`/api/orders/${editingOrder.id}`, {
        status: editStatus,
        items: editItems,
        totalAmount
      });
      setEditingOrder(null);
      fetchOrders(currentUser.id, currentUser.role);
      alert('Order items and products successfully updated!');
    } catch (err) {
      console.error('Failed to update order products', err);
      alert('Failed to update order.');
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

      pdf.setFillColor(217, 119, 6);
      pdf.rect(0, 0, 210, 4, 'F');

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
      pdf.text('Official Tax Invoice & Partner Billing Statement', textXOffset, 30);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`INVOICE #XFP-INV-${invoiceOrder.id}`, 192, 18, { align: 'right' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(210, 215, 225);
      pdf.text(`Date: ${new Date(invoiceOrder.created_at).toLocaleDateString()}`, 192, 25, { align: 'right' });

      pdf.setFillColor(254, 243, 199);
      pdf.rect(15, 48, 180, 10, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(180, 83, 9);
      pdf.text('GSTIN: 27AABCX1234F1Z5', 20, 54.5);

      pdf.setDrawColor(226, 232, 240);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(15, 63, 180, 52, 3, 3, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text('BILLED TO (PARTNER / BUYER)', 20, 71);
      pdf.text('FULFILLED BY (SELLER / UPLINE)', 110, 71);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(15, 23, 42);
      pdf.text(invoiceOrder.buyer_name || 'N/A', 20, 79);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text(`Email: ${invoiceOrder.buyer_email || 'N/A'}`, 20, 85);
      pdf.text(`Phone: ${invoiceOrder.buyer_phone || 'N/A'}`, 20, 91);
      pdf.text(`GSTIN: ${invoiceOrder.buyer_gst || 'Unregistered / Consumer'}`, 20, 97);
      pdf.text(`Role: ${(invoiceOrder.buyer_role || 'Partner').toUpperCase()}`, 20, 103);
      pdf.text(`Territory / Location: ${invoiceOrder.buyer_location || 'Registered Territory'}`, 20, 109);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Xllent Foods', 110, 79);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text(`Email: xllentfoods91@gmail.com`, 110, 85);
      pdf.text(`Support Phone: +91 73878 77820`, 110, 91);
      pdf.text(`Network Role: ADMIN`, 110, 97);

      let startY = 122;
      pdf.setFillColor(241, 245, 249);
      pdf.rect(15, startY, 180, 8, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(71, 85, 105);
      pdf.text('PRODUCT NAME & SKU', 20, startY + 5.5);
      pdf.text('QTY', 110, startY + 5.5, { align: 'right' });
      pdf.text('PRICE/UNIT', 135, startY + 5.5, { align: 'right' });
      pdf.text('GST%', 160, startY + 5.5, { align: 'right' });
      pdf.text('TOTAL', 190, startY + 5.5, { align: 'right' });

      startY += 12;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(15, 23, 42);

      const itemsList = invoiceOrder.items || [];

      itemsList.forEach((item: any, idx: number) => {
        const itemY = startY + (idx * 9);
        const qty = item.quantity || 1;
        const pricePerUnit = item.unit_price || item.unitPrice || 0;
        const gst = item.gst_percent || item.gstPercent || 0;
        const lineTotal = qty * pricePerUnit * (1 + gst / 100);

        pdf.text(`${item.name || 'Product'} [SKU: ${item.sku || 'N/A'}]`, 20, itemY);
        pdf.text(String(qty), 110, itemY, { align: 'right' });
        pdf.text(`Rs. ${Number(pricePerUnit).toFixed(2)}`, 135, itemY, { align: 'right' });
        pdf.text(`${gst}%`, 160, itemY, { align: 'right' });
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Rs. ${lineTotal.toFixed(2)}`, 190, itemY, { align: 'right' });
        pdf.setFont('helvetica', 'normal');
      });

      startY += (itemsList.length * 9) + 6;
      pdf.setDrawColor(226, 232, 240);
      pdf.line(15, startY, 195, startY);

      startY += 10;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Grand Total (Incl. GST):', 120, startY);
      pdf.setTextColor(217, 119, 6);
      pdf.text(`Rs. ${invoiceOrder.total_amount}`, 190, startY, { align: 'right' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Terms & Conditions: Goods once sold will not be taken back. Subject to local jurisdiction.', 15, 245);

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

  const editFilteredProducts = editCategory === 'All'
    ? products
    : products.filter(p => p.category === editCategory);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = 
      String(o.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.buyer_name && o.buyer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (o.buyer_location && o.buyer_location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || (o.status && o.status.toLowerCase() === statusFilter.toLowerCase());
    
    return matchesSearch && matchesStatus;
  });

  const isSuperStockist = currentUser?.role === 'super_stockist';
  const isCartonOrder = getIsCartonOrder();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Orders & Downstream Feed</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Portal Role: <span className="text-amber-600 font-extrabold uppercase">{currentUser?.role}</span>. Manage automated fulfillment and partner tax invoices.
          </p>
        </div>
        <button
          onClick={() => {
            setOrderMode(isSuperStockist ? 'downstream' : 'downstream');
            setIsCreateModalOpen(true);
          }}
          className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> {isSuperStockist ? 'New Order / Invoice' : 'Create Order for Partner'}
        </button>
      </div>

      {/* Search and Dropdown Status Filter Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Order ID (#9) or Partner Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 transition shadow-inner"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-2xl px-4 py-3 focus:outline-none focus:border-amber-500 transition cursor-pointer w-full md:w-48 shadow-sm"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Completed">Completed</option>
            <option value="Approved">Approved</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table Feed */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-xs font-bold animate-pulse">Loading orders feed...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-24 space-y-3">
            <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-slate-600 text-xs font-bold">No orders found matching your search or filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                  <th className="p-4 pl-6">Order ID & Date</th>
                  <th className="p-4">Partner / Vendor (Billed To)</th>
                  <th className="p-4">Seller / Upline</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions / Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4 pl-6">
                      <span className="font-mono font-black text-amber-600 text-sm block">#XFP-{o.id}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 font-semibold">
                        <Calendar className="w-3 h-3 text-slate-400" /> {new Date(o.created_at).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900 text-sm">{o.buyer_name}</p>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                        ({o.buyer_role?.toUpperCase()}) — <span className="text-slate-600 font-bold">{o.buyer_location || 'N/A'}</span>
                        {o.buyer_gst && <span className="block text-amber-700 font-mono font-bold">GSTIN: {o.buyer_gst}</span>}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 font-bold">{o.seller_name || 'Direct Admin'}</td>
                    <td className="p-4 font-black text-slate-900 text-sm">₹{o.total_amount}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block ${
                        o.status === 'Completed' || o.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        {o.status || 'Pending'}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setInvoiceOrder(o)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl inline-flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-600" /> Invoice
                      </button>
                      <button
                        onClick={() => openEditModal(o)}
                        className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-extrabold rounded-xl inline-flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                        title="Edit Products & Items"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Products
                      </button>
                      <select
                        value={o.status || 'Pending'}
                        onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                        className="bg-white border border-slate-200 text-slate-800 text-[11px] rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 cursor-pointer shadow-sm font-bold"
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
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer inline-flex items-center shadow-sm align-middle"
                        title="Delete Order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl p-6 md:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Edit Products for Order #XFP-{editingOrder.id}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Billed to: <strong className="text-slate-800">{editingOrder.buyer_name}</strong> ({editingOrder.buyer_role?.toUpperCase()})</p>
              </div>
              <button onClick={() => setEditingOrder(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl bg-slate-50 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleUpdateOrder} className="space-y-6">
              <div className="space-y-3">
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">Product Catalog & Categories</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditCategory('All')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      editCategory === 'All' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Products
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setEditCategory(cat.name)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        editCategory === cat.name ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                <div className="border border-slate-200 rounded-2xl max-h-72 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50 p-3">
                  {editFilteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400 font-medium">No products found in this category.</div>
                  ) : (
                    editFilteredProducts.map((p) => {
                      const currentItem = editItems.find(i => i.productId === p.id);
                      const qty = currentItem ? currentItem.quantity : 0;
                      const effectivePrice = Number(p.mrp);
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
                              onChange={(e) => handleEditItemQuantity(p.id, Number(e.target.value))}
                              className="w-20 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-black text-slate-900 text-center focus:outline-none focus:border-amber-500 shadow-sm"
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {editItems.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-amber-900 uppercase tracking-wider">Current Order Summary ({editItems.length} items)</span>
                    <div className="text-right text-xs font-black text-amber-900">
                      <span>Total with GST: ₹{editItems.reduce((acc, i) => acc + (i.quantity * i.unitPrice * (1 + i.gstPercent/100)), 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {editItems.map((item) => (
                      <div key={item.productId} className="flex justify-between items-center text-xs bg-white p-2.5 rounded-xl border border-amber-100 shadow-sm">
                        <span className="font-bold text-slate-900">{item.name} <span className="text-[10px] text-slate-500">({item.sku})</span></span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-600 font-medium">{item.quantity} × ₹{item.unitPrice} = <strong className="text-slate-900">₹{(item.quantity * item.unitPrice * (1 + item.gstPercent/100)).toFixed(2)}</strong></span>
                          <button type="button" onClick={() => handleRemoveEditItem(item.productId)} className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setEditingOrder(null)} className="px-5 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs hover:bg-slate-200 transition cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer">Save Order Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl p-6 md:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">{isSuperStockist ? 'Smart Order & Billing Hub' : 'Create Order for Downline Partner'}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isSuperStockist ? `Ordering Mode: ${isCartonOrder ? '📦 Cartons Rate & Units' : '📄 Packets Rate & Units'}` : 'Rates automatically apply per partner pricing structure.'}
                </p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl bg-slate-50 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-6">
              {isSuperStockist && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => { setOrderMode('upstream'); setSelectedTargetId(''); setPartnerPricing([]); }}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3.5 ${
                      orderMode === 'upstream' ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-800 border-slate-200 hover:border-amber-400'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${orderMode === 'upstream' ? 'bg-amber-500 text-slate-950' : 'bg-amber-50 text-amber-600'}`}>
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-xs">1. Order from Uplink (Admin / Super Admin)</h4>
                      <p className={`text-[9px] mt-0.5 ${orderMode === 'upstream' ? 'text-slate-300' : 'text-slate-500'}`}>Replenish warehouse stock in Cartons</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setOrderMode('downstream'); setSelectedTargetId(''); setPartnerPricing([]); }}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3.5 ${
                      orderMode === 'downstream' ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-800 border-slate-200 hover:border-amber-400'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${orderMode === 'downstream' ? 'bg-amber-500 text-slate-950' : 'bg-blue-50 text-blue-600'}`}>
                      <ArrowDownLeft className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-xs">2. Fulfill Downstream & Bill</h4>
                      <p className={`text-[9px] mt-0.5 ${orderMode === 'downstream' ? 'text-slate-300' : 'text-slate-500'}`}>Cartons for Distributors, Packets for Shops</p>
                    </div>
                  </button>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-2">
                  {orderMode === 'upstream' ? 'Select Upstream Vendor (Admin / Super Admin)' : 'Select Downline Partner Account (Distributor, Retail Shop)'}
                </label>
                <select
                  value={selectedTargetId}
                  onChange={(e) => handleTargetSelect(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:bg-white transition cursor-pointer"
                >
                  <option value="">-- Choose Partner / Vendor --</option>
                  {orderMode === 'upstream' ? (
                    upstreamVendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name} ({v.role.toUpperCase()})</option>
                    ))
                  ) : (
                    downlineUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role.toUpperCase()}) — {u.location || 'Territory N/A'}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">Product Catalog & Categories</label>
                  <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-3 py-1 rounded-lg uppercase">
                    Ordering Unit: {isCartonOrder ? '📦 Cartons (Multiplies by Pkts/Ctn)' : '📄 Packets'}
                  </span>
                </div>

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
                      const unitType = isCartonOrder ? 'carton' : 'packet';
                      const pktsPerCtn = Number(p.packets_per_carton || 1);
                      
                      const totalPkts = currentItem ? currentItem.quantity : 0;
                      const inputVal = unitType === 'carton' ? Math.floor(totalPkts / pktsPerCtn) : totalPkts;
                      const unitPrice = getProductEffectivePrice(p, unitType);

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
                                SKU: {p.sku || 'N/A'} | Rate ({unitType === 'carton' ? 'Per Carton' : 'Per Packet'}): <span className="font-bold text-slate-800">₹{unitPrice}</span> | GST: <span className="text-amber-600 font-bold">{p.gst_percent || 0}%</span>
                              </p>
                              <p className="text-[9px] text-amber-700 font-bold">📦 Ratio: {pktsPerCtn} Pkts per Carton (1 Ctn = {pktsPerCtn} Pkts added to stock)</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{unitType === 'carton' ? 'Cartons:' : 'Packets:'}</span>
                            <input
                              type="number"
                              min="0"
                              value={inputVal}
                              onChange={(e) => handleUnitQuantityChange(p, Number(e.target.value), unitType)}
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
                          <span className="text-slate-600 font-medium">{item.quantity} total packets ({item.unitType === 'carton' ? `${item.quantity / (products.find(p=>p.id===item.productId)?.packets_per_carton || 1)} Ctns` : `${item.quantity} Pkts`}) × rate = <strong className="text-slate-900">₹{(item.quantity * item.unitPrice * (1 + item.gstPercent/100)).toFixed(2)}</strong></span>
                          <button type="button" onClick={() => handleRemoveItem(item.productId)} className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs hover:bg-slate-200 transition cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer">
                  {orderMode === 'upstream' ? 'Submit Replenishment Order' : 'Generate Bill & Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {invoiceOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl w-full max-w-2xl p-8 space-y-6 shadow-2xl relative border border-slate-200 my-8">
            <button onClick={() => setInvoiceOrder(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl bg-slate-50 cursor-pointer"><X className="w-5 h-5" /></button>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <img src="/images/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                  <div>
                    <h3 className="text-base font-black text-slate-900">XLLENT FOODS PARTNER INVOICE</h3>
                    <p className="text-[11px] text-slate-500">Order #XFP-{invoiceOrder.id} — Billed To: {invoiceOrder.buyer_name}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold rounded-xl text-xs">₹{invoiceOrder.total_amount}</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs">
                <p><strong>Selected Partner / Vendor:</strong> {invoiceOrder.buyer_name} ({invoiceOrder.buyer_email})</p>
                <p><strong>Role & Location:</strong> {invoiceOrder.buyer_role?.toUpperCase()} — {invoiceOrder.buyer_location || 'N/A'}</p>
                {invoiceOrder.buyer_gst && <p><strong>GSTIN:</strong> {invoiceOrder.buyer_gst}</p>}
                <p><strong>Order Created At:</strong> {new Date(invoiceOrder.created_at).toLocaleString()}</p>
                <p><strong>Status:</strong> <span className="text-amber-600 font-bold">{invoiceOrder.status}</span></p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Download professional PDF invoice with itemized products and partner details.</span>
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