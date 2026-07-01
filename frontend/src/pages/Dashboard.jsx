import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, ShieldAlert, ShieldCheck, Activity, FileText, Video, Image, Link2, RefreshCw,
  TrendingUp, AlertTriangle, ArrowUpRight, BrainCircuit, Zap, CheckCircle,
  XCircle, BarChart3, Timer, Download, Eye, Trash2, Search
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import API_BASE from "../api";
import ResultCard from '../components/ResultCard';
import FactCheckResult from '../components/FactCheckResult';
import ImageForensicResult from '../components/ImageForensicResult';
import VideoForensicResult from '../components/VideoForensicResult';

const Dashboard = () => {
  const { t, i18n } = useTranslation('dashboard');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState(null);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const handleDeleteScan = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/analyze/history/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete scan record');
      setDeleteConfirmId(null);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to delete scan record.');
      setDeleteConfirmId(null);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Dashboard loading error:', err);
      setError('Failed to sync security data feed. Ensure the server is online.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    window.addEventListener('scan-updated', fetchDashboardData);
    return () => {
      clearInterval(interval);
      window.removeEventListener('scan-updated', fetchDashboardData);
    };
  }, [fetchDashboardData]);

  const getScanIcon = (type) => {
    switch (type) {
      case 'text': return <FileText size={14} className="text-[#00C2FF]" />;
      case 'url': return <Link2 size={14} className="text-[#22C55E]" />;
      case 'image': return <Image size={14} className="text-[#A855F7]" />;
      case 'video': return <Video size={14} className="text-[#7C3AED]" />;
      default: return <FileText size={14} />;
    }
  };

  const hasScans = stats && stats.totalScans > 0;

  const getRiskLevelAndColor = () => {
    if (!hasScans) return { text: '--', color: 'text-slate-400' };
    const score = stats.avgRiskScore || 0;
    if (score <= 30) return { text: 'Low', color: 'text-emerald-400' };
    if (score <= 70) return { text: 'Medium', color: 'text-amber-400' };
    if (score <= 90) return { text: 'High', color: 'text-rose-500' };
    return { text: 'Critical', color: 'text-red-500' };
  };
  const riskInfo = getRiskLevelAndColor();

  const breakdown = hasScans ? (stats.typeBreakdown || { text: 0, url: 0, image: 0, video: 0 }) : { text: 0, url: 0, image: 0, video: 0 };
  const totalBreakdown = Object.values(breakdown).reduce((a, b) => a + b, 0) || 1;
  const imagePercent = hasScans ? Math.round((breakdown.image / totalBreakdown) * 100) : 0;
  const videoPercent = hasScans ? Math.round((breakdown.video / totalBreakdown) * 100) : 0;
  const textPercent = hasScans ? Math.round((breakdown.text / totalBreakdown) * 100) : 0;
  const urlPercent = hasScans ? Math.max(0, 100 - imagePercent - videoPercent - textPercent) : 0;

  const getDailySvgData = () => {
    const trend = stats?.dailyTrend || [];
    if (trend.length === 0) return null;
    const maxVal = Math.max(...trend.map(d => d.total), 2);
    const getSvgPath = (counts) => {
      let path = `M10,${90 - (counts[0] / maxVal) * 75}`;
      for (let i = 1; i < counts.length; i++) {
        const x = 10 + i * 46;
        const y = 90 - (counts[i] / maxVal) * 75;
        path += ` L${x},${y}`;
      }
      return path;
    };
    const getSvgAreaPath = (counts) => {
      let path = `M10,95 L10,${90 - (counts[0] / maxVal) * 75}`;
      for (let i = 1; i < counts.length; i++) {
        const x = 10 + i * 46;
        const y = 90 - (counts[i] / maxVal) * 75;
        path += ` L${x},${y}`;
      }
      path += ` L${10 + (counts.length - 1) * 46},95 Z`;
      return path;
    };
    return {
      labels: trend.map(d => d.day),
      safeCounts: trend.map(d => d.safe),
      threatCounts: trend.map(d => d.threats),
      getSvgPath,
      getSvgAreaPath
    };
  };

  const formatMs = (ms) => {
    if (!ms || ms === 0) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const handleDownloadPDF = async (e, scanId) => {
    if (e) e.preventDefault();
    if (e) e.stopPropagation();
    if (!scanId) return;
    setDownloadingId(scanId);
    try {
      const token = localStorage.getItem('token');
      const lang = i18n.language || 'en';
      const response = await fetch(`${API_BASE}/api/analyze/report/${scanId}?lang=${lang}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('PDF download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `TruthShield_Report_${scanId}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
    } finally {
      setDownloadingId(null);
    }
  };

  const avgTrustScore = (() => {
    if (!hasScans) return 0;
    const scans = stats.recentScans || [];
    if (scans.length === 0) return 0;
    const total = scans.reduce((sum, s) => {
      const ts = s.factCheckReport?.trustScore ?? s.credibilityScore ?? 50;
      return sum + ts;
    }, 0);
    return Math.round(total / scans.length);
  })();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 20 } }
  };

  const SkeletonCard = () => (
    <div className="glass-panel p-4 border-white/5 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-white/5 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-white/5 rounded w-3/4" />
          <div className="h-2 bg-white/5 rounded w-1/2" />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-2 bg-white/5 rounded w-full" />
        <div className="h-2 bg-white/5 rounded w-2/3" />
      </div>
    </div>
  );

  if (loading && !stats) {
    return (
      <div className="px-6 py-6 min-h-[calc(100vh-4rem)]">
        <div className="flex items-center gap-3 mb-8">
          <RefreshCw size={24} className="animate-spin text-[#7C3AED]" />
          <span className="text-xs font-bold font-display uppercase tracking-widest text-[#94A3B8]">Syncing Cyber Sensors...</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const chartData = getDailySvgData();
  const recentScans = stats?.recentScans || [];
  const providerUsage = stats?.providerUsage || { gemini: 0, openai: 0 };
  const confDist = stats?.confidenceDistribution || {};

  const getThumbnailSrc = (scan) => {
    return scan.thumbnail || scan.factCheckReport?.thumbnail || scan.factCheckReport?.originalImageBase64 || scan.factCheckReport?.originalImage || '';
  };



  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="px-6 py-6 min-h-[calc(100vh-4rem)] flex flex-col justify-between relative overflow-hidden"
    >
      {/* Background Watermarks */}
      <div className="absolute left-64 bottom-6 opacity-[0.035] text-[#7C3AED] pointer-events-none select-none">
        <svg viewBox="0 0 200 200" className="w-[380px] h-[380px]">
          <path d="M100,20 C70,20 40,40 30,80 C25,100 28,120 40,140 C150,170 155,150 160,140 C172,120 175,100 170,80 C160,40 130,20 100,20 Z" fill="none" stroke="currentColor" strokeWidth="0.6" />
          <text x="100" y="105" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight="bold" letterSpacing="4" opacity="0.3">DEEPFAKE</text>
          <text x="100" y="125" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="bold" letterSpacing="10" opacity="0.2">DETECTION</text>
        </svg>
      </div>
      <div className="absolute right-32 top-24 opacity-[0.02] text-[#7C3AED] pointer-events-none select-none rotate-12">
        <Shield size={200} />
      </div>

      <div className="space-y-6 relative z-10">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-wider text-white font-display uppercase flex items-center gap-2.5">
              <Shield className="text-[#7C3AED]" />
              <span>{t('title')}</span>
            </h1>
            <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest font-bold mt-1 font-sans">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/history" className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold font-display uppercase rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all text-slate-300">
              <Search size={13} />
              <span>{t('fullArchive')}</span>
            </Link>
            <button type="button" onClick={fetchDashboardData} className="p-2 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </motion.div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[#EF4444] text-xs font-bold">{error}</div>
        )}

        {/* ROW 1: 6 Primary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: t('totalInvestigations'), value: stats?.totalScans ?? 0, icon: <FileText size={16} />, color: '#7C3AED', sub: t('totalInvestigationsSub'), subIcon: <TrendingUp size={10} /> },
            { label: t('authenticFiles'), value: stats?.realScans ?? 0, icon: <ShieldCheck size={16} />, color: '#22C55E', sub: t('authenticFilesSub'), subIcon: <ShieldCheck size={10} /> },
            { label: t('suspiciousFiles'), value: stats?.fakeScans ?? 0, icon: <ShieldAlert size={16} />, color: '#EF4444', sub: t('suspiciousFilesSub'), subIcon: <ShieldAlert size={10} /> },
            { label: t('avgTrustScore'), value: `${avgTrustScore}%`, icon: <Activity size={16} />, color: '#00C2FF', sub: t('avgTrustScoreSub'), subIcon: <Activity size={10} /> },
            { label: t('todaysScans'), value: stats?.todayScans ?? 0, icon: <Zap size={16} />, color: '#F59E0B', sub: t('todaysScansSub'), subIcon: <Zap size={10} /> },
            { label: t('riskLevel'), value: hasScans ? (riskInfo.text.startsWith('Low') ? t('lowRisk') : riskInfo.text.startsWith('Medium') ? t('mediumRisk') : t('highRisk')) : t('none'), icon: <AlertTriangle size={16} />, color: '#EF4444', sub: t('riskLevelSub'), subIcon: null, valueColor: hasScans ? riskInfo.color : 'text-slate-450' },
          ].map((card, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.015, boxShadow: `0 12px 30px ${card.color}26` }}
              className="glass-panel p-4 border-white/8 flex flex-col justify-between relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="block text-[8px] font-bold text-[#94A3B8] uppercase tracking-widest font-sans">{card.label}</span>
                  <span className={`text-xl font-extrabold mt-1 block font-sans ${card.valueColor || 'text-white'}`} style={!card.valueColor ? { color: card.color === '#7C3AED' ? '#fff' : card.color } : {}}>
                    {card.value}
                  </span>
                </div>
                <div className="p-2 rounded-lg border" style={{ background: `${card.color}15`, borderColor: `${card.color}30`, color: card.color }}>
                  {card.icon}
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-[8px] font-bold font-sans uppercase tracking-wider" style={{ color: card.color }}>
                {card.subIcon}
                <span>{card.sub}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ROW 2: Secondary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            { label: t('avgProcessing'), value: formatMs(stats?.avgProcessingTime), icon: <Timer size={14} />, color: '#A855F7' },
            { label: t('weeklyScans'), value: stats?.weeklyScans ?? 0, icon: <BarChart3 size={14} />, color: '#22C55E' },
            { label: t('avgConfidence'), value: hasScans ? `${stats.avgConfidence}%` : '0%', icon: <Activity size={14} />, color: '#00C2FF' },
            { label: t('successRate'), value: hasScans ? `${stats.successRate}%` : '0%', icon: <CheckCircle size={14} />, color: '#6EE7B7' },
            { label: t('failedScans'), value: stats?.failedScans ?? 0, icon: <XCircle size={14} />, color: '#EF4444' },
            { label: t('avgAuthenticProbability'), value: hasScans ? `${stats?.avgHumanAuthenticityProbability ?? 0}%` : '0%', icon: <ShieldCheck size={14} />, color: '#10B981' },
            { label: t('avgAiProbability'), value: hasScans ? `${stats?.avgAiGeneratedProbability ?? 0}%` : '0%', icon: <ShieldAlert size={14} />, color: '#EC4899' },
          ].map((card, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.01 }}
              className="glass-panel p-3.5 border-white/8 flex items-center gap-3"
            >
              <div className="p-2 rounded-lg border" style={{ background: `${card.color}12`, borderColor: `${card.color}25`, color: card.color }}>
                {card.icon}
              </div>
              <div>
                <span className="block text-[8px] font-bold text-[#94A3B8] uppercase tracking-widest font-sans">{card.label}</span>
                <span className="text-base font-extrabold text-white font-sans">{card.value}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ROW 3: 3-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Column 1: Scan Type Distribution */}
          <motion.div variants={itemVariants} className="glass-panel p-5 border-white/8">
            <h2 className="text-[14px] font-bold font-sans text-white mb-4">{t('pipelineDistribution')}</h2>
            {!hasScans ? (
              <div className="h-36 flex items-center justify-center bg-white/[0.01] border border-dashed border-white/5 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">{t('noScansAvailable')}</span>
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { label: t('image'), pct: imagePercent, color: '#A855F7', icon: <Image size={12} /> },
                  { label: t('video'), pct: videoPercent, color: '#7C3AED', icon: <Video size={12} /> },
                  { label: t('textPdf'), pct: textPercent, color: '#00C2FF', icon: <FileText size={12} /> },
                  { label: t('url'), pct: urlPercent, color: '#22C55E', icon: <Link2 size={12} /> },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-6 h-6 flex items-center justify-center rounded" style={{ color: item.color, background: `${item.color}15` }}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest font-sans">{item.label}</span>
                        <span className="text-[9px] font-black font-sans" style={{ color: item.color }}>{item.pct}%</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.pct}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: item.color }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Column 2: Shield Status */}
          <motion.div variants={itemVariants} className="glass-panel p-5 border-white/8 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
              <Shield size={180} className="text-[#7C3AED]" />
            </div>
            <div className="relative flex flex-col items-center gap-3">
              <div className="text-[8px] font-black text-[#94A3B8] uppercase tracking-[0.3em] font-sans">{t('systemProtectionStatus')}</div>
              <div className="relative">
                <svg viewBox="0 0 100 100" className="w-24 h-24">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#1E293B" strokeWidth="6" />
                  <motion.circle
                    initial={{ strokeDashoffset: 251.2 }}
                    animate={{ strokeDashoffset: hasScans ? 251.2 - ((stats.realScans / stats.totalScans) * 251.2) : 251.2 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    cx="50" cy="50" r="40"
                    fill="none" stroke="#22C55E" strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="251.2"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Shield className="text-[#00C2FF] animate-pulse" size={32} />
                </motion.div>
              </div>
              <span className="text-[8px] font-bold font-sans uppercase tracking-widest px-3.5 py-1 rounded-full animate-pulse border text-[#00C2FF] border-[#00C2FF]/20 bg-[#00C2FF]/5 shadow-[0_0_12px_rgba(0,194,255,0.2)]">
                {t('aiShieldActive')}
              </span>
            </div>
          </motion.div>

          {/* Column 3: Recent Scans Quick List */}
          <motion.div variants={itemVariants} className="glass-panel p-5 border-white/8 flex flex-col justify-between h-80 lg:h-auto overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[14px] font-bold font-sans text-white">{t('recentScans')}</h2>
              <Link to="/history" className="text-[9px] font-bold font-sans text-[#94A3B8] uppercase tracking-widest hover:text-white transition-colors">
                {t('viewAll')}
              </Link>
            </div>

            <div className="flex-grow flex flex-col justify-between overflow-hidden">
              {recentScans.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs uppercase font-bold tracking-wider font-sans">
                  {t('noScansAvailable')}
                </div>
              ) : (
                <>
                  <div className="space-y-2.5 overflow-y-auto max-h-48 pr-1 scrollbar-thin flex-grow">
                    {recentScans.slice(0, 5).map((scan, idx) => {
                      const isThreat = scan.prediction === 'Fake';
                      const thumbSrc = getThumbnailSrc(scan);
                      return (
                        <div 
                          key={scan._id || idx}
                          onClick={() => setSelectedScan(scan)}
                          className="p-2.5 bg-[#12182D]/20 border border-white/5 rounded-xl flex items-center justify-between hover:border-white/10 hover:bg-white/[0.02] transition-colors cursor-pointer animate-fadeIn"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg border border-white/5 overflow-hidden">
                              {(scan.type === 'image' || scan.type === 'video') && thumbSrc ? (
                                <img 
                                  src={thumbSrc} 
                                  className="w-full h-full object-cover" 
                                  alt="Thumb" 
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              ) : getScanIcon(scan.type)}
                            </div>
                            <div className="max-w-[120px] sm:max-w-none">
                              <span className="block text-[10px] font-extrabold text-slate-200 truncate" title={scan.content}>{scan.content}</span>
                              <span className="block text-[8px] font-bold text-[#94A3B8] uppercase tracking-widest mt-0.5">
                                {scan.type} &bull; {new Date(scan.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                              isThreat ? 'bg-rose-500/5 text-[#EF4444] border-rose-500/10' : 'bg-cyber-success/5 text-[#22C55E] border-[#22C55E]/10'
                            }`}>
                              {isThreat ? t('threat') : t('safe')}
                            </span>
                            <span className="text-[10px] font-extrabold text-[#94A3B8]">{scan.credibilityScore || scan.confidenceScore}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5 text-[9px] text-[#94A3B8] font-bold uppercase tracking-widest font-sans">
                    <span>{t('providerBreakdown')}</span>
                    <div className="flex gap-3">
                      {providerUsage && Object.keys(providerUsage).length > 0 ? (
                        Object.entries(providerUsage).map(([prov, count]) => (
                          <span key={prov} className="capitalize">{prov}: {count}</span>
                        ))
                      ) : (
                        <span>N/A</span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>

        </div>

        {/* ROW 4: Recent Investigations - Full Cards */}
        <motion.div variants={itemVariants}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[16px] font-extrabold font-sans text-white uppercase tracking-wider">{t('recentInvestigations')}</h2>
            <Link to="/history" className="text-[9px] font-bold font-sans text-[#94A3B8] uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1">
              <span>{t('viewFullArchive')}</span>
              <ArrowUpRight size={10} />
            </Link>
          </div>

          {recentScans.length === 0 ? (
            <div className="glass-panel p-12 text-center border-white/5 shadow-inner">
              <Shield size={36} className="mx-auto text-slate-600 mb-3" />
              <h3 className="font-bold text-slate-400 font-display uppercase tracking-wider text-sm">{t('noInvestigations')}</h3>
              <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">{t('executeScans')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentScans.slice(0, 6).map((scan, idx) => {
                const isThreat = scan.prediction === 'Fake';
                const thumbSrc = getThumbnailSrc(scan);
                const trustVal = scan.factCheckReport?.trustScore ?? scan.credibilityScore ?? scan.confidenceScore ?? 50;
                const riskBadge = scan.riskLevel || 'Low';
                const riskBadgeColors = {
                  Low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                  High: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                  Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
                };
                const scanTypeColors = {
                  image: '#A855F7',
                  video: '#7C3AED',
                  text: '#00C2FF',
                  url: '#22C55E',
                };
                const accentColor = scanTypeColors[scan.type] || '#7C3AED';

                return (
                  <motion.div
                    key={scan._id || idx}
                    variants={itemVariants}
                    whileHover={{ y: -4, scale: 1.01, boxShadow: `0 8px 24px ${accentColor}15` }}
                    className="glass-panel p-4 border-white/5 hover:border-white/10 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-11 h-11 flex items-center justify-center bg-white/5 rounded-xl border border-white/5 overflow-hidden shrink-0">
                          {(scan.type === 'image' || scan.type === 'video') && thumbSrc ? (
                            <img src={thumbSrc} className="w-full h-full object-cover" alt="Thumb" onError={(e) => { e.target.style.display = 'none'; }} />
                          ) : (
                            <div className="p-2" style={{ color: accentColor }}>{getScanIcon(scan.type)}</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block text-[11px] font-extrabold text-slate-200 truncate" title={scan.content}>{scan.content}</span>
                          <div className="flex flex-wrap items-center gap-x-2 mt-1">
                            <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border" style={{ color: accentColor, borderColor: `${accentColor}30`, background: `${accentColor}10` }}>
                              {scan.type}
                            </span>
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                              {new Date(scan.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border ${
                          isThreat ? 'bg-rose-500/10 text-[#EF4444] border-rose-500/20' : 'bg-emerald-500/10 text-[#22C55E] border-emerald-500/20'
                        }`}>
                          {scan.prediction}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-lg p-2 text-center">
                          <span className="block text-[7px] font-bold text-slate-500 uppercase tracking-widest">{t('trust')}</span>
                          <span className="block text-sm font-black text-white">{trustVal}%</span>
                        </div>
                        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-lg p-2 text-center">
                          <span className="block text-[7px] font-bold text-slate-500 uppercase tracking-widest">{t('confidence')}</span>
                          <span className="block text-sm font-black text-white">{scan.confidenceScore}%</span>
                        </div>
                        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-lg p-2 text-center">
                          <span className="block text-[7px] font-bold text-slate-500 uppercase tracking-widest">{t('risk')}</span>
                          <span className={`block text-[9px] font-black px-1.5 py-0.5 rounded border ${riskBadgeColors[riskBadge] || riskBadgeColors.Low}`}>
                            {riskBadge === 'Low' ? t('low') : riskBadge === 'Medium' ? t('medium') : t('high')}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2 bg-white/[0.01] border border-white/5 rounded-lg p-2 text-[9px] mb-2 font-mono">
                        <div>
                          <span className="block text-[6px] text-slate-500 uppercase tracking-widest font-sans">{t('aiGenProb')}</span>
                          <span className="text-white font-mono">{scan.factCheckReport?.aiGeneratedProbability ?? (scan.prediction === 'Fake' ? scan.confidenceScore : 100 - scan.confidenceScore)}%</span>
                        </div>
                        <div>
                          <span className="block text-[6px] text-slate-500 uppercase tracking-widest font-sans">{t('humanAuthProb')}</span>
                          <span className="text-white font-mono">{scan.factCheckReport?.humanAuthenticityProbability ?? (scan.prediction === 'Real' ? scan.confidenceScore : 100 - scan.confidenceScore)}%</span>
                        </div>
                        {scan.type === 'video' ? (
                          <>
                            <div>
                              <span className="block text-[6px] text-slate-500 uppercase tracking-widest font-sans">{t('duration')}</span>
                              <span className="text-white font-mono">{scan.factCheckReport?.metadata?.duration ? Number(scan.factCheckReport.metadata.duration).toFixed(1) + 's' : 'N/A'}</span>
                            </div>
                            <div>
                              <span className="block text-[6px] text-slate-500 uppercase tracking-widest font-sans">{t('resolution')}</span>
                              <span className="text-white font-mono">{(scan.factCheckReport?.metadata?.width && scan.factCheckReport?.metadata?.height) ? `${scan.factCheckReport.metadata.width}x${scan.factCheckReport.metadata.height}` : 'N/A'}</span>
                            </div>
                          </>
                        ) : scan.type === 'image' ? (
                          <>
                            <div>
                              <span className="block text-[6px] text-slate-500 uppercase tracking-widest font-sans">{t('resolution')}</span>
                              <span className="text-white font-mono">{(scan.factCheckReport?.metadata?.width && scan.factCheckReport?.metadata?.height) ? `${scan.factCheckReport.metadata.width}x${scan.factCheckReport.metadata.height}` : 'N/A'}</span>
                            </div>
                            <div>
                              <span className="block text-[6px] text-slate-500 uppercase tracking-widest font-sans">{t('aiProvider')}</span>
                              <span className="text-white font-mono">{scan.provider || 'Gemini'}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <span className="block text-[6px] text-slate-500 uppercase tracking-widest font-sans">{t('status')}</span>
                              <span className="text-emerald-400 font-mono uppercase tracking-tight">{scan.status || 'success'}</span>
                            </div>
                            <div>
                              <span className="block text-[6px] text-slate-500 uppercase tracking-widest font-sans">{t('aiProvider')}</span>
                              <span className="text-white font-mono">{scan.provider || 'Gemini'}</span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="text-[8px] font-mono text-slate-600 truncate mb-2" title={scan._id}>
                        ID: {scan._id}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      {deleteConfirmId === scan._id ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-bold text-rose-450 uppercase tracking-wider">{t('confirm')}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteScan(scan._id)}
                            className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/30 text-rose-400 text-[8px] font-bold font-display uppercase tracking-wider rounded-lg transition-all"
                          >
                            {t('yes')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-450 text-[8px] font-bold font-display uppercase tracking-wider rounded-lg transition-all"
                          >
                            {t('no')}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(scan._id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 text-[10px] font-bold font-display uppercase tracking-wider rounded-xl transition-all"
                        >
                          <Trash2 size={10} />
                          <span>{t('delete')}</span>
                        </button>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedScan(scan)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4E2EF2]/10 hover:bg-[#4E2EF2]/20 border border-[#4E2EF2]/20 hover:border-[#4E2EF2]/40 text-[#A855F7] text-[10px] font-bold font-display uppercase tracking-wider rounded-xl transition-all"
                        >
                          <Eye size={11} />
                          <span>{t('view')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDownloadPDF(e, scan._id)}
                          disabled={downloadingId === scan._id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-slate-300 text-[10px] font-bold font-display uppercase tracking-wider rounded-xl transition-all disabled:opacity-50"
                        >
                          {downloadingId === scan._id ? <RefreshCw size={11} className="animate-spin" /> : <Download size={11} />}
                          <span>{t('pdf')}</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* ROW 5: Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart 1: Daily Scan Trend */}
          <motion.div variants={itemVariants} className="glass-panel p-5 border-white/8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[14px] font-bold font-sans text-white">{t('dailyScanTrend')}</h3>
              <span className="text-[8px] font-bold text-[#94A3B8] uppercase tracking-wider">{t('last7Days')}</span>
            </div>
            <div className="relative h-36 flex flex-col justify-between">
              {!hasScans || !chartData ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/[0.01] border border-dashed border-white/5 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">{t('noScansAvailable')}</span>
                </div>
              ) : (
                <>
                  <svg viewBox="0 0 300 100" className="w-full h-28">
                    <defs>
                      <linearGradient id="safe-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22C55E" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="threat-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EF4444" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <motion.path 
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      d={chartData.getSvgPath(chartData.safeCounts)} 
                      fill="none" stroke="#22C55E" strokeWidth="2" 
                    />
                    <path d={chartData.getSvgAreaPath(chartData.safeCounts)} fill="url(#safe-fill)" />
                    <motion.path 
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                      d={chartData.getSvgPath(chartData.threatCounts)} 
                      fill="none" stroke="#EF4444" strokeWidth="2" 
                    />
                    <path d={chartData.getSvgAreaPath(chartData.threatCounts)} fill="url(#threat-fill)" />
                  </svg>
                  <div className="flex justify-between text-[7px] font-bold text-[#94A3B8] uppercase tracking-widest">
                    {chartData.labels.map((d, i) => <span key={i}>{d}</span>)}
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-4 mt-3 text-[8px] font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> <span className="text-[#94A3B8]">{t('safe')}</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> <span className="text-[#94A3B8]">{t('threats')}</span></span>
            </div>
          </motion.div>

          {/* Confidence Distribution */}
          <motion.div variants={itemVariants} className="glass-panel p-5 border-white/8">
            <h3 className="text-[14px] font-bold font-sans text-white mb-4">{t('confidenceDistribution')}</h3>
            {!hasScans ? (
              <div className="h-28 flex items-center justify-center bg-white/[0.01] border border-dashed border-white/5 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">{t('noScansAvailable')}</span>
              </div>
            ) : (
              <div className="flex items-end justify-between h-28 gap-2 px-1">
                {Object.entries(confDist).map(([range, count], idx) => {
                  const maxCount = Math.max(...Object.values(confDist), 1);
                  const h = (count / maxCount) * 100;
                  const colors = ['#EF4444', '#F59E0B', '#F59E0B', '#22C55E', '#22C55E'];
                  return (
                    <div key={range} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] font-black text-white">{count}</span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(h, 4)}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                        className="w-full rounded-t-md"
                        style={{ background: colors[idx], minHeight: '4px' }}
                      />
                      <span className="text-[7px] font-bold text-[#94A3B8] uppercase tracking-widest">{range}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* AI Insights */}
          <motion.div variants={itemVariants} className="glass-panel p-5 border-white/8 flex flex-col justify-between">
            <h3 className="text-[14px] font-bold font-sans text-white mb-4">{t('aiInsights')}</h3>
            {!hasScans ? (
              <div className="flex-grow flex items-center justify-center p-4 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl h-28">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center leading-relaxed font-sans">
                  {t('insightsAwaiting')}
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-4 py-2">
                <div className="p-3 bg-[#7C3AED]/10 border border-[#7C3AED]/20 text-[#A855F7] rounded-2xl animate-pulse shrink-0">
                  <BrainCircuit size={28} />
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <div>
                    <span className="block text-[8px] font-bold text-[#94A3B8] uppercase tracking-widest font-sans">{t('verifiedThreatQuotient')}</span>
                    <span className="text-base font-black text-white mt-0.5 block font-sans">
                      {Math.round((stats.fakeScans / stats.totalScans) * 100)}%
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold text-[#94A3B8] uppercase tracking-widest font-sans">{t('avgScanTime')}</span>
                    <span className="text-base font-black text-white mt-0.5 block font-sans">
                      {formatMs(stats.avgProcessingTime)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold text-[#94A3B8] uppercase tracking-widest font-sans">{t('authenticRate')}</span>
                    <span className="text-base font-black text-emerald-400 mt-0.5 block font-sans">
                      {Math.round((stats.realScans / stats.totalScans) * 100)}%
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold text-[#94A3B8] uppercase tracking-widest font-sans">{t('deepfakeRate')}</span>
                    <span className="text-base font-black text-rose-500 mt-0.5 block font-sans">
                      {Math.round((stats.fakeScans / stats.totalScans) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
            <span className="text-[7px] text-slate-500 uppercase font-mono mt-4 block">{t('metricsComputedNote')}</span>
          </motion.div>
        </div>

      </div>

      {/* Footer Bar */}
      <motion.footer 
        variants={itemVariants}
        className="mt-8 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#7C3AED]/10 border border-[#7C3AED]/25 rounded-lg text-[#00C2FF]">
            <Shield size={12} />
          </div>
          <p className="text-[8px] font-bold text-[#94A3B8] uppercase tracking-widest">
            {t('footerSecurityNote')}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[8px] font-bold text-[#94A3B8] uppercase tracking-widest">
          <span>{t('lastSync')} {lastRefresh ? lastRefresh.toLocaleTimeString() : t('pending')}</span>
          <button type="button" onClick={fetchDashboardData} className="text-[#94A3B8] hover:text-white transition-colors">
            <RefreshCw size={10} />
          </button>
        </div>
      </motion.footer>

      {/* Selected Scan Modal */}
      <AnimatePresence>
        {selectedScan && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070B18]/85 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-panel p-2.5 border-white/10 relative shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setSelectedScan(null)}
                className="absolute top-4 right-4 z-50 px-3.5 py-2 bg-white/5 border border-white/5 hover:bg-rose-500/10 hover:text-rose-450 hover:border-rose-500/20 rounded-xl text-slate-400 font-bold font-display uppercase text-[10px] transition-all"
              >
                {t('closeDossier')}
              </button>
              <div className="p-4 pt-10">
                 {selectedScan.type === 'text' && selectedScan.factCheckReport ? (
                  <FactCheckResult result={selectedScan} />
                ) : selectedScan.type === 'image' && selectedScan.factCheckReport ? (
                  <ImageForensicResult result={{ ...selectedScan.factCheckReport, _id: selectedScan._id, scanId: selectedScan._id }} />
                ) : selectedScan.type === 'video' && selectedScan.factCheckReport ? (
                  <VideoForensicResult result={selectedScan.factCheckReport || selectedScan} />
                ) : (
                  <ResultCard result={selectedScan} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Dashboard;
