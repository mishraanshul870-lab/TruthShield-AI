import React, { useState } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { changeLanguage, currentLanguage } from '../i18n';

const LanguageSwitcher = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const activeLang = currentLanguage();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' }
  ];

  const handleLanguageChange = (lng) => {
    changeLanguage(lng);
    setOpen(false);
  };

  const activeLangObj = languages.find(l => l.code === activeLang) || languages[0];

  return (
    <div className="relative inline-block text-left select-none">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-4 py-2 bg-white/5 border border-white/5 hover:border-[#7C3AED]/40 rounded-xl hover:bg-white/10 transition-all font-sans text-xs font-bold text-slate-350"
      >
        <span className="text-slate-450 flex items-center gap-1.5">
          <Globe size={13} className="text-[#94A3B8]" />
          <span>{t('language') || 'Language:'}</span>
        </span>
        <span className="text-white flex items-center gap-1">
          <span>{activeLangObj.flag}</span>
          <span>{activeLangObj.name}</span>
        </span>
        <ChevronDown size={11} className="text-slate-500" />
      </button>

      {open && (
        <>
          {/* Backdrop transparent click interceptor */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          
          <div className="absolute right-0 mt-2 w-40 bg-[#12182D]/95 border border-white/10 rounded-2xl shadow-2xl py-1.5 z-20 backdrop-blur-[20px] animate-fadeIn">
            {languages.map((lng) => {
              const isSelected = activeLang === lng.code;
              return (
                <button
                  key={lng.code}
                  type="button"
                  onClick={() => handleLanguageChange(lng.code)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider transition-colors ${
                    isSelected 
                      ? 'text-[#A855F7] bg-white/5' 
                      : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{lng.flag}</span>
                    <span>{lng.name}</span>
                  </div>
                  {isSelected && <Check size={11} className="text-[#A855F7]" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;
