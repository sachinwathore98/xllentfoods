'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { ShoppingCart, Plus, PackageCheck, Clock, CheckCircle2, ArrowLeft } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  category: string;
  mrp: number;
}

interface Order {
  _id: string;
  items: { product: Product; quantity: number }[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function OrdersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
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
      const res = await API.get('/products/public');
      setProducts(res.data.products || []);
      if (res.data.products?.length > 0) {
        setSelectedProduct(res.data.products[0]._id);
      }
    } catch (err) {
      console.error("Error loading products", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await API.get('/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error("Error loading orders", err);
    }
  };

  const addToCart = () => {
    const prod = products.find(p => p._id === selectedProduct);
    if (!prod) return;

    const existing = cart.find(item => item.product._id === prod._id);
    if (existing) {
      setCart(cart.map(item => item.product._id === prod._id ? { ...item, quantity: item.quantity + Number(quantity) } : item));
    } else {
      setCart([...cart, { product: prod, quantity: Number(quantity) }]);
    }
  };

  const submitOrder = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const orderPayload = {
        items: cart.map(item => ({ product: item.product._id, quantity: item.quantity }))
      };
      
      await API.post('/orders', orderPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Bulk order placed successfully!');
      setCart([]);
      fetchOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-10 text-slate-800">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <a href="/dashboard/overview" className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </a>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Supply Chain & Bulk Orders</h1>
          <p className="text-xs text-slate-500 mt-1">Place stock orders and monitor fulfillment progress across the distribution network.</p>
        </div>

        {error && <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">{error}</div>}
        {success && <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">{success}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Create Order Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1">
            <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-600" /> New Bulk Order
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Product</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name} (₹{p.mrp})</option>
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                onClick={addToCart}
                className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl shadow-md hover:bg-slate-800 transition text-xs flex items-center justify-center gap-2"
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
                  onClick={submitOrder}
                  disabled={loading}
                  className="w-full py-3.5 bg-amber-600 text-white font-bold rounded-xl shadow-lg hover:bg-amber-700 transition text-xs"
                >
                  {loading ? 'Submitting...' : 'Submit Purchase Order'}
                </button>
              </div>
            )}
          </div>

          {/* Orders History List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
            <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-amber-600" /> Recent Network Orders
            </h3>

            {orders.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs font-medium">No active orders placed yet.</div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order._id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-xs font-bold text-amber-600">Order ID: {order._id.slice(-6).toUpperCase()}</span>
                      <div className="text-xs text-slate-500 mt-1">
                        {order.items.map((i, idx) => (
                          <span key={idx}>{i.product?.name} (x{i.quantity}){idx < order.items.length - 1 ? ', ' : ''}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-extrabold text-slate-900">₹{order.totalAmount || 0}</span>
                      <span className="text-xs bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {order.status || 'Pending'}
                      </span>
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