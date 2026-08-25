'use client';
export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-12 px-6 border-t border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
          <img src="/images/logo.png" alt="Xllent Foods Logo" className="h-10 w-auto object-contain brightness-0 invert" />
        </div>
        <p className="text-xs text-slate-400 text-center md:text-left">
          © {new Date().getFullYear()} Xllent Foods (FMCG & Beyond). All rights reserved.
        </p>
        <div className="flex gap-6 text-xs text-slate-400">
          <a href="/login" className="hover:text-white transition">Partner Portal</a>
          <a href="/forgot-password" className="hover:text-white transition">Recovery</a>
        </div>
      </div>
    </footer>
  );
}