import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Shield, LayoutDashboard, FileText, Image, Video, 
  Link2, History, Settings, User, FileCheck, ShieldCheck, LogOut, Lock, X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const isActive = (itemPath) => {
    const [path, search] = itemPath.split('?');
    if (search) {
      return location.pathname === path && location.search === `?${search}`;
    }
    // If the path has no search part, only match if current search is empty
    return location.pathname === path && !location.search;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    window.dispatchEvent(new Event('auth-change'));
    navigate('/login');
  };

  const menuItems = [
    { label: t('navDashboard'), path: '/dashboard', icon: <LayoutDashboard size={16} /> },
    { label: t('navTextScan'), path: '/analyze-text', icon: <FileText size={16} /> },
    { label: t('navImageDeepfake'), path: '/analyze-image', icon: <Image size={16} /> },
    { label: t('navVideoDeepfake'), path: '/analyze-video', icon: <Video size={16} /> },
    { label: t('navUrlVerification'), path: '/verify-url', icon: <Link2 size={16} /> },
    { label: t('navHistory'), path: '/history', icon: <History size={16} /> },
    { label: t('navReports'), path: '/reports', icon: <FileCheck size={16} /> },
    { label: t('navSettings'), path: '/settings?tab=general', icon: <Settings size={16} /> },
    { label: t('navProfile'), path: '/settings?tab=profile', icon: <User size={16} /> },
    { label: t('navSecurity'), path: '/settings?tab=security', icon: <Lock size={16} /> },
  ];

  if (!token) return null;

  return (
    <>
      {/* Mobile menu backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside className={`w-64 h-screen fixed top-0 z-40 bg-[#12182D]/72 border-r border-white/8 shadow-2xl backdrop-blur-[20px] flex flex-col justify-between p-4 select-none transition-all duration-300 ${isOpen ? 'left-0' : '-left-64'} lg:left-0 flex`}>
        
        {/* Top Header Logo */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <Link to="/dashboard" onClick={onClose} className="flex items-center gap-2.5 group">
            <div className="bg-gradient-to-r from-[#7C3AED] to-[#A855F7] p-2 rounded-xl text-white shadow-[0_0_15px_rgba(124,58,237,0.3)] group-hover:scale-105 transition-transform duration-300">
              <Shield size={18} className="stroke-[2.5]" />
            </div>
            <span className="font-display font-extrabold text-base tracking-widest text-white uppercase transition-colors">
              TRUTH<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A855F7] to-[#22C55E]">SHIELD</span>
            </span>
          </Link>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-450 hover:text-white transition-colors lg:hidden"
          >
            <X size={16} />
          </button>
        </div>
  
        {/* Navigation List Links */}
        <nav className="flex-grow my-4 space-y-1.5 overflow-y-auto scrollbar-thin relative pr-1">
          {menuItems.map((item, idx) => {
            const active = isActive(item.path);
            return (
              <Link
                key={idx}
                to={item.path}
                onClick={onClose}
                className="relative flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold font-sans transition-all duration-300 select-none group"
              >
              {/* Sliding Layout Active Indicator */}
              {active && (
                <motion.div 
                  layoutId="activeNavBg"
                  className="absolute inset-0 bg-gradient-to-r from-[#7C3AED]/15 to-[#A855F7]/5 border-l-2 border-[#7C3AED] rounded-xl shadow-[0_0_12px_rgba(124,58,237,0.12)]"
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
              
              <div className={`relative z-10 ${active ? 'text-[#A855F7]' : 'text-[#94A3B8] group-hover:text-white transition-colors'}`}>
                {item.icon}
              </div>
              
              <span className={`relative z-10 ${active ? 'text-white font-extrabold' : 'text-[#94A3B8] group-hover:text-white transition-colors'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Status Card & Exit Button */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        
        {/* Shield Status Card */}
        <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl transition-colors">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-[#22C55E] animate-pulse" />
            <span className="text-[10px] font-bold font-display text-[#22C55E] uppercase tracking-widest">{t('shieldStatus')}</span>
          </div>
          <span className="text-[9px] font-bold text-slate-500 uppercase mt-1 block">{t('active')}</span>
          <p className="text-[8px] text-[#94A3B8] leading-relaxed mt-1 uppercase font-semibold">{t('shieldStatusDesc')}</p>
        </div>

        {/* Exit Session Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/5 hover:bg-rose-500/10 border border-[#EF4444]/20 hover:border-rose-500/30 text-[#EF4444] text-[12px] font-bold uppercase rounded-xl transition-all"
        >
          <LogOut size={13} />
          <span>{t('exitSession')}</span>
        </button>
      </div>

    </aside>
    </>
  );
};

export default Sidebar;
