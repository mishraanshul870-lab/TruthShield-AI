import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Lock, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import API_BASE from "../api";

const ResetPassword = () => {
  const { t } = useTranslation('auth');
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError(t('passwordMatchError'));
      return;
    }

    if (password.length < 6) {
      setError(t('passwordMinLength'));
      return;
    }

    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`${API_BASE}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('resetFailedMsg'));
      }

      setSuccess(t('resetSuccess'));
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Reset error:', err);
      if (err.name === 'AbortError') {
        setError('Security dispatcher timeout: Password reset request took too long. Please verify server connectivity.');
      } else {
        setError(err.message || t('resetFailedMsg'));
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-cyber-bg grid-bg">
      <div className="w-full max-w-md glass-panel p-8 border-[#4E2EF2]/10 relative shadow-glow-mixed">
        {/* Shield logo container */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyber-primary via-cyber-secondary to-cyber-success p-3 rounded-2xl text-[#0B0F1A] shadow-glow-purple border-2 border-white/5">
          <Shield size={28} className="stroke-[2.5]" />
        </div>

        <div className="text-center mt-4 mb-8">
          <h2 className="text-xl font-extrabold tracking-widest text-white font-display uppercase">
            {t('resetTitle')}
          </h2>
          <p className="text-[9px] text-slate-400 mt-1.5 uppercase font-bold tracking-widest leading-relaxed">
            {t('resetSubtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold leading-relaxed">
            {success}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold font-display uppercase tracking-wider text-slate-400 mb-2 pl-1">{t('newPassword')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 pl-10 pr-10 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-cyber-primary/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-355 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold font-display uppercase tracking-wider text-slate-400 mb-2 pl-1">{t('confirmPassword')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 pl-10 pr-10 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-cyber-primary/60 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 rounded-xl gradient-btn font-display uppercase tracking-wider text-xs shadow-glow-purple flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="animate-spin text-[#0B0F1A]" />
                  <span>{t('configuring')}</span>
                </>
              ) : (
                <span>{t('saveNewPasswordBtn')}</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
