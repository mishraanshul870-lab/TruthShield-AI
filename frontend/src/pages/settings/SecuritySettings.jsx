import React, { useState } from 'react';
import { Lock, ShieldAlert, Monitor, Globe, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SecuritySettings = ({ currentPassword, setCurrentPassword, newPassword, setNewPassword, confirmPassword, setConfirmPassword, pwMsg, pwErr, handleUpdatePassword }) => {
  const { t } = useTranslation('settings');
  const navigate = useNavigate();
  const [sessionsCleared, setSessionsCleared] = useState(false);

  const handleLogoutAll = () => {
    setSessionsCleared(true);
    setTimeout(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('email');
      navigate('/login');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Change Password Panel */}
      <div className="glass-panel p-6 border-white/5 shadow-md">
        <h2 className="text-xs font-bold font-display text-white uppercase tracking-wider flex items-center gap-2 mb-4">
          <Lock size={15} className="text-rose-400" />
          <span>{t('cryptoPasswordReset')}</span>
        </h2>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-[9px] font-bold font-display uppercase tracking-wider text-slate-500 mb-2 pl-1">{t('currentPassword')}</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-cyber-primary/60 transition-colors"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-bold font-display uppercase tracking-wider text-slate-500 mb-2 pl-1">{t('newPassword')}</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-cyber-primary/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold font-display uppercase tracking-wider text-slate-500 mb-2 pl-1">{t('confirmNewPassword')}</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-cyber-primary/60 transition-colors"
              />
            </div>
          </div>

          {pwMsg && (
            <div className="p-2.5 bg-cyber-success/15 border border-[#6EE7B7]/25 text-cyber-success text-xs font-semibold rounded-xl text-center shadow-glow-green">
              {pwMsg}
            </div>
          )}
          {pwErr && (
            <div className="p-2.5 bg-rose-500/15 border border-rose-500/25 text-rose-450 text-xs font-semibold rounded-xl text-center shadow-glow-purple">
              {pwErr}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 hover:border-rose-500/40 text-rose-450 text-xs font-bold font-display uppercase tracking-wider transition-all"
          >
            {t('syncCredentials')}
          </button>
        </form>
      </div>

      {/* JWT Active Sessions Panel */}
      <div className="glass-panel p-6 border-white/5 shadow-md">
        <h2 className="text-xs font-bold font-display text-white uppercase tracking-wider flex items-center gap-2 mb-4">
          <ShieldAlert size={15} className="text-[#A855F7]" />
          <span>{t('activeSessions')}</span>
        </h2>
        
        <div className="space-y-4">
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 border border-white/5 rounded-xl text-slate-400">
                <Monitor size={16} className="text-cyber-secondary" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-200">{t('currentSessionActive')}</span>
                <span className="flex items-center gap-1 text-[9px] text-slate-500 uppercase font-semibold mt-0.5">
                  <Globe size={10} />
                  {t('localSystemIp')}
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-cyber-success/10 text-cyber-success border border-[#6EE7B7]/15 shadow-glow-green">
              {t('currentBadge')}
            </span>
          </div>

          {sessionsCleared ? (
            <div className="p-2.5 bg-rose-500/15 border border-rose-500/25 text-rose-450 text-xs font-semibold rounded-xl text-center shadow-glow-purple animate-pulse">
              {t('revokingSessions')}
            </div>
          ) : (
            <button
              onClick={handleLogoutAll}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-500/5 hover:bg-rose-500/10 border border-[#EF4444]/20 hover:border-rose-500/30 text-[#EF4444] text-[11px] font-bold font-display uppercase rounded-xl transition-all"
            >
              <LogOut size={13} />
              <span>{t('logoutAllDevices')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
