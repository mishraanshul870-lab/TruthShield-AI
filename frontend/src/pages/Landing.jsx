import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Eye, ShieldAlert, Cpu, Globe, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Landing = () => {
  const { t } = useTranslation();
  const token = localStorage.getItem('token');

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between grid-bg bg-cyber-bg">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 flex-grow">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyber-primary/25 bg-cyber-primary/5 text-cyber-success text-xs font-bold font-display uppercase tracking-widest mb-8 shadow-glow-purple">
            <Shield size={13} className="text-cyber-success" />
            <span>{t('landing.shieldEnabled')}</span>
          </div>

          <h1 className="text-4xl sm:text-7xl font-extrabold font-display tracking-tight text-white mb-6 leading-[1.15]">
            {t('landing.heroTitle')}
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 font-medium leading-relaxed mb-12">
            {t('landing.heroDesc')}
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            {token ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold font-display uppercase tracking-wider text-xs gradient-btn shadow-glow-purple transition-all"
              >
                <span>{t('landing.dashboardBtn')}</span>
                <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold font-display uppercase tracking-wider text-xs gradient-btn shadow-glow-purple transition-all"
                >
                  <span>{t('landing.loginBtn')}</span>
                  <ArrowRight size={15} />
                </Link>
                <a
                  href="#features"
                  className="px-6 py-3.5 rounded-2xl font-bold font-display uppercase tracking-wider text-xs bg-[#121829]/60 border border-white/5 hover:bg-white/10 hover:border-white/10 text-white transition-all shadow-md"
                >
                  {t('landing.featuresBtn')}
                </a>
              </>
            )}
          </div>
        </div>

        {/* Feature Cards Grid (Translucent glass panels with glowing parameters) */}
        <div id="features" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-24 pt-12 border-t border-white/5">
          {/* Card 1 */}
          <div className="glass-panel p-6 border-white/5 shadow-glow-purple hover:border-[#4E2EF2]/30 hover:scale-[1.02] duration-300">
            <div className="p-3 w-fit rounded-xl bg-cyber-primary/10 text-cyber-secondary border border-cyber-primary/20 mb-5">
              <Eye size={22} />
            </div>
            <h3 className="text-base font-bold font-display text-white mb-2 uppercase tracking-wide">{t('landing.feature1Title')}</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              {t('landing.feature1Desc')}
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-6 border-white/5 shadow-glow-violet hover:border-[#A855F7]/30 hover:scale-[1.02] duration-300">
            <div className="p-3 w-fit rounded-xl bg-cyber-secondary/10 text-cyber-secondary border border-cyber-secondary/20 mb-5">
              <Cpu size={22} />
            </div>
            <h3 className="text-base font-bold font-display text-white mb-2 uppercase tracking-wide">{t('landing.feature2Title')}</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              {t('landing.feature2Desc')}
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-6 border-white/5 shadow-glow-green hover:border-[#6EE7B7]/30 hover:scale-[1.02] duration-300">
            <div className="p-3 w-fit rounded-xl bg-cyber-success/10 text-cyber-success border border-[#6EE7B7]/20 mb-5">
              <ShieldAlert size={22} />
            </div>
            <h3 className="text-base font-bold font-display text-white mb-2 uppercase tracking-wide">{t('landing.feature3Title')}</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              {t('landing.feature3Desc')}
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-panel p-6 border-white/5 shadow-glow-mixed hover:border-white/10 hover:scale-[1.02] duration-300">
            <div className="p-3 w-fit rounded-xl bg-white/5 text-slate-300 border border-white/10 mb-5">
              <Globe size={22} />
            </div>
            <h3 className="text-base font-bold font-display text-white mb-2 uppercase tracking-wide">{t('landing.feature4Title')}</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              {t('landing.feature4Desc')}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-white/5 bg-[#0B0F1A]/80 text-center text-[10px] font-display font-bold uppercase tracking-widest text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>{t('landing.footerText')}</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-400 cursor-pointer">{t('landing.protocol')}</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">{t('landing.clearance')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
