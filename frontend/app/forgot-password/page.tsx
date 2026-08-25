'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/app/lib/api';
import { KeyRound, Mail, Lock, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify & Reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await API.post('/auth/forgot-password', { email });
      setStep(2);
      setMessage('OTP sent successfully to your email via Brevo!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error sending OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await API.post('/auth/reset-password', { email, otp, newPassword });
      alert('Password reset successful! Please login with your new password.');
      router.push('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden p-8">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-amber-50 text-amber-600 rounded-2xl mb-3 shadow-sm">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Password Recovery</h2>
          <p className="text-xs text-slate-500 mt-1">Secure OTP Verification via Brevo</p>
        </div>

        {error && <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">{error}</div>}
        {message && <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">{message}</div>}

        {step === 1 ? (
          <form onSubmit={handleRequestOTP} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Registered Email</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="partner@xellent.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-amber-600 text-white font-bold rounded-xl shadow-lg hover:bg-amber-700 transition text-sm">
              {loading ? 'Sending OTP...' : 'Send Verification OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">6-Digit OTP Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">New Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-amber-600 text-white font-bold rounded-xl shadow-lg hover:bg-amber-700 transition text-sm">
              {loading ? 'Resetting...' : 'Verify & Change Password'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <a href="/login" className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition">
            ← Return to Login
          </a>
        </div>
      </div>
    </div>
  );
}