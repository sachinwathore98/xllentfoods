'use client';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { Award, Globe2, ShieldCheck, Target } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Banner */}
        <div className="bg-slate-900 text-white py-24 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="max-w-3xl mx-auto relative z-10 animate-fade-in">
            <span className="bg-amber-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block">
              Corporate Heritage
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight mb-4">
              Pioneering Excellence in FMCG & Beyond
            </h1>
            <p className="text-slate-300 text-sm sm:text-base font-light">
              Building a robust, transparent, and technology-driven multi-tier distribution ecosystem.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-6">
                Who We Are
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-light mb-4">
                Xllent Foods is a dynamic leader in the consumer packaged goods industry. We specialize in manufacturing and distributing exceptional confectionery, premium snacks, and daily household essentials that delight consumers nationwide.
              </p>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-light">
                Our cutting-edge B2B Digital Management System (DMS) seamlessly connects manufacturers with Super Stockists, regional Distributors, and local retail stores, eliminating supply chain friction.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center hover:scale-105 transition duration-300">
                <Globe2 className="w-10 h-10 text-amber-600 mx-auto mb-3" />
                <h4 className="font-extrabold text-2xl text-slate-900">500+</h4>
                <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Partner Network</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center hover:scale-105 transition duration-300">
                <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                <h4 className="font-extrabold text-2xl text-slate-900">100%</h4>
                <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Quality Assured</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center hover:scale-105 transition duration-300">
                <Target className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <h4 className="font-extrabold text-2xl text-slate-900">24/7</h4>
                <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Live Tracking</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center hover:scale-105 transition duration-300">
                <Award className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                <h4 className="font-extrabold text-2xl text-slate-900">Top Tier</h4>
                <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">FMCG Brand</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}