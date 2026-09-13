'use client';
import { useState } from 'react';
import { Menu, X, LogIn, UserPlus, ShoppingBag } from 'lucide-react';

interface NavbarProps {
  cartCount?: number;
  onOpenCart?: () => void;
}

export default function Navbar({ cartCount = 0, onOpenCart }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-[95rem] mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        {/* Logo / Brand */}
        <a href="/" className="flex items-center gap-2 group">
          {!imgError ? (
            <img 
              src="/images/logo.png" 
              alt="Xllent Foods Logo" 
              className="h-12 sm:h-14 w-auto object-contain group-hover:scale-105 transition duration-300"
              onError={() => setImgError(true)}
            />
          ) : null}
          <span className={`${!imgError ? 'hidden sm:inline-block' : 'inline-block'} text-lg sm:text-xl font-black text-slate-900 tracking-tight`}>
            XLLENT FOODS
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-8 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <a href="/about" className="hover:text-amber-600 transition">About Us</a>
          <a href="/vision-mission" className="hover:text-amber-600 transition">Vision & Mission</a>
          <a href="/products" className="hover:text-amber-600 transition">Our Products</a>
          <a href="/partnership" className="hover:text-amber-600 transition">Partnership</a>
        </div>

        {/* Action Buttons & Cart Icon */}
        <div className="flex items-center gap-3">
          {/* Cart Toggle Button for Full Screen */}
          {onOpenCart && (
            <button 
              onClick={onOpenCart}
              className="relative p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-2xl transition flex items-center justify-center cursor-pointer border border-amber-200 shadow-sm"
              title="View Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          <div className="hidden md:flex items-center gap-3">
            <a 
              href="/login" 
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition text-xs flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </a>
            <a 
              href="/partnership" 
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition text-xs flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Become a Partner</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="text-slate-700 p-2 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-3 text-xs font-bold uppercase tracking-wider">
          <a href="/about" onClick={() => setIsOpen(false)} className="block text-slate-700 hover:text-amber-600 py-1">About Us</a>
          <a href="/vision-mission" onClick={() => setIsOpen(false)} className="block text-slate-700 hover:text-amber-600 py-1">Vision & Mission</a>
          <a href="/products" onClick={() => setIsOpen(false)} className="block text-slate-700 hover:text-amber-600 py-1">Our Products</a>
          <a href="/partnership" onClick={() => setIsOpen(false)} className="block text-slate-700 hover:text-amber-600 py-1">Partnership</a>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <a href="/login" className="w-full py-3 bg-slate-100 text-slate-800 font-bold rounded-xl text-center flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4" /> Login
            </a>
            <a href="/partnership" className="w-full py-3 bg-amber-600 text-white font-bold rounded-xl text-center flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" /> Become a Partner
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}