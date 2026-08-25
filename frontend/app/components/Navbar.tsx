'use client';
export default function Navbar() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/images/logo.png" alt="Xellent Food Products Logo" className="h-12 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-4">
          <a href="/login" className="text-xs font-bold text-slate-700 hover:text-amber-600 transition">Partner Login</a>
          <a href="/#partner-section" className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition text-xs">
            Become a Partner
          </a>
        </div>
      </div>
    </header>
  );
}