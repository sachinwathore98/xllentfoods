'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, ArrowRight, User } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <img 
            src="/images/logo.png" 
            alt="Xllent Foods Logo" 
            className="h-10 w-auto object-contain group-hover:scale-105 transition duration-300" 
            onError={(e: any) => {
              // Fallback text if logo image is missing
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <span className="hidden text-xl font-black text-white tracking-tight">Xllent Foods</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-8 text-xs font-bold uppercase tracking-wider text-slate-300">
          <Link href="/" className="hover:text-amber-400 transition">Home</Link>
          <Link href="/about" className="hover:text-amber-400 transition">About Us</Link>
          <Link href="/vision" className="hover:text-amber-400 transition">Vision & Mission</Link>
          <Link href="/products" className="hover:text-amber-400 transition">Our Products</Link>
          <Link href="/partnership" className="hover:text-amber-400 transition">Partnership</Link>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/login" className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold rounded-xl text-xs transition flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-amber-500" />
            <span>Login</span>
          </Link>
          <Link href="/partnership" className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-amber-600/20 flex items-center gap-2">
            <span>Become a Partner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-slate-300 hover:text-white focus:outline-none">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-6 py-6 space-y-4 text-xs font-bold uppercase tracking-wider text-slate-300">
          <Link href="/" onClick={() => setIsOpen(false)} className="block hover:text-amber-400 transition">Home</Link>
          <Link href="/about" onClick={() => setIsOpen(false)} className="block hover:text-amber-400 transition">About Us</Link>
          <Link href="/vision" onClick={() => setIsOpen(false)} className="block hover:text-amber-400 transition">Vision & Mission</Link>
          <Link href="/products" onClick={() => setIsOpen(false)} className="block hover:text-amber-400 transition">Our Products</Link>
          <Link href="/partnership" onClick={() => setIsOpen(false)} className="block hover:text-amber-400 transition">Partnership</Link>
          <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
            <Link href="/login" onClick={() => setIsOpen(false)} className="py-3 bg-slate-800 text-center rounded-xl text-white">Login</Link>
            <Link href="/partnership" onClick={() => setIsOpen(false)} className="py-3 bg-amber-600 text-center rounded-xl text-white">Become a Partner</Link>
          </div>
        </div>
      )}
    </nav>
  );
}