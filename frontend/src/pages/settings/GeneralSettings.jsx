import React, { useState } from 'react';
import { Server, Bell, RefreshCw, Sliders, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const GeneralSettings = ({ checkHealth, isSyncing, backendStatus }) => {
  const { t } = useTranslation('settings');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [desktopBanner, setDesktopBanner] = useState(false);
  const [soundFX, setSoundFX] = useState(true);

  const [autoClear, setAutoClear] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [sandboxMode, setSandboxMode] = useState(true);

  return (
    <div className="space-y-6">

      {/* Language Preferences Panel */}
      <div className="glass-panel p-6 border-white/5 shadow-md">
        <h2 className="text-xs font-bold font-display text-white uppercase tracking-wider flex items-center gap-2 mb-4">
          <Globe size={15} className="text-emerald-400" />
          <span>{t('languagePreferences')}</span>
        </h2>
        <div className="flex items-center justify-between py-2">
          <div>
            <span className="text-xs text-slate-200 font-bold block">{t('systemDisplayLanguage')}</span>
            <span className="text-[9px] text-slate-500 uppercase font-semibold">{t('languageSub')}</span>
          </div>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Notifications Controls Panel */}
      <div className="glass-panel p-6 border-white/5 shadow-md">
        <h2 className="text-xs font-bold font-display text-white uppercase tracking-wider flex items-center gap-2 mb-4">
          <Bell size={15} className="text-cyber-primary" />
          <span>{t('threatAlerts')}</span>
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div>
              <span className="text-xs text-slate-200 font-bold block">{t('emailNotifications')}</span>
              <span className="text-[9px] text-slate-500 uppercase font-semibold">{t('emailNotificationsSub')}</span>
            </div>
            <button 
              onClick={() => setEmailAlerts(!emailAlerts)}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${emailAlerts ? 'bg-[#7C3AED]' : 'bg-slate-800'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${emailAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div>
              <span className="text-xs text-slate-200 font-bold block">{t('desktopBannerAlerts')}</span>
              <span className="text-[9px] text-slate-500 uppercase font-semibold">{t('desktopBannerAlertsSub')}</span>
            </div>
            <button 
              onClick={() => setDesktopBanner(!desktopBanner)}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${desktopBanner ? 'bg-[#7C3AED]' : 'bg-slate-800'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${desktopBanner ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <span className="text-xs text-slate-200 font-bold block">{t('soundFxIndicator')}</span>
              <span className="text-[9px] text-slate-500 uppercase font-semibold">{t('soundFxIndicatorSub')}</span>
            </div>
            <button 
              onClick={() => setSoundFX(!soundFX)}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${soundFX ? 'bg-[#7C3AED]' : 'bg-slate-800'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${soundFX ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Preferences System Toggles */}
      <div className="glass-panel p-6 border-white/5 shadow-md">
        <h2 className="text-xs font-bold font-display text-white uppercase tracking-wider flex items-center gap-2 mb-4">
          <Sliders size={15} className="text-[#A855F7]" />
          <span>{t('uiPreferences')}</span>
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div>
              <span className="text-xs text-slate-200 font-bold block">{t('autoHistoryClears')}</span>
              <span className="text-[9px] text-slate-500 uppercase font-semibold">{t('autoHistoryClearsSub')}</span>
            </div>
            <button 
              onClick={() => setAutoClear(!autoClear)}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${autoClear ? 'bg-cyan-500' : 'bg-slate-800'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${autoClear ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div>
              <span className="text-xs text-slate-200 font-bold block">{t('highContrastMode')}</span>
              <span className="text-[9px] text-slate-500 uppercase font-semibold">{t('highContrastModeSub')}</span>
            </div>
            <button 
              onClick={() => setHighContrast(!highContrast)}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${highContrast ? 'bg-cyan-500' : 'bg-slate-800'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${highContrast ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <span className="text-xs text-slate-200 font-bold block">{t('aiSandboxIsolation')}</span>
              <span className="text-[9px] text-slate-500 uppercase font-semibold">{t('aiSandboxIsolationSub')}</span>
            </div>
            <button 
              onClick={() => setSandboxMode(!sandboxMode)}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${sandboxMode ? 'bg-cyan-500' : 'bg-slate-800'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${sandboxMode ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Diagnostic Node Feeds */}
      <div className="glass-panel p-6 border-white/5 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold font-display text-white uppercase tracking-wider flex items-center gap-2">
            <Server size={15} className="text-[#6EE7B7]" />
            <span>{t('diagnosticNodeFeeds')}</span>
          </h2>
          <button 
            onClick={checkHealth}
            disabled={isSyncing}
            className="text-slate-500 hover:text-white transition-colors"
            type="button"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">{t('apiDestinationLink')}</span>
            <span className="text-slate-350 font-mono text-[11px]">http://localhost:5000</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">{t('registryFeedStatus')}</span>
            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
              backendStatus.includes('Operational') 
                ? 'bg-cyber-success/10 text-cyber-success border-[#6EE7B7]/15 shadow-glow-green' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/15 shadow-glow-purple'
            }`}>
              {backendStatus.includes('Operational') ? t('operationalOnline') :
               backendStatus.includes('Degraded') ? t('degradedHttpError') :
               backendStatus.includes('Offline') ? t('offlineConnectionRefused') : t('checking')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
