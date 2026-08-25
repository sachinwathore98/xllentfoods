'use client';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { TrendingUp, ShieldCheck, Users, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function PartnershipPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow">
        <div className="bg-slate-900 text-white py-24 px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <span className="bg-amber-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block">
              Lucrative B2B Opportunity
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">
              Scale Your Distribution Business
            </h1>
            <p className="text-slate-300 text-sm sm:text-base font-light">
              Partner with Xllent Foods as a Super Stockist or Distributor and dominate your regional market with massive profit margins.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:border-amber-400 transition duration-300">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl w-fit mb-6"><TrendingUp className="w-8 h-8" /></div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">High Profit Margins</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Enjoy industry-leading margins designed specifically to ensure rapid ROI and substantial earnings for both Super Stockists and Distributors.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Tiered wholesale pricing</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Volume incentive bonuses</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:border-amber-400 transition duration-300">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-6"><ShieldCheck className="w-8 h-8" /></div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">Exclusive Territory Rights</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Secure protected operating zones for Super Stockists, ensuring zero internal channel conflict and complete regional market capture.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Protected regional distribution</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Direct brand marketing backing</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:border-amber-400 transition duration-300">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-6"><Users className="w-8 h-8" /></div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">Complete Downline Control</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Easily provision and manage your retail shops and subordinate distributors using our advanced digital management portal.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Instant digital credential generation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Real-time order tracking</li>
              </ul>
            </div>
          </div>

          <div className="bg-amber-600 text-white rounded-3xl p-10 sm:p-16 text-center shadow-xl relative overflow-hidden">
            <div className="max-w-2xl mx-auto relative z-10">
              <h2 className="text-3xl font-black mb-4">Ready to Grow Your Enterprise?</h2>
              <p className="text-sm sm:text-base text-amber-100 font-light mb-8">
                Log into your portal or contact our admin team to initiate your regional partnership verification today.
              </p>
              <a href="/login" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-amber-900 font-bold rounded-2xl shadow-lg hover:bg-amber-50 transition text-sm">
                <span>Access Partner Portal</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}