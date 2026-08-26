'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { ShoppingCart, Package, Search, ArrowRight, CheckCircle2 } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  category: string;
  sku: string;
  mrp: number;
  super_stockist_price: number;
  distributor_price: number;
  shop_price: number;
  status: string;
  image?: string;
}

export default function PublicProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await API.get('/api/categories');
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await API.get('/api/products/public');
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Failed to load public products', err);
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

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    setMessage('');

    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user) {
        alert('Please log in to your partner account to place a smart order.');
        window.location.href = '/login';
        return;
      }

      const totalAmount = cart.reduce((sum, item) => sum + (item.product.shop_price || item.product.mrp) * item.quantity, 0);

      const orderPayload = {
        buyerId: user.id,
        totalAmount,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.shop_price || item.product.mrp
        }))
      };

      const res = await API.post('/api/orders/smart', orderPayload);
      setMessage(`Order placed successfully! Automatically routed to assigned regional partner (Hub ID: ${res.data.assignedSellerId || 'Direct'}).`);
      setCart([]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Xllent Foods Catalog</h1>
            <p className="text-xs text-slate-500 mt-1">Browse live inventory items, wholesale tiers, and place direct distribution orders.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items or SKU..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {message && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['All', ...categories.map(c => c.name)].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${selectedCategory === cat ? 'bg-amber-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid & Cart Drawer Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Products List */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-20 text-center text-slate-400 text-sm font-medium">No products found matching your search.</div>
            ) : (
              filteredProducts.map(p => (
                <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-amber-500 transition">
                  <div>
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-44 object-cover rounded-xl mb-3 bg-slate-100" />
                    ) : (
                      <div className="w-full h-44 bg-slate-100 rounded-xl mb-3 flex items-center justify-center text-slate-400">
                        <Package className="w-10 h-10" />
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md uppercase">{p.category}</span>
                      <span className="text-xs font-bold text-slate-400 line-through">MRP: ₹{p.mrp}</span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-600 transition">{p.name}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">SKU: {p.sku}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Wholesale Rate</span>
                      <span className="text-sm font-black text-slate-900">₹{p.shop_price || p.mrp}</span>
                    </div>
                    <button
                      onClick={() => addToCart(p)}
                      className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition flex items-center gap-1 cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShoppingCart className="w-5 h-5 text-amber-600" /> Order Cart ({cart.length})
            </h3>

            {cart.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Your cart is empty. Add products to begin smart routing.</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-800">{item.product.name}</p>
                      <p className="text-[10px] text-slate-500">Qty: {item.quantity} × ₹{item.product.shop_price || item.product.mrp}</p>
                    </div>
                    <span className="font-extrabold text-amber-600">₹{(item.quantity * (item.product.shop_price || item.product.mrp)).toLocaleString()}</span>
                  </div>
                ))}

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-sm font-black text-slate-900">
                  <span>Total Amount:</span>
                  <span>₹{cart.reduce((sum, item) => sum + (item.quantity * (item.product.shop_price || item.product.mrp)), 0).toLocaleString()}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full py-3 bg-amber-600 text-white font-bold rounded-xl text-xs hover:bg-amber-700 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-lg shadow-amber-600/20"
                >
                  {loading ? 'Processing...' : 'Submit Smart Routed Order'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}