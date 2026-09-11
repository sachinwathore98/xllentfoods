'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, DollarSign, Users, ShoppingCart, UserPlus, Megaphone, HelpCircle } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', href: '/dashboard/overview', icon: LayoutDashboard },
    { name: 'Inventory & Catalog', href: '/dashboard/inventory', icon: Package },
    { name: 'Downstream Pricing', href: '/dashboard/pricing', icon: DollarSign },
    { name: 'Partnership Enquiries', href: '/dashboard/enquiries', icon: Users },
    { name: 'Smart Orders & Fulfillment', href: '/dashboard/orders', icon: ShoppingCart },
    { name: 'Provision Shop / User', href: '/dashboard/users/create', icon: UserPlus },
    { name: 'Advertisement Banners', href: '/dashboard/ads', icon: Megaphone },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col justify-between hidden md:flex border-r border-slate-800 shrink-0 min-h-screen">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight">Xllent Foods</h2>
          <p className="text-[10px] text-amber-500 uppercase tracking-widest mt-0.5 font-bold">DMS Portal</p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-6 border-t border-slate-900">
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}
          className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold rounded-xl text-xs transition text-center block cursor-pointer border border-rose-500/20"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}