import React from 'react';
import { User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const ProfileSettings = ({ username, setUsername, email, setEmail, profileMsg, profileErr, handleUpdateProfile }) => {
  const { t } = useTranslation('profile');
  const initialLetter = username ? username[0].toUpperCase() : 'A';

  return (
    <div className="glass-panel p-6 border-white/5 shadow-md">
      <h2 className="text-xs font-bold font-display text-white uppercase tracking-wider flex items-center gap-2 mb-6">
        <User size={15} className="text-cyan-400" />
        <span>{t('pageTitle')}</span>
      </h2>

      {/* Avatar display section */}
      <div className="flex items-center gap-5 mb-8 pb-6 border-b border-white/5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center text-2xl font-black text-white font-mono uppercase shadow-[0_0_20px_rgba(124,58,237,0.3)]">
          {initialLetter}
        </div>
        <div>
          <span className="block text-xs font-bold text-white uppercase tracking-wider">{t('profileEntity')}</span>
          <span className="text-[9px] text-slate-500 uppercase font-semibold mt-0.5 block">{t('profileEntitySub')}</span>
        </div>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] font-bold font-display uppercase tracking-wider text-slate-500 mb-2 pl-1">{t('username')}</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-cyber-primary/60 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold font-display uppercase tracking-wider text-slate-500 mb-2 pl-1">{t('emailAddress')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-cyber-primary/60 transition-colors"
            />
          </div>
        </div>

        {/* Profile Language Selection */}
        <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="block text-xs font-bold text-white uppercase tracking-wider">{t('interfaceLanguage')}</span>
            <span className="text-[8px] text-slate-500 uppercase font-semibold mt-0.5 block">{t('languageSub')}</span>
          </div>
          <LanguageSwitcher />
        </div>

        {profileMsg && (
          <div className="p-2.5 bg-cyber-success/15 border border-[#6EE7B7]/25 text-cyber-success text-xs font-semibold rounded-xl text-center shadow-glow-green">
            {t(profileMsg) || profileMsg}
          </div>
        )}
        {profileErr && (
          <div className="p-2.5 bg-rose-500/15 border border-rose-500/25 text-rose-450 text-xs font-semibold rounded-xl text-center shadow-glow-purple">
            {t(profileErr) || profileErr}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 font-display uppercase tracking-wider text-xs font-bold transition-all"
        >
          {t('updateProfileButton')}
        </button>
      </form>
    </div>
  );
};

export default ProfileSettings;
