'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { ShoppingCart, Package, CheckCircle2, ArrowUpRight, UserCheck } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  sku: string;
  mrp: number;
  shop_price: number;
  distributor_price: number;
  super_stockist_price: number;
}

interface Order {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  buyer_name: string;
  buyer_email: string;
  seller_id: number;
}

interface ShopUser {
  id: number;
  name: string;
  email: string;
}

export default function OrdersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [shops, setShops] = useState<ShopUser[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role);
      setUserId(user.id);
      if (user.role === 'employee') {
        fetchShopsList();
      }
    }
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await API.get('/api/products/public');
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Failed to load products', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await API.get('/api/orders');
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error('Failed to load orders', err);
    }
  };

  const fetchShopsList = async () => {
    try {
      const res = await API.get('/api/admin/users-list');
      const shopList = (res.data.users || []).filter((u: any) => u.role === 'shop');
      setShops(shopList);
      if (shopList.length > 0) setSelectedShopId(shopList[0].id.toString());
    } catch (err) {
      console.error('Failed to load shops for proxy ordering', err);
    }
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const getEffectivePrice = (product: Product) => {
    if (userRole === 'super_stockist') return product.super_stockist_price || product.mrp;
    if (userRole === 'distributor') return product.distributor_price || product.mrp;
    return product.shop_price || product.mrp;
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !userId) return;
    setLoading(true);
    setMessage('');

    try {
      const totalAmount = cart.reduce((sum, item) => sum + getEffectivePrice(item.product) * item.quantity, 0);

      const payload: any = {
        buyerId: userId,
        totalAmount,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: getEffectivePrice(item.product)
        }))
      };

      if (userRole === 'employee' && selectedShopId) {
        payload.proxyForId = Number(selectedShopId);
      }

      const res = await API.post('/api/orders/smart', payload);
      setMessage(`Order successfully placed and routed upstream! (Order ID: #${res.data.orderId})`);
      setCart([]);
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      await API.put(`/api/orders/${orderId}/status`, { status: newStatus });
      setMessage(`Order #${orderId} status updated to ${newStatus}`);
      fetchOrders();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto text-slate-800 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-8 h-8 text-amber-600" /> Smart Supply Chain & Proxy Ordering
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Portal Role: <span className="font-bold uppercase text-amber-600">{userRole}</span>. Orders route automatically based on network hierarchy.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Employee Proxy Banner */}
      {userRole === 'employee' && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <UserCheck className="w-6 h-6 text-amber-600" />
            <div>
              <h4 className="font-bold text-xs text-amber-900 uppercase">Field Employee Proxy Mode</h4>
              <p className="text-[11px] text-amber-700">Select a retail shop below to place orders on their behalf.</p>
            </div>
          </div>
          <select
            value={selectedShopId}
            onChange={(e) => setSelectedShopId(e.target.value)}
            className="px-4 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 outline-none"
          >
            {shops.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Product Catalog & Ordering Section (Hidden for Admin/Superadmin unless they want to stock) */}
        {['super_stockist', 'distributor', 'shop', 'employee'].includes(userRole) && (
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" /> Select Products to Order Upstream
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
                {products.map(p => (
                  <div key={p.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{p.name}</h4>
                      <p className="text-[10px] text-slate-400">SKU: {p.sku}</p>
                      <p className="text-xs font-black text-amber-600 mt-1">₹{getEffectivePrice(p)}</p>
                    </div>
                    <button
                      onClick={() => addToCart(p)}
                      className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Cart & Checkout Sidebar */}
        {['super_stockist', 'distributor', 'shop', 'employee'].includes(userRole) && (
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShoppingCart className="w-5 h-5 text-amber-600" /> Order Cart ({cart.length})
            </h3>

            {cart.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Cart is empty. Select products above.</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-800">{item.product.name}</p>
                      <p className="text-[10px] text-slate-500">Qty: {item.quantity} × ₹{getEffectivePrice(item.product)}</p>
                    </div>
                    <span className="font-extrabold text-amber-600">₹{(item.quantity * getEffectivePrice(item.product)).toLocaleString()}</span>
                  </div>
                ))}

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-sm font-black text-slate-900">
                  <span>Total Amount:</span>
                  <span>₹{cart.reduce((sum, item) => sum + (item.quantity * getEffectivePrice(item.product)), 0).toLocaleString()}</span>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full py-3 bg-amber-600 text-white font-bold rounded-xl text-xs hover:bg-amber-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-600/20"
                >
                  {loading ? 'Routing...' : 'Place Upstream Order'} <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Routed Network Orders Feed */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-slate-900">Routed Network Orders Feed</h3>
        {orders.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No orders found in the network.</p>
        ) : (
          <div className="space-y-4">
            {orders.map(ord => (
              <div key={ord.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">Order ID: #{ord.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${ord.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {ord.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Placed By: <span className="font-bold text-slate-800">{ord.buyer_name}</span> ({ord.buyer_email}) on {new Date(ord.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-base font-black text-slate-900">₹{Number(ord.total_amount).toLocaleString()}</span>
                  
                  {['superadmin', 'admin', 'super_stockist', 'distributor'].includes(userRole) && ord.status === 'Pending' && (
                    <button
                      onClick={() => handleUpdateStatus(ord.id, 'Approved')}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition cursor-pointer"
                    >
                      Approve Order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}