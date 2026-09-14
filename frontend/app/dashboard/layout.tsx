'use client';
import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';

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

      // --- STRICT ROLE-BASED ROUTE GUARDING ---
      const adminOnlyPaths = ['/dashboard/enquiries', '/dashboard/pricing', '/dashboard/ads'];
      const shopOrEmployeeRestricted = ['/dashboard/inventory', '/dashboard/pricing', '/dashboard/enquiries', '/dashboard/ads'];

      if (['shop'].includes(user.role) && shopOrEmployeeRestricted.some(path => pathname?.startsWith(path))) {
        router.push('/dashboard/orders');
      }

      if (['employee'].includes(user.role) && ['/dashboard/inventory', '/dashboard/pricing', '/dashboard/enquiries', '/dashboard/overview', '/dashboard/ads'].some(path => pathname?.startsWith(path))) {
        router.push('/dashboard/orders');
      }

      if (['super_stockist', 'distributor'].includes(user.role) && adminOnlyPaths.some(path => pathname?.startsWith(path))) {
        router.push('/dashboard/overview');
      }

    } catch (e) {
      router.push('/login');
    }
  }, [router, pathname]);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Compact Interactive Sidebar Component */}
      <Sidebar role={userRole} />

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}