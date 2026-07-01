import React, { useState, useEffect } from 'react';
import { Search, Bell, ChevronDown, LogOut, User, Settings, Menu, CheckCircle, AlertTriangle, AlertOctagon, Info, Trash2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import API_BASE from "../api";

const Topbar = ({ onMenuClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Agent';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${API_BASE}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/notifications/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleDeleteNotif = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleRefresh = () => {
      fetchNotifications();
    };

    window.addEventListener('scan-completed', handleRefresh);
    window.addEventListener('scan-updated', handleRefresh);
    window.addEventListener('notifications-updated', handleRefresh);

    return () => {
      window.removeEventListener('scan-completed', handleRefresh);
      window.removeEventListener('scan-updated', handleRefresh);
      window.removeEventListener('notifications-updated', handleRefresh);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

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
            {unreadCount > 0 && (
              <motion.span 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [1, 1.25, 1], opacity: 1 }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="absolute -top-0.5 -right-0.5 min-w-4 h-4 bg-rose-500 rounded-full border border-[#0B0F1A] text-[9px] font-black text-white flex items-center justify-center px-1"
              >
                {unreadCount}
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
                className="absolute right-0 mt-2 w-80 bg-[#12182D]/95 border border-white/10 rounded-2xl shadow-2xl py-3 px-4 z-50 backdrop-blur-[20px]"
              >
                <div className="flex items-center justify-between text-[#94A3B8] mb-2 pr-1">
                  <div className="flex items-center gap-2">
                    <Bell size={12} className="text-cyber-primary" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">{t('alertCenter') || 'Alert Center'}</span>
                  </div>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead} 
                      className="text-[8px] font-black text-cyber-primary hover:text-cyber-blue uppercase tracking-widest transition-colors"
                    >
                      {t('markAllRead') || 'Mark all read'}
                    </button>
                  )}
                </div>
                <div className="border-t border-white/5 my-1.5"></div>
                
                <div className="max-h-72 overflow-y-auto space-y-2 mt-2 pr-1 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <span className="text-[10px] font-bold text-slate-500 block py-4 text-center uppercase tracking-wider">
                      {t('noNotifications') || 'No Notifications'}
                    </span>
                  ) : (
                    notifications.map(notif => {
                      return (
                        <div 
                          key={notif._id} 
                          className={`p-2.5 rounded-xl border transition-all text-left flex gap-2.5 relative group ${
                            notif.read 
                              ? 'bg-white/[0.01] border-white/5 hover:bg-white/[0.02]' 
                              : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.04]'
                          }`}
                        >
                          {!notif.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute top-3.5 right-3.5 shadow-glow-red animate-pulse" />
                          )}
                          
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border mt-0.5 ${
                            notif.type === 'success' ? 'bg-[#22C55E]/10 border-[#22C55E]/20 text-[#22C55E]' :
                            notif.type === 'warning' ? 'bg-[#F59E0B]/10 border-[#F59E0B]/20 text-[#F59E0B]' :
                            notif.type === 'error' ? 'bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]' :
                            'bg-[#06B6D4]/10 border-[#06B6D4]/20 text-[#06B6D4]'
                          }`}>
                            {notif.type === 'success' && <CheckCircle size={13} />}
                            {notif.type === 'warning' && <AlertTriangle size={13} />}
                            {notif.type === 'error' && <AlertOctagon size={13} />}
                            {notif.type === 'info' && <Info size={13} />}
                          </div>
                          
                          <div className="flex-grow min-w-0 pr-4">
                            <span className="block text-[9px] font-black text-white uppercase tracking-wide leading-tight">{notif.title}</span>
                            <p className="text-[9px] text-slate-400 mt-0.5 leading-snug font-medium break-words">{notif.message}</p>
                            <span className="block text-[7px] font-mono text-slate-500 mt-1 uppercase">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <div className="absolute right-2 bottom-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notif.read && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleMarkRead(notif._id); }}
                                className="p-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-emerald-450 transition-colors"
                                title="Mark as Read"
                              >
                                <Check size={8} />
                              </button>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteNotif(notif._id); }}
                              className="p-1 rounded bg-white/5 border border-white/5 hover:bg-rose-500/10 hover:border-rose-500/20 text-rose-450 transition-colors"
                              title="Delete Alert"
                            >
                              <Trash2 size={8} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
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
