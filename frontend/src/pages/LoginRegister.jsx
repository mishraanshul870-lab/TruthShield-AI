import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE from "../api";
import { Shield, Mail, Lock, User, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LoginRegister = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    if (isForgot) {
      try {
        const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: formData.email }),
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Forgot password request failed');
        }

        setSuccess(`Reset link generated! Link: ${data.resetLink || 'sent to console'}`);
      } catch (err) {
        console.error('Forgot password error:', err);
        if (err.name === 'AbortError') {
          setError('Security dispatcher timeout: Reset link request took too long. Please verify server connectivity.');
        } else {
          setError(err.message || 'Verification link dispatch failed.');
        }
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
      return;
    }

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin
      ? { email: formData.email, password: formData.password }
      : { username: formData.username, email: formData.email, password: formData.password };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      localStorage.setItem('email', data.email);
      window.dispatchEvent(new Event('auth-change'));

      navigate('/dashboard');
    } catch (err) {
      console.error('Auth error:', err);
      if (err.name === 'AbortError') {
        setError('Security dispatcher timeout: Portal authentication took too long. Please verify server connectivity.');
      } else {
        setError(err.message || 'Portal authentication failure. Make sure server is running.');
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
            {isForgot ? t('forgotSecureAccess') : isLogin ? t('shieldPortalAccess') : t('initializeCredentials')}
          </h2>
          <p className="text-[9px] text-slate-400 mt-1.5 uppercase font-bold tracking-widest leading-relaxed">
            {isForgot ? t('forgotSubtitle') : isLogin ? t('loginSubtitle') : t('registerSubtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold leading-relaxed break-all">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isForgot && !isLogin && (
            <div>
              <label className="block text-[10px] font-bold font-display uppercase tracking-wider text-slate-400 mb-2 pl-1">{t('username')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User size={15} />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required={!isLogin && !isForgot}
                  placeholder="agent_shield"
                  className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-cyber-primary/60 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold font-display uppercase tracking-wider text-slate-400 mb-2 pl-1">{t('emailAddress')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail size={15} />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="agent@truthshield.ai"
                className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-cyber-primary/60 transition-colors"
              />
            </div>
          </div>

          {!isForgot && (
            <div>
              <div className="flex justify-between items-center mb-2 pl-1">
                <label className="block text-[10px] font-bold font-display uppercase tracking-wider text-slate-400">{t('password')}</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => { setIsForgot(true); setError(''); setSuccess(''); }}
                    className="text-[9px] text-slate-500 hover:text-cyber-secondary uppercase font-bold tracking-wider"
                  >
                    {t('forgotLink')}
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!isForgot}
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
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 rounded-xl gradient-btn font-display uppercase tracking-wider text-xs shadow-glow-purple flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw size={15} className="animate-spin text-[#0B0F1A]" />
                <span>{t('syncing')}</span>
              </>
            ) : (
              <span>{isForgot ? t('requestResetBtn') : isLogin ? t('requestEntryBtn') : t('initializeShieldBtn')}</span>
            )}
          </button>
        </form>

        <div className="text-center mt-6 flex flex-col gap-2">
          {isForgot ? (
            <button
              type="button"
              onClick={() => { setIsForgot(false); setIsLogin(true); setError(''); setSuccess(''); }}
              className="text-[10px] text-slate-500 hover:text-cyber-success uppercase tracking-widest font-bold transition-colors"
            >
              {t('backToEntry')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
              className="text-[10px] text-slate-500 hover:text-cyber-success uppercase tracking-widest font-bold transition-colors"
            >
              {isLogin ? t('needClearance') : t('haveClearance')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;
