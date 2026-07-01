import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, Search, Calendar, FileText, Link2, Image, Video, 
  AlertTriangle, RefreshCw, Download, Eye, Trash2, Hash
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ResultCard from '../components/ResultCard';
import FactCheckResult from '../components/FactCheckResult';
import ImageForensicResult from '../components/ImageForensicResult';
import VideoForensicResult from '../components/VideoForensicResult';

const HistoryPage = () => {
  const { t, i18n } = useTranslation('history');
  const [scans, setScans] = useState(() => {
    try {
      const cached = localStorage.getItem('cached_history_scans');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      console.error('[History] Failed to read from cache:', e);
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterVerdict, setFilterVerdict] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [filterProvider, setFilterProvider] = useState('all');
  const [filterDuration, setFilterDuration] = useState('all');
  const [selectedScan, setSelectedScan] = useState(null);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Pagination and sorting states
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;


  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/analyze/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(t('loadRecordsError'));
      
      const data = await response.json();
      localStorage.setItem('cached_history_scans', JSON.stringify(data));

      setScans(data);
      setHasFetched(true);

      // Check query param for deep report linkage
      const params = new URLSearchParams(window.location.search);
      const queryId = params.get('id');
      if (queryId) {
        const matched = data.find(s => s._id === queryId);
        if (matched) setSelectedScan(matched);
      }
    } catch (err) {
      console.error(err);
      setError(t('serverActiveError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScan = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/analyze/history/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(t('deleteRecordError'));
      setScans(prev => prev.filter(scan => scan._id !== id));
      if (selectedScan?._id === id) setSelectedScan(null);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
      alert(err.message || t('deleteRecordError'));
      setDeleteConfirmId(null);
    }
  };

  const handleClearAllHistory = async () => {
    if (!window.confirm(t('clearAllConfirm'))) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/analyze/history`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(t('clearHistoryError'));
      setScans([]);
      setSelectedScan(null);
    } catch (err) {
      console.error(err);
      alert(err.message || t('clearHistoryError'));
    }
  };

  const handleDownloadPDF = async (e, scanId) => {
    if (e) e.preventDefault();
    if (e) e.stopPropagation();
    if (!scanId) return;
    setDownloadingId(scanId);
    try {
      const token = localStorage.getItem('token');
      const lang = i18n.language || 'en';
      const response = await fetch(`/api/analyze/report/${scanId}?lang=${lang}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(t('pdfDownloadError'));
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

  const handleExportCSV = () => {
    if (scans.length === 0) return;
    const headers = ["ID", "Type", "Content", "Prediction", "Confidence", "RiskLevel", "CredibilityScore", "Explanation", "Date"];
    const rows = scans.map(s => [
      s._id,
      s.type,
      `"${(s.content || '').replace(/"/g, '""')}"`,
      s.prediction,
      s.confidenceScore,
      s.riskLevel,
      s.credibilityScore,
      `"${(s.explanation || '').replace(/"/g, '""')}"`,
      s.createdAt
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "truthshield_history_export.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    // Create export completed notification
    const saveExportNotification = async () => {
      try {
        const token = localStorage.getItem('token');
        await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: 'Export Completed',
            message: 'Scan history successfully exported to CSV format.',
            type: 'success'
          })
        });
        window.dispatchEvent(new Event('notifications-updated'));
      } catch (err) {
        console.error('Failed to save export notification:', err);
      }
    };
    saveExportNotification();
  };

  useEffect(() => {
    fetchHistory();
    window.addEventListener('scan-updated', fetchHistory);
    return () => window.removeEventListener('scan-updated', fetchHistory);
  }, []);

  const getScanIcon = (type) => {
    switch (type) {
      case 'text': return <FileText size={18} className="text-cyan-400" />;
      case 'url': return <Link2 size={18} className="text-[#6EE7B7]" />;
      case 'image': return <Image size={18} className="text-blue-400" />;
      case 'video': return <Video size={18} className="text-[#A855F7]" />;
      default: return <FileText size={18} />;
    }
  };

  const getThumbnailSrc = (scan) => {
    return scan.thumbnail || scan.factCheckReport?.thumbnail || scan.factCheckReport?.originalImageBase64 || scan.factCheckReport?.originalImage || '';
  };

  const filteredScans = useMemo(() => {
    const filterStart = performance.now();
    const results = scans.filter(scan => {
      const q = searchQuery.toLowerCase();
      const verdict = (scan.prediction || '').toLowerCase();
      const detailedVerdict = (scan.factCheckReport?.verdict || '').toLowerCase();
      const matchesSearch = !q || 
        (scan.content || '').toLowerCase().includes(q) || 
        (scan._id || '').toLowerCase().includes(q) ||
        verdict.includes(q) ||
        detailedVerdict.includes(q) ||
        (scan.riskLevel || '').toLowerCase().includes(q) ||
        (scan.provider || '').toLowerCase().includes(q);
      const matchesType = filterType === 'all' || scan.type === filterType;

      let matchesVerdict = true;
      if (filterVerdict !== 'all') {
        if (filterVerdict === 'authentic') {
          matchesVerdict = ['authentic', 'likely authentic', 'real'].includes(detailedVerdict) || verdict === 'real';
        } else if (filterVerdict === 'suspicious') {
          matchesVerdict = detailedVerdict === 'suspicious';
        } else if (filterVerdict === 'deepfake') {
          matchesVerdict = ['deepfake', 'likely manipulated', 'fake'].includes(detailedVerdict) || verdict === 'fake';
        }
      }

      let matchesRisk = true;
      if (filterRisk !== 'all') {
        const risk = (scan.riskLevel || '').toLowerCase();
        if (filterRisk === 'low') {
          matchesRisk = ['low', 'very low', 'safe'].includes(risk);
        } else if (filterRisk === 'medium') {
          matchesRisk = risk === 'medium';
        } else if (filterRisk === 'high') {
          matchesRisk = ['high', 'critical'].includes(risk);
        }
      }

      let matchesDate = true;
      if (filterDate !== 'all') {
        const scanTime = new Date(scan.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now - scanTime);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (filterDate === 'today') {
          matchesDate = scanTime.toDateString() === now.toDateString();
        } else if (filterDate === 'week') {
          matchesDate = diffDays <= 7;
        } else if (filterDate === 'month') {
          matchesDate = diffDays <= 30;
        }
      }

      let matchesProvider = true;
      if (filterProvider !== 'all') {
        matchesProvider = (scan.provider || 'Gemini').toLowerCase() === filterProvider.toLowerCase();
      }

      let matchesDuration = true;
      if (filterDuration !== 'all') {
        const duration = scan.factCheckReport?.metadata?.duration || 0;
        if (filterDuration === 'short') {
          matchesDuration = duration < 30;
        } else if (filterDuration === 'medium') {
          matchesDuration = duration >= 30 && duration <= 120;
        } else if (filterDuration === 'long') {
          matchesDuration = duration > 120;
        }
      }

      return matchesSearch && matchesType && matchesVerdict && matchesRisk && matchesDate && matchesProvider && matchesDuration;
    });
    console.log(`[PERF] [History] Filtered ${scans.length} scans down to ${results.length} in ${(performance.now() - filterStart).toFixed(2)}ms`);
    return results;
  }, [scans, searchQuery, filterType, filterVerdict, filterRisk, filterDate, filterProvider, filterDuration]);

  const sortedScans = useMemo(() => {
    const sortStart = performance.now();
    const sorted = [...filteredScans].sort((a, b) => {
      if (sortBy === 'newest') return (b.createdAt || '').localeCompare(a.createdAt || '');
      if (sortBy === 'oldest') return (a.createdAt || '').localeCompare(b.createdAt || '');
      
      if (sortBy === 'auth-highest') {
        const trustA = a.factCheckReport?.trustScore ?? a.credibilityScore ?? 50;
        const trustB = b.factCheckReport?.trustScore ?? b.credibilityScore ?? 50;
        return trustB - trustA;
      }
      if (sortBy === 'auth-lowest') {
        const trustA = a.factCheckReport?.trustScore ?? a.credibilityScore ?? 50;
        const trustB = b.factCheckReport?.trustScore ?? b.credibilityScore ?? 50;
        return trustA - trustB;
      }
      
      if (sortBy === 'risk-highest') {
        const getRiskNum = (s) => {
          const r = (s.riskLevel || '').toLowerCase();
          if (r === 'critical') return 4;
          if (r === 'high') return 3;
          if (r === 'medium') return 2;
          return 1;
        };
        return getRiskNum(b) - getRiskNum(a);
      }
      if (sortBy === 'risk-lowest') {
        const getRiskNum = (s) => {
          const r = (s.riskLevel || '').toLowerCase();
          if (r === 'critical') return 4;
          if (r === 'high') return 3;
          if (r === 'medium') return 2;
          return 1;
        };
        return getRiskNum(a) - getRiskNum(b);
      }
      return 0;
    });
    console.log(`[PERF] [History] Sorted ${filteredScans.length} scans in ${(performance.now() - sortStart).toFixed(2)}ms`);
    return sorted;
  }, [filteredScans, sortBy]);

  const totalPages = Math.ceil(sortedScans.length / itemsPerPage);
  const paginatedScans = sortedScans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Statistics for history summary bar
  const totalCount = scans.length;
  const safeCount = scans.filter(s => s.prediction === 'Real').length;
  const threatCount = scans.filter(s => s.prediction === 'Fake').length;
  const avgTrust = totalCount > 0 ? Math.round(scans.reduce((sum, s) => sum + (s.credibilityScore || s.confidenceScore || 50), 0) / totalCount) : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 20 } }
  };

  const SkeletonCard = () => (
    <div className="glass-panel p-5 border-white/5 animate-pulse flex flex-col justify-between h-[180px]">
      <div>
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/5 shrink-0" />
          <div className="flex-grow space-y-2">
            <div className="h-3 bg-white/5 rounded w-1/3" />
            <div className="h-2 bg-white/5 rounded w-1/2" />
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <div className="h-2.5 bg-white/5 rounded w-full" />
          <div className="h-2.5 bg-white/5 rounded w-5/6" />
        </div>
      </div>
      <div className="h-8 bg-white/5 rounded-xl w-full mt-4" />
    </div>
  );


  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="max-w-6xl mx-auto px-4 py-10 bg-cyber-bg min-h-[calc(100vh-4rem)]"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-wider text-white font-display uppercase flex items-center gap-2">
            <History className="text-cyber-primary" />
            <span>{t('pageTitle')}</span>
          </h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">{t('pageSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={fetchHistory}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold font-display uppercase rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors text-slate-300"
        >
          <RefreshCw size={13} />
          <span>{t('reloadRegistry')}</span>
        </button>
      </motion.div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Summary Statistics Bar */}
      {totalCount > 0 && (
        <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: t('totalRecords'), value: totalCount, color: '#7C3AED' },
            { label: t('safe'), value: safeCount, color: '#22C55E' },
            { label: t('threats'), value: threatCount, color: '#EF4444' },
            { label: t('avgTrust'), value: `${avgTrust}%`, color: '#00C2FF' },
          ].map((s, i) => (
            <div key={i} className="glass-panel p-3 border-white/5 flex items-center gap-3">
              <div className="w-1 h-8 rounded-full" style={{ background: s.color }} />
              <div>
                <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</span>
                <span className="block text-lg font-black text-white">{s.value}</span>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Filter and Search Bar */}
      <motion.div variants={itemVariants} className="glass-panel p-4 border-white/5 shadow-md mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search size={15} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t('searchPlaceholder')}
              className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-cyber-primary/60 transition-colors"
            />
          </div>

          {/* Type Filters */}
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            {['all', 'text', 'url', 'image', 'video'].map((type) => (
              <button
                type="button"
                key={type}
                onClick={() => {
                  setFilterType(type);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold font-display uppercase tracking-wider transition-all duration-300 border ${
                  filterType === type 
                    ? 'bg-cyber-success/10 text-cyber-success border-[#6EE7B7]/25 shadow-glow-green' 
                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {type === 'all' ? t('typeAll') :
                 type === 'text' ? t('typeText') :
                 type === 'url' ? t('typeUrl') :
                 type === 'image' ? t('typeImage') :
                 type === 'video' ? t('typeVideo') : type}
              </button>
            ))}
          </div>
        </div>

        {/* Sorting, Verdict Filter, and Exports Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-white/5">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {/* Verdict Filter */}
            <select
              value={filterVerdict}
              onChange={(e) => {
                setFilterVerdict(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white/5 border border-white/5 rounded-xl px-3.5 py-2 text-[10px] font-bold font-display text-slate-300 uppercase tracking-wider focus:outline-none focus:border-cyber-primary/60"
            >
              <option value="all">{t('allVerdicts')}</option>
              <option value="authentic">{t('authentic')}</option>
              <option value="suspicious">{t('suspicious')}</option>
              <option value="deepfake">{t('deepfake')}</option>
            </select>

            {/* Risk Filter */}
            <select
              value={filterRisk}
              onChange={(e) => {
                setFilterRisk(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white/5 border border-white/5 rounded-xl px-3.5 py-2 text-[10px] font-bold font-display text-slate-300 uppercase tracking-wider focus:outline-none focus:border-cyber-primary/60"
            >
              <option value="all">{t('allRisks')}</option>
              <option value="low">{t('lowRisk')}</option>
              <option value="medium">{t('mediumRisk')}</option>
              <option value="high">{t('highRisk')}</option>
            </select>

            {/* Date Filter */}
            <select
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white/5 border border-white/5 rounded-xl px-3.5 py-2 text-[10px] font-bold font-display text-slate-300 uppercase tracking-wider focus:outline-none focus:border-cyber-primary/60"
            >
              <option value="all">{t('allDates')}</option>
              <option value="today">{t('today')}</option>
              <option value="week">{t('last7Days')}</option>
              <option value="month">{t('last30Days')}</option>
            </select>

            {/* Provider Filter */}
            <select
              value={filterProvider}
              onChange={(e) => {
                setFilterProvider(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white/5 border border-white/5 rounded-xl px-3.5 py-2 text-[10px] font-bold font-display text-slate-300 uppercase tracking-wider focus:outline-none focus:border-cyber-primary/60"
            >
              <option value="all">{t('allProviders')}</option>
              <option value="gemini">Gemini</option>
              <option value="openai">OpenAI</option>
            </select>

            {/* Duration Filter */}
            <select
              value={filterDuration}
              onChange={(e) => {
                setFilterDuration(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white/5 border border-white/5 rounded-xl px-3.5 py-2 text-[10px] font-bold font-display text-slate-300 uppercase tracking-wider focus:outline-none focus:border-cyber-primary/60"
            >
              <option value="all">{t('allDurations')}</option>
              <option value="short">{t('shortDuration')}</option>
              <option value="medium">{t('mediumDuration')}</option>
              <option value="long">{t('longDuration')}</option>
            </select>

            <button
              type="button"
              onClick={() => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scans, null, 2));
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute("href", dataStr);
                downloadAnchor.setAttribute("download", "truthshield_history_export.json");
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
              }}
              className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/15 hover:border-cyan-500/30 text-cyan-400 text-[10px] font-bold font-display uppercase tracking-wider rounded-xl transition-all"
            >
              {t('exportJson')}
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/15 border border-[#6EE7B7]/15 hover:border-[#6EE7B7]/30 text-cyber-success text-[10px] font-bold font-display uppercase tracking-wider rounded-xl transition-all"
            >
              {t('exportCsv')}
            </button>
            <button
              type="button"
              onClick={handleClearAllHistory}
              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/15 hover:border-rose-500/30 text-rose-400 text-[10px] font-bold font-display uppercase tracking-wider rounded-xl transition-all"
            >
              {t('clearHistory')}
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <span className="text-[10px] font-bold font-display text-slate-500 uppercase tracking-widest">{t('sortLabel')}</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white/5 border border-white/5 rounded-xl px-3.5 py-2 text-[10px] font-bold font-display text-slate-300 uppercase tracking-wider focus:outline-none focus:border-cyber-primary/60"
            >
              <option value="newest">{t('newestFirst')}</option>
              <option value="oldest">{t('oldestFirst')}</option>
              <option value="auth-highest">{t('highestAuthenticity')}</option>
              <option value="auth-lowest">{t('lowestAuthenticity')}</option>
              <option value="risk-highest">{t('highestRisk')}</option>
              <option value="risk-lowest">{t('lowestRisk')}</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Results Summary */}
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {t('resultsSummary', { count: paginatedScans.length, total: sortedScans.length })}
          {searchQuery && t('resultsMatching', { query: searchQuery })}
        </span>
      </motion.div>

      {/* Scan Log Listing */}
      {loading && !hasFetched && scans.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : scans.length === 0 ? (
        <motion.div variants={itemVariants} className={`glass-panel p-12 text-center border-white/5 shadow-inner ${loading ? 'opacity-60' : ''}`}>
          <History size={36} className={`mx-auto text-slate-600 mb-3 ${loading ? 'animate-pulse' : ''}`} />
          <h3 className="font-bold text-slate-355 font-display uppercase tracking-wider text-sm">{t('noScansMatch')}</h3>
          <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">{t('noScansMatchDesc')}</p>
        </motion.div>
      ) : (
        <>
          {loading && (
            <div className="mb-4 flex items-center justify-center gap-2 py-1 px-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl w-fit mx-auto">
              <RefreshCw size={12} className="animate-spin text-cyan-400" />
              <span className="text-[9px] text-cyan-400 font-bold tracking-widest uppercase">{t('Syncing records...')}</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {paginatedScans.map((scan) => {
              const isFake = scan.prediction === 'Fake';
              const thumbSrc = getThumbnailSrc(scan);
              const trustVal = scan.factCheckReport?.trustScore ?? scan.credibilityScore ?? scan.confidenceScore ?? 50;
              const scanTypeColors = {
                image: '#A855F7',
                video: '#7C3AED',
                text: '#00C2FF',
                url: '#22C55E',
              };
              const accentColor = scanTypeColors[scan.type] || '#7C3AED';
              const riskBadge = scan.riskLevel || 'Low';
              const riskBadgeColors = {
                Low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                High: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
              };

              return (
                <motion.div 
                  key={scan._id}
                  variants={itemVariants}
                  whileHover={{ y: -3, boxShadow: `0 8px 24px ${accentColor}12` }}
                  className="glass-panel p-5 border-white/5 shadow-sm hover:border-white/10 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Header Row */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-xl border border-white/5 overflow-hidden shrink-0">
                        {(scan.type === 'image' || scan.type === 'video') && thumbSrc ? (
                          <img 
                            src={thumbSrc} 
                            className="w-full h-full object-cover" 
                            alt="Thumb" 
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div style={{ color: accentColor }}>{getScanIcon(scan.type)}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block font-extrabold text-xs text-slate-200 truncate" title={scan.content}>{scan.content}</span>
                        <div className="flex flex-wrap items-center gap-x-2 mt-1">
                          <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border" style={{ color: accentColor, borderColor: `${accentColor}30`, background: `${accentColor}10` }}>
                            {scan.type === 'text' ? t('typeText') :
                             scan.type === 'url' ? t('typeUrl') :
                             scan.type === 'image' ? t('typeImage') :
                             scan.type === 'video' ? t('typeVideo') : scan.type}
                          </span>
                          <span className="flex items-center gap-0.5 text-[8px] text-slate-500 uppercase tracking-widest font-semibold">
                            <Calendar size={9} />
                            {new Date(scan.createdAt).toLocaleString()}
                          </span>
                          {scan.provider && (
                            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-slate-400 font-mono text-[7px] font-bold">
                              {scan.provider}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`shrink-0 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                        isFake ? 'bg-rose-500/10 text-[#EF4444] border-rose-500/20' : 'bg-emerald-500/10 text-[#22C55E] border-emerald-500/20'
                      }`}>
                        {scan.prediction === 'Fake' ? t('deepfake') :
                         scan.prediction === 'Real' ? t('authentic') : scan.prediction}
                      </span>
                    </div>

                    {/* Scores Row */}
                    <div className="flex items-center gap-2 mb-3">
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
                          {riskBadge === 'Low' ? t('lowRisk') :
                           riskBadge === 'Medium' ? t('mediumRisk') :
                           riskBadge === 'High' ? t('highRisk') :
                           riskBadge === 'Critical' ? t('deepfake') : riskBadge}
                        </span>
                      </div>
                    </div>

                    {/* Duration / Resolution Row */}
                    {(scan.type === 'video' || scan.type === 'image') && (
                      <div className="grid grid-cols-2 gap-2 mt-2 bg-white/[0.01] border border-white/5 rounded-lg p-2 text-[9px] mb-2 font-mono">
                        {scan.type === 'video' && (
                          <div>
                            <span className="block text-[6px] text-slate-500 uppercase tracking-widest font-sans">{t('duration')}</span>
                            <span className="text-white font-mono">{scan.factCheckReport?.metadata?.duration ? Number(scan.factCheckReport.metadata.duration).toFixed(1) + 's' : 'N/A'}</span>
                          </div>
                        )}
                        <div>
                          <span className="block text-[6px] text-slate-500 uppercase tracking-widest font-sans">{t('resolution')}</span>
                          <span className="text-white font-mono">{(scan.factCheckReport?.metadata?.width && scan.factCheckReport?.metadata?.height) ? `${scan.factCheckReport.metadata.width}x${scan.factCheckReport.metadata.height}` : 'N/A'}</span>
                        </div>
                      </div>
                    )}

                    {/* Investigation ID */}
                    <div className="flex items-center gap-1.5 text-[8px] font-mono text-slate-600 truncate" title={scan._id}>
                      <Hash size={9} />
                      <span>{scan._id}</span>
                    </div>
                  </div>

                  {/* Action Buttons Footer */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                    {/* Delete with confirmation */}
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(scan._id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 text-[10px] font-bold font-display uppercase tracking-wider rounded-xl transition-all"
                    >
                      <Trash2 size={10} />
                      <span>{t('delete')}</span>
                    </button>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleDownloadPDF(e, scan._id)}
                        disabled={downloadingId === scan._id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-slate-300 text-[10px] font-bold font-display uppercase tracking-wider rounded-xl transition-all disabled:opacity-50"
                      >
                        {downloadingId === scan._id ? <RefreshCw size={10} className="animate-spin" /> : <Download size={10} />}
                        <span>{t('pdf')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedScan(scan)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4E2EF2]/10 hover:bg-[#4E2EF2]/20 border border-[#4E2EF2]/20 hover:border-[#4E2EF2]/40 text-[#A855F7] text-[10px] font-bold font-display uppercase tracking-wider rounded-xl transition-all"
                      >
                        <Eye size={10} />
                        <span>{t('quickView')}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <motion.div variants={itemVariants} className="flex justify-center items-center gap-4 mt-8">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 disabled:opacity-30 rounded-xl text-xs font-bold transition-all uppercase tracking-widest font-display"
              >
                {t('prev')}
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let page;
                  if (totalPages <= 7) {
                    page = i + 1;
                  } else if (currentPage <= 4) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    page = totalPages - 6 + i;
                  } else {
                    page = currentPage - 3 + i;
                  }
                  return (
                    <button
                      type="button"
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                        currentPage === page 
                          ? 'bg-[#4E2EF2]/20 text-[#A855F7] border border-[#4E2EF2]/30' 
                          : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 disabled:opacity-30 rounded-xl text-xs font-bold transition-all uppercase tracking-widest font-display"
              >
                {t('next')}
              </button>
            </motion.div>
          )}
        </>
      )}

      {/* Selected Report Inspection Overlay Modal */}
      <AnimatePresence>
        {selectedScan && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0F1A]/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-panel p-2.5 border-white/10 relative shadow-glow-mixed"
            >
              <button
                type="button"
                onClick={() => setSelectedScan(null)}
                className="absolute top-4 right-4 z-50 px-3.5 py-2 bg-white/5 border border-white/5 hover:bg-rose-500/10 hover:text-rose-455 hover:border-rose-500/20 rounded-xl text-slate-400 font-bold font-display uppercase text-[10px] transition-all"
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

      {/* Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070B18]/85 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-md glass-panel p-6 border-rose-500/20 relative shadow-2xl bg-cyber-bg"
            >
              <h3 className="text-sm font-extrabold text-white font-display uppercase tracking-wider mb-2 text-rose-500 flex items-center gap-2">
                <AlertTriangle size={18} />
                <span>{t('confirmDeleteTitle')}</span>
              </h3>
              <p className="text-xs text-slate-350 leading-relaxed mb-6 font-sans">
                {t('confirmDeleteDesc', { id: deleteConfirmId })}
              </p>
              <div className="flex justify-end gap-3 font-display uppercase text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteScan(deleteConfirmId)}
                  className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-450 transition-all"
                >
                  {t('permanentlyDelete')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default HistoryPage;
