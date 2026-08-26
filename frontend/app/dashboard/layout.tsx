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

      // --- STRICT ROLE-BASED ROUTE GUARDING ---
      const adminOnlyPaths = ['/dashboard/enquiries', '/dashboard/pricing'];
      const shopOrEmployeeRestricted = ['/dashboard/inventory', '/dashboard/pricing', '/dashboard/enquiries'];

      if (['shop'].includes(user.role) && shopOrEmployeeRestricted.some(path => pathname?.startsWith(path))) {
        router.push('/dashboard/orders');
      }

      if (['employee'].includes(user.role) && ['/dashboard/inventory', '/dashboard/pricing', '/dashboard/enquiries', '/dashboard/overview'].some(path => pathname?.startsWith(path))) {
        router.push('/dashboard/orders');
      }

      if (['super_stockist', 'distributor'].includes(user.role) && adminOnlyPaths.some(path => pathname?.startsWith(path))) {
        router.push('/dashboard/overview');
      }

    } catch (e) {
      router.push('/login');
    }
  }, [router, pathname]);

  // Role-Specific Navigation Link Matrix
  const navLinks = [
    { name: 'Overview', href: '/dashboard/overview', roles: ['superadmin', 'admin', 'super_stockist', 'distributor'] },
    { name: 'Inventory & Catalog', href: '/dashboard/inventory', roles: ['superadmin', 'admin', 'super_stockist', 'distributor'] },
    { name: 'Downstream Pricing', href: '/dashboard/pricing', roles: ['superadmin', 'admin', 'super_stockist', 'distributor'] },
    { name: 'Partnership Enquiries', href: '/dashboard/enquiries', roles: ['superadmin', 'admin'] },
    { name: 'Smart Orders & Fulfillment', href: '/dashboard/orders', roles: ['superadmin', 'admin', 'super_stockist', 'distributor', 'shop', 'employee'] },
    { name: 'Provision Shop / User', href: '/dashboard/users/create', roles: ['superadmin', 'admin', 'super_stockist', 'distributor', 'employee'] },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col justify-between hidden md:flex shadow-xl">
        <div>
          <div className="mb-8">
            <h2 className="text-xl font-black text-amber-500 tracking-wider">Xllent Foods</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Portal: {userRole || 'Loading...'}</p>
          </div>
          <nav className="space-y-1.5">
            {navLinks
              .filter(link => !userRole || link.roles.includes(userRole))
              .map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`block px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    pathname === link.href ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {link.name}
                </a>
              ))}
          </nav>
        </div>

        <div className="border-t border-slate-800 pt-4">
          <p className="text-xs font-bold text-white truncate">{userName}</p>
          <button 
            onClick={() => { localStorage.clear(); router.push('/login'); }}
            className="mt-2 text-xs text-rose-400 hover:text-rose-300 font-bold cursor-pointer transition"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}