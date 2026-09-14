'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, Package, Boxes, DollarSign, Users, ShoppingCart, UserPlus, Megaphone } from 'lucide-react';

interface SidebarProps {
  role?: string;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  const allNavItems = [
    { name: 'Overview', href: '/dashboard/overview', icon: LayoutDashboard, roles: ['superadmin', 'admin', 'super_stockist', 'distributor'] },
    { name: 'Inventory & Catalog', href: '/dashboard/inventory', icon: Package, roles: ['superadmin', 'admin'] },
    { name: 'Stock Management', href: '/dashboard/inventory/stocks', icon: Boxes, roles: ['superadmin', 'admin', 'super_stockist', 'distributor', 'shop', 'employee'] },
    { name: 'Downstream Pricing', href: '/dashboard/pricing', icon: DollarSign, roles: ['superadmin', 'admin', 'super_stockist'] }, // Added super_stockist here
    { name: 'Partnership Enquiries', href: '/dashboard/enquiries', icon: Users, roles: ['superadmin', 'admin'] },
    { name: 'Smart Orders & Fulfillment', href: '/dashboard/orders', icon: ShoppingCart, roles: ['superadmin', 'admin', 'super_stockist', 'distributor', 'shop', 'employee'] },
    { name: 'Provision Shop / User', href: '/dashboard/users/create', icon: UserPlus, roles: ['superadmin', 'admin', 'super_stockist', 'distributor', 'employee'] },
    { name: 'Advertisement Banners', href: '/dashboard/ads', icon: Megaphone, roles: ['superadmin', 'admin'] },
  ];

  const filteredNavItems = allNavItems.filter(item => !role || item.roles.includes(role));

  return (
    <aside 
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`group relative bg-slate-950 text-slate-300 flex flex-col justify-between hidden md:flex border-r border-slate-800/80 shrink-0 min-h-screen transition-all duration-300 ease-in-out z-40 shadow-2xl ${
        isExpanded ? 'w-64' : 'w-20'
      }`}
    >
      <div className="p-4 sm:p-5 space-y-6 overflow-hidden">
        <div className="flex items-center gap-3 px-1">
          <div className="w-10 h-10 rounded-2xl bg-white/10 p-1.5 flex items-center justify-center shrink-0 border border-slate-800 shadow-inner">
            <img src="/images/logo.png" alt="Xllent Foods Logo" className="w-full h-full object-contain" />
          </div>
          <div className={`transition-opacity duration-300 whitespace-nowrap overflow-hidden ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
            <h2 className="text-base font-black text-white tracking-tight leading-none">Xllent Foods</h2>
            <p className="text-[9px] text-amber-500 uppercase tracking-widest mt-1 font-extrabold">Portal: {role || 'User'}</p>
          </div>
        </div>

        <nav className="space-y-1.5">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 relative group/item ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25 scale-[1.02]'
                    : 'text-slate-400 hover:bg-slate-900/90 hover:text-white hover:translate-x-1'
                }`}
                title={!isExpanded ? item.name : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-amber-500 group-hover/item:text-amber-400'}`} />
                <span className={`whitespace-nowrap transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                  {item.name}
                </span>

                {!isExpanded && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-2xl opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-slate-700">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 sm:p-5 border-t border-slate-900/80 space-y-3 overflow-hidden bg-slate-950/50 backdrop-blur-md">
        <div className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
          <div className="px-3 py-2 bg-slate-900/80 rounded-xl border border-slate-800/80">
            <span className="text-[9px] uppercase font-bold text-slate-500 block">Active Status</span>
            <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">{role || 'Authenticated'}</span>
          </div>
        </div>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}
          className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold rounded-xl text-xs transition text-center block cursor-pointer border border-rose-500/20 truncate"
          title="Sign Out"
        >
          {isExpanded ? 'Sign Out' : '⏻'}
        </button>
      </div>
    </aside>
  );
}