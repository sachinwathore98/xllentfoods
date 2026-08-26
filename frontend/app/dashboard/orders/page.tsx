'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { ShoppingCart, Plus, PackageCheck, Clock, ArrowLeft, FileText, Send } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  category: string;
  mrp: number;
}

interface OrderItem {
  product_name?: string;
  sku?: string;
  quantity: number;
}

interface Order {
  id: number;
  items: OrderItem[];
  total_amount: number;
  status: string;
  created_at: string;
  buyer_name?: string;
}

export default function OrdersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await API.get('/api/products/public');
      const fetchedProducts = res.data.products || [];
      setProducts(fetchedProducts);
      if (fetchedProducts.length > 0) {
        setSelectedProduct(String(fetchedProducts[0].id));
      }
    } catch (err) {
      console.error("Error loading products", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await API.get('/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error("Error loading orders", err);
    }
  };

  const addToCart = () => {
    const prod = products.find(p => String(p.id) === selectedProduct);
    if (!prod) return;

    const existing = cart.find(item => item.product.id === prod.id);
    if (existing) {
      setCart(cart.map(item => item.product.id === prod.id ? { ...item, quantity: item.quantity + Number(quantity) } : item));
    } else {
      setCart([...cart, { product: prod, quantity: Number(quantity) }]);
    }
  };

  const submitSmartOrder = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      const totalAmount = cart.reduce((sum, item) => sum + (item.product.mrp * item.quantity), 0);

      const orderPayload = {
        buyerId: user?.id || 1,
        totalAmount,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.mrp
        }))
      };
      
      const res = await API.post('/api/orders/smart', orderPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(`Smart order placed successfully! Routed to assigned distribution partner (ID: ${res.data.assignedSellerId || 'Hub'})`);
      setCart([]);
      fetchOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to place smart order.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (orderId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await API.get(`/api/orders/${orderId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const { order, items } = res.data;
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to download invoices.');
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice #${order.id} - Xllent Foods</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: auto; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
              .company { font-size: 24px; font-weight: bold; color: #d97706; }
              .details { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; font-size: 14px; }
              th { background: #f8fafc; color: #475569; }
              .total { text-align: right; font-size: 18px; font-weight: bold; color: #0f172a; }
              .footer { text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 50px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="company">Xllent Foods</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Smart Distribution Management System</div>
              </div>
              <div style="text-align: right;">
                <h2>INVOICE</h2>
                <div style="font-size: 14px; color: #64748b;">Order ID: #${order.id}</div>
                <div style="font-size: 14px; color: #64748b;">Date: ${new Date(order.created_at).toLocaleDateString()}</div>
              </div>
            </div>
            <div class="details">
              <div>
                <strong>Billed To:</strong><br/>
                ${order.buyer_name}<br/>
                Email: ${order.buyer_email}<br/>
                Phone: ${order.buyer_phone || 'N/A'}<br/>
                Location: ${order.buyer_location || 'N/A'}
              </div>
              <div style="text-align: right;">
                <strong>Status:</strong> ${order.status}
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th>SKU</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((item: any) => `
                  <tr>
                    <td>${item.product_name}</td>
                    <td>${item.sku}</td>
                    <td>${item.quantity}</td>
                    <td>₹${Number(item.unit_price).toLocaleString()}</td>
                    <td>₹${(Number(item.unit_price) * item.quantity).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total">
              Grand Total: ₹${Number(order.total_amount).toLocaleString()}
            </div>
            <div class="footer">
              <p>Thank you for partnering with Xllent Foods B2B Network.</p>
            </div>
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } catch (err) {
      alert('Failed to generate PDF invoice.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-10 text-slate-800">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <a href="/dashboard/overview" className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </a>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Send className="w-7 h-7 text-amber-600" /> Smart Supply Chain & Proxy Ordering
          </h1>
          <p className="text-xs text-slate-500 mt-1">Place orders with automated distributor/super-stockist routing or field proxy logging.</p>
        </div>

        {error && <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">{error}</div>}
        {success && <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">{success}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Create Order Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1">
            <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-600" /> New Smart Order
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Product</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (₹{p.mrp})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Quantity (Units)</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                onClick={addToCart}
                className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl shadow-md hover:bg-slate-800 transition text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add to Order Cart
              </button>
            </div>

            {cart.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3">Cart Items ({cart.length})</h4>
                <ul className="space-y-2 mb-4">
                  {cart.map((item, idx) => (
                    <li key={idx} className="flex justify-between text-xs font-medium text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span>{item.product.name}</span>
                      <span className="font-bold text-amber-600">x{item.quantity}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={submitSmartOrder}
                  disabled={loading}
                  className="w-full py-3.5 bg-amber-600 text-white font-bold rounded-xl shadow-lg hover:bg-amber-700 transition text-xs cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Routing Order...' : 'Submit Smart Routed Order'}
                </button>
              </div>
            )}
          </div>

          {/* Orders History List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
            <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-amber-600" /> Routed Network Orders
            </h3>

            {orders.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs font-medium">No active orders placed yet.</div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-amber-600">Order ID: #{order.id}</span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                          order.status === 'Dispatched' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          <Clock className="w-3 h-3" /> {order.status || 'Pending'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 mt-1">Placed by / Proxy: {order.buyer_name || 'Partner Account'}</p>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {new Date(order.created_at).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="text-xs font-extrabold text-slate-900">₹{parseFloat(String(order.total_amount || 0)).toLocaleString()}</span>
                      <button
                        onClick={() => handleDownloadInvoice(order.id)}
                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-600" /> Invoice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}