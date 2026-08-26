'use client';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        <div className="space-y-4 md:col-span-1">
          {/* Footer Logo */}
          <Link href="/" className="flex items-center gap-3">
            <img 
              src="/images/logo.png" 
              alt="Xllent Foods Logo" 
              className="h-10 w-auto object-contain" 
              onError={(e: any) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <span className="hidden text-xl font-black text-white tracking-tight">Xllent Foods</span>
          </Link>
          <p className="text-xs text-slate-500 leading-relaxed font-light">
            Empowering regional distribution networks and delivering premium FMCG products across multi-tier supply chains.
          </p>
        </div>

        <div>
          <h4 className="text-white font-extrabold text-xs uppercase tracking-widest mb-4">Quick Links</h4>
          <ul className="space-y-2.5 text-xs">
            <li><Link href="/" className="hover:text-amber-400 transition">Home</Link></li>
            <li><Link href="/about" className="hover:text-amber-400 transition">About Us</Link></li>
            <li><Link href="/vision" className="hover:text-amber-400 transition">Vision & Mission</Link></li>
            <li><Link href="/products" className="hover:text-amber-400 transition">Our Products</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-extrabold text-xs uppercase tracking-widest mb-4">Partnership</h4>
          <ul className="space-y-2.5 text-xs">
            <li><Link href="/partnership" className="hover:text-amber-400 transition">Become a Super Stockist</Link></li>
            <li><Link href="/partnership" className="hover:text-amber-400 transition">Become a Distributor</Link></li>
            <li><Link href="/login" className="hover:text-amber-400 transition">Partner Portal Login</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-extrabold text-xs uppercase tracking-widest mb-4">Contact & Support</h4>
          <p className="text-xs text-slate-500 leading-relaxed mb-2">
            <b>Email:</b> xllentfoods91@gmail.com
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            <b>Region:</b> Chhatrapati Sambhajinagar, Maharashtra
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 border-t border-slate-900 pt-8 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-600">
        <p>&copy; {new Date().getFullYear()} Xllent Foods. All rights reserved.</p>
        <p className="mt-2 sm:mt-0">Distribution Management System (DMS)</p>
      </div>
    </footer>
  );
}