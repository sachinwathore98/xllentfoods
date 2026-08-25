'use client';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { Eye, Rocket, CheckCircle2 } from 'lucide-react';

export default function VisionMissionPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow">
        <div className="bg-slate-900 text-white py-24 px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <span className="bg-amber-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block">
              Strategic Roadmap
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">
              Our Vision & Mission
            </h1>
            <p className="text-slate-300 text-sm sm:text-base font-light">
              Guiding principles that drive our commitment to network profitability and consumer satisfaction.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-2xl group-hover:bg-amber-100 transition"></div>
              <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl w-fit mb-6 relative z-10">
                <Eye className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-4">Our Vision</h2>
              <p className="text-slate-600 text-sm leading-relaxed font-light mb-6">
                To build the most trusted, transparent, and technologically advanced FMCG distribution network globally—fostering long-term prosperity and unmatched market reach for every partner in our hierarchy.
              </p>
              <ul className="space-y-3 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600" /> Global supply chain integration</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-600" /> Complete operational transparency</li>
              </ul>
            </div>

            <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl group-hover:bg-blue-100 transition"></div>
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-6 relative z-10">
                <Rocket className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-4">Our Mission</h2>
              <p className="text-slate-600 text-sm leading-relaxed font-light mb-6">
                To consistently deliver superior quality food products that consumers love, while equipping our Super Stockists and Distributors with high profit margins, secure territories, and digital tools to scale effortlessly.
              </p>
              <ul className="space-y-3 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> High-margin partner rewards</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Uncompromising product quality standards</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}