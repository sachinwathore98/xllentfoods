'use client';
import { useState, useEffect } from 'react';
import API from '@/app/lib/api';
import { ShoppingCart, Package, Plus, Minus, CheckCircle2, ArrowRight, Trash2 } from 'lucide-react';

export default function CartPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    API.get('/products/public')
      .then((res) => {
        setProducts(res.data.products || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load catalogue', err);
        setLoading(false);
      });
  }, []);

  const addToCart = (product) => {
    setOrderPlaced(false);
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item._id === product._id);
      if (existing) {
        return prevCart.map((item) =>
          item._id === product._id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prevCart, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item._id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item._id !== id));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.mrp * item.qty, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    // Simulate order submission to backend
    setTimeout(() => {
      setSubmitting(false);
      setOrderPlaced(true);
      setCart([]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <span className="bg-amber-600 text-white p-2 rounded-xl font-black text-lg">X</span>
            <h1 className="font-extrabold text-lg tracking-tight">XELLENT DMS</h1>
          </div>
          <nav className="space-y-2">
            <a href="/dashboard/overview" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-xl text-sm font-medium text-slate-300 transition">
              Overview
            </a>
            <a href="/dashboard/inventory" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-xl text-sm font-medium text-slate-300 transition">
              Inventory & Stock
            </a>
            <a href="/dashboard/cart" className="flex items-center gap-3 px-4 py-3 bg-amber-600 rounded-xl text-sm font-semibold transition">
              Order Cart
            </a>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-10 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900">B2B Order Placement Portal</h2>
            <p className="text-sm text-slate-500">Select stock items, specify quantities, and submit replenishment orders.</p>
          </div>
          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <ShoppingCart className="w-4 h-4" /> Live Cart Active
          </span>
        </header>

        {orderPlaced && (
          <div className="mb-8 bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Order Placed Successfully!</h4>
              <p className="text-xs opacity-90">Your replenishment order has been routed to your assigned regional distributor.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Selection Grid */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Available Products Catalogue</h3>
            {loading ? (
              <div className="text-center py-20 text-slate-400 text-sm">Loading available catalogue...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.map((product) => (
                  <div key={product._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-amber-600 uppercase">{product.category}</span>
                      <h4 className="font-bold text-base text-slate-900 mt-1">{product.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">SKU: {product.sku}</p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xl font-black text-slate-900">₹{product.mrp}</span>
                      <button 
                        onClick={() => addToCart(product)}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus className="w-4 h-4" /> Add to Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
            <h3 className="font-bold text-lg text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Active Order Summary</span>
              <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-full text-slate-600">{cart.length} items</span>
            </h3>

            {cart.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">Your order cart is currently empty. Add products from the left.</div>
            ) : (
              <div className="space-y-4">
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item._id} className="py-3 flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-xs text-slate-900 truncate">{item.name}</h5>
                        <p className="text-xs text-slate-400">₹{item.mrp} × {item.qty}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateQty(item._id, -1)} className="p-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-5 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item._id, 1)} className="p-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600">
                          <Plus className="w-3 h-3" />
                        </button>
                        <button onClick={() => removeFromCart(item._id)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg ml-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-slate-600">Total Order Value</span>
                    <span className="text-xl font-black text-slate-900">₹{calculateTotal()}</span>
                  </div>

                  <button 
                    onClick={handleCheckout}
                    disabled={submitting}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg flex items-center justify-center gap-2 text-sm"
                  >
                    <span>{submitting ? 'Submitting Order...' : 'Submit Replenishment Order'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}