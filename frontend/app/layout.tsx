import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'XLLENT Food Products | Distribution Management System',
  description: 'B2B Distribution & Partner Network',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-800 antialiased font-sans">{children}</body>
    </html>
  );
}