import React, { useState } from 'react';
import { Search, Bell, ChevronDown, LogOut, User, Settings, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const Topbar = ({ onMenuClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Agent';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const notifications = [];
  const [notifOpen, setNotifOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    window.dispatchEvent(new Event('auth-change'));
    navigate('/login');
  };

  return (
    <header className="h-16 bg-[#12182D]/72 border-b border-white/8 flex items-center justify-between px-6 sticky top-0 z-30 backdrop-blur-[20px] shadow-sm select-none">
      <div className="flex items-center">
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-450 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 lg:hidden mr-4"
        >
          <Menu size={16} />
        </button>

        {/* Search Bar */}
        <div className="relative w-40 sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search size={14} className="text-[#94A3B8]" />
          </div>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            className="w-full bg-white/[0.02] border border-white/5 focus:border-[#7C3AED]/40 rounded-xl py-2 pl-9 pr-4 text-[12px] text-white placeholder-[#94A3B8] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex items-center gap-4">
        {/* Notification Bell with dropdown */}
        <div className="relative">
          <button 
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 text-slate-450 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/5 hover:bg-white/10"
          >
            <Bell size={15} className="text-[#94A3B8]" />
            {notifications.length > 0 && (
              <motion.span 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [1, 1.25, 1], opacity: 1 }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="absolute -top-0.5 -right-0.5 min-w-4 h-4 bg-rose-500 rounded-full border border-[#0B0F1A] text-[9px] font-black text-white flex items-center justify-center px-1"
              >
                {notifications.length}
              </motion.span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 bg-[#12182D]/95 border border-white/10 rounded-2xl shadow-2xl py-3 px-4 z-50 backdrop-blur-[20px] text-center"
              >
                <div className="flex items-center justify-center gap-2 text-[#94A3B8] mb-1">
                  <Bell size={12} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">{t('alertCenter')}</span>
                </div>
                <div className="border-t border-white/5 my-1.5"></div>
                <span className="text-[11px] font-bold text-slate-500 block py-3 uppercase tracking-wider">
                  {t('noNotifications')}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Account Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors text-left"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center text-xs font-black text-white font-mono uppercase shadow-md animate-pulse">
              {username[0]}
            </div>
            <span className="text-[12px] font-bold text-white tracking-wide">{username}</span>
            <ChevronDown size={12} className="text-slate-500" />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-44 bg-[#12182D]/95 border border-white/10 rounded-2xl shadow-2xl py-1.5 z-50 backdrop-blur-[20px]"
              >
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/settings?tab=profile'); }}
                  className="w-full text-left px-4 py-2 text-[11px] font-bold font-display uppercase tracking-wider text-[#94A3B8] hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors"
                >
                  <User size={13} />
                  <span>{t('myProfile')}</span>
                </button>
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/settings?tab=general'); }}
                  className="w-full text-left px-4 py-2 text-[11px] font-bold font-display uppercase tracking-wider text-[#94A3B8] hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors"
                >
                  <Settings size={13} />
                  <span>{t('settings')}</span>
                </button>
                <div className="border-t border-white/5 my-1.5"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-[11px] font-bold font-display uppercase tracking-wider text-[#EF4444] hover:text-rose-350 hover:bg-rose-500/10 flex items-center gap-2"
                >
                  <LogOut size={13} />
                  <span>{t('logOut')}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
