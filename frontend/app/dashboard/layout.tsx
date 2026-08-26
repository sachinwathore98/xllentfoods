'use client';
import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface UserProfile {
  name: string;
  role: string;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const user: UserProfile = JSON.parse(userStr);
      setUserRole(user.role);
      setUserName(user.name);

      // --- ROLE-BASED ROUTE GUARDING ---
      // Restrict lower-tier roles (shop, employee) from accessing admin-only pages
      const adminOnlyPaths = ['/dashboard/pricing', '/dashboard/enquiries', '/dashboard/users/create'];
      const restrictedForLowTiers = ['shop', 'employee'];

      if (restrictedForLowTiers.includes(user.role) && adminOnlyPaths.some(path => pathname?.startsWith(path))) {
        router.push('/dashboard/orders'); // Redirect unauthorized roles to their allowed orders portal
      }

    } catch (e) {
      router.push('/login');
    }
  }, [router, pathname]);

  const navLinks = [
    { name: 'Overview', href: '/dashboard/overview', roles: ['superadmin', 'admin', 'super_stockist', 'distributor'] },
    { name: 'Inventory & Stock', href: '/dashboard/inventory', roles: ['superadmin', 'admin', 'super_stockist'] },
    { name: 'Pricing Tiers', href: '/dashboard/pricing', roles: ['superadmin', 'admin'] },
    { name: 'Partnership Enquiries', href: '/dashboard/enquiries', roles: ['superadmin', 'admin'] },
    { name: 'Orders & Fulfillment', href: '/dashboard/orders', roles: ['superadmin', 'admin', 'super_stockist', 'distributor', 'shop', 'employee'] },
    { name: 'Create Downline User', href: '/dashboard/users/create', roles: ['superadmin', 'admin', 'super_stockist', 'distributor'] },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="mb-8">
            <h2 className="text-xl font-black text-amber-500">Xllent Foods</h2>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Portal: {userRole || 'Loading...'}</p>
          </div>
          <nav className="space-y-2">
            {navLinks
              .filter(link => !userRole || link.roles.includes(userRole))
              .map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === link.href ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {link.name}
                </a>
              ))}
          </nav>
        </div>

        <div className="border-t border-slate-800 pt-4">
          <p className="text-xs font-medium text-slate-300">{userName}</p>
          <button 
            onClick={() => { localStorage.clear(); router.push('/login'); }}
            className="mt-2 text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}