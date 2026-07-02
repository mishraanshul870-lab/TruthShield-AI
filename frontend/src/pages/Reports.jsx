import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileCheck, Download, RefreshCw, FileText, Link2, Image, Video, Calendar, Search, 
  Eye, Trash2, AlertTriangle 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import API_BASE from "../api";
import ResultCard from '../components/ResultCard';
import FactCheckResult from '../components/FactCheckResult';
import ImageForensicResult from '../components/ImageForensicResult';
import VideoForensicResult from '../components/VideoForensicResult';

const Reports = () => {
  const { t, i18n } = useTranslation('reports');
  const [reports, setReports] = useState(() => {
    try {
      const cached = localStorage.getItem('cached_reports');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      console.error('[Reports] Failed to read from cache:', e);
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const viewReportId = searchParams.get('view');

  useEffect(() => {
    if (viewReportId && reports.length > 0) {
      const found = reports.find(r => r._id === viewReportId);
      if (found) {
        setSelectedReport(found);
      } else {
        setSelectedReport(null);
      }
    } else {
      setSelectedReport(null);
    }
  }, [viewReportId, reports]);

  const handleDeleteReport = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/analyze/history/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(t('deleteReportError'));
      setDeleteConfirmId(null);
      fetchReports();
    } catch (err) {
      console.error(err);
      alert(err.message || t('deleteReportError'));
      setDeleteConfirmId(null);
    }
  };

  const getThumbnailSrc = (scan) => {
    return scan.thumbnail || scan.factCheckReport?.thumbnail || scan.factCheckReport?.originalImageBase64 || scan.factCheckReport?.originalImage || '';
  };


  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/analyze/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(t('loadReportsError'));
      
      const data = await response.json();
      try {
        const slicedData = Array.isArray(data) ? data.slice(0, 25) : data;
        localStorage.setItem('cached_reports', JSON.stringify(slicedData));
      } catch (cacheErr) {
        console.warn('[Reports] Offline storage caching failed:', cacheErr.message);
      }

      setReports(data);
      setHasFetched(true);
    } catch (err) {
      console.error(err);
      setError(t('serverActiveError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    window.addEventListener('scan-updated', fetchReports);
    return () => window.removeEventListener('scan-updated', fetchReports);
  }, []);

  const handleDownloadPDF = async (scanId) => {
    setDownloadingId(scanId);
    try {
      const token = localStorage.getItem('token');
      const lang = i18n.language || 'en';
      const response = await fetch(`${API_BASE}/api/analyze/report/${scanId}?lang=${lang}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error(t('pdfDownloadError'));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TruthShield_Report_${scanId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert(t('pdfDownloadError'));
    } finally {
      setDownloadingId(null);
    }
  };

  const getScanIcon = (type) => {
    switch (type) {
      case 'text': return <FileText size={16} className="text-cyan-400" />;
      case 'url': return <Link2 size={16} className="text-[#6EE7B7]" />;
      case 'image': return <Image size={16} className="text-blue-400" />;
      case 'video': return <Video size={16} className="text-[#A855F7]" />;
      default: return <FileText size={16} />;
    }
  };

  const filteredReports = useMemo(() => {
    const results = reports.filter(scan => {
      return (scan.content || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
             (scan.explanation || '').toLowerCase().includes(searchQuery.toLowerCase());
    });
    return results;
  }, [reports, searchQuery]);

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
    <div className="max-w-6xl mx-auto px-4 py-10 bg-cyber-bg min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-wider text-white font-display uppercase flex items-center gap-2">
            <FileCheck className="text-cyber-primary" />
            <span>{t('pageTitle')}</span>
          </h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">{t('pageSubtitle')}</p>
        </div>
        <button
          onClick={fetchReports}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold font-display uppercase rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors text-slate-300"
        >
          <RefreshCw size={13} />
          <span>{t('syncRecords')}</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="glass-panel p-4 border-white/5 shadow-md mb-8">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search size={15} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-cyber-primary/60 transition-colors"
          />
        </div>
      </div>

      {loading && !hasFetched && reports.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : reports.length === 0 ? (
        <div className={`glass-panel p-12 text-center border-white/5 shadow-inner ${loading ? 'opacity-60' : ''}`}>
          <FileCheck size={36} className={`mx-auto text-slate-600 mb-3 ${loading ? 'animate-pulse' : ''}`} />
          <h3 className="font-bold text-slate-350 font-display uppercase tracking-wider text-sm">{t('noReports')}</h3>
          <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">{t('noReportsDesc')}</p>
        </div>
      ) : (
        <>
          {loading && (
            <div className="mb-4 flex items-center justify-center gap-2 py-1 px-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl w-fit mx-auto animate-pulse">
              <RefreshCw size={12} className="animate-spin text-cyan-400" />
              <span className="text-[9px] text-cyan-400 font-bold tracking-widest uppercase">{t('Syncing records...')}</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReports.map((report) => {
            const isFake = report.prediction === 'Fake';
            const thumbSrc = getThumbnailSrc(report);
            const trustVal = report.factCheckReport?.trustScore ?? report.credibilityScore ?? report.confidenceScore ?? 50;
            const scanTypeColors = {
              image: '#A855F7',
              video: '#7C3AED',
              text: '#00C2FF',
              url: '#22C55E',
            };
            const accentColor = scanTypeColors[report.type] || '#7C3AED';
            const riskBadge = report.riskLevel || 'Low';
            const riskBadgeColors = {
              Low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
              Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              High: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
              Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
            };

            return (
              <div 
                key={report._id}
                className="glass-panel p-5 border-white/5 shadow-sm hover:border-[#4E2EF2]/20 hover:shadow-glow-purple transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-xl border border-white/5 overflow-hidden shrink-0">
                        {(report.type === 'image' || report.type === 'video') && thumbSrc ? (
                          <img 
                            src={thumbSrc} 
                            className="w-full h-full object-cover" 
                            alt="Thumb" 
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div style={{ color: accentColor }}>{getScanIcon(report.type)}</div>
                        )}
                      </div>
                      <div>
                        <span className="block font-bold text-xs font-display text-slate-200 uppercase tracking-wider">
                          {report.type === 'text' ? t('text') :
                           report.type === 'url' ? t('url') :
                           report.type === 'image' ? t('image') :
                           report.type === 'video' ? t('video') : report.type} {t('dossier')}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">
                          <Calendar size={10} />
                          {new Date(report.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                      isFake ? 'bg-rose-500/10 text-rose-450 border-rose-500/20' : 'bg-cyber-success/10 text-cyber-success border-cyber-success/20'
                    }`}>
                      {report.prediction === 'Fake' ? t('Fake') || 'Fake' :
                       report.prediction === 'Real' ? t('Authentic') || 'Authentic' : report.prediction}
                    </span>
                  </div>

                  <p className="text-xs text-slate-250 font-bold mb-1 truncate" title={report.content}>
                    {t('targetLabel')}{report.content}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                    <span>{t('trustScore')}<span className="font-extrabold text-white">{trustVal}%</span></span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${riskBadgeColors[riskBadge] || riskBadgeColors.Low}`}>
                      {riskBadge === 'Low' ? t('Low') :
                       riskBadge === 'Medium' ? t('Medium') :
                       riskBadge === 'High' ? t('High') :
                       riskBadge === 'Critical' ? t('Critical') : riskBadge} {t('risk')}
                    </span>
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-white/5 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-600">
                    <span>ID: {report._id}</span>
                    {report.provider && (
                      <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-slate-400 text-[8px] font-bold">
                        {report.provider}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(report._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 text-[10px] font-bold font-display uppercase tracking-wider rounded-xl transition-all"
                    >
                      <Trash2 size={11} />
                      <span>{t('delete')}</span>
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSearchParams({ view: report._id })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4E2EF2]/10 hover:bg-[#4E2EF2]/20 border border-[#4E2EF2]/20 hover:border-[#4E2EF2]/40 text-[#A855F7] text-[10px] font-bold font-display uppercase tracking-wider rounded-xl transition-all"
                      >
                        <Eye size={11} />
                        <span>{t('viewReport')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadPDF(report._id)}
                        disabled={downloadingId === report._id}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-slate-300 text-xs font-bold font-display uppercase tracking-wider rounded-xl transition-all disabled:opacity-50"
                      >
                        {downloadingId === report._id ? (
                          <RefreshCw size={12} className="animate-spin text-cyber-secondary" />
                        ) : (
                          <Download size={12} className="text-cyber-secondary" />
                        )}
                        <span>{t('pdf')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </>
      )}

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
              <p className="text-xs text-slate-300 leading-relaxed mb-6 font-sans">
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
                  onClick={() => handleDeleteReport(deleteConfirmId)}
                  className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-450 transition-all"
                >
                  {t('permanentlyDelete')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Report Inspection Overlay Modal */}
      <AnimatePresence>
        {selectedReport && (
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
                onClick={() => setSearchParams(prev => {
                  const next = new URLSearchParams(prev);
                  next.delete('view');
                  return next;
                }, { replace: true })}
                className="absolute top-4 right-4 z-50 px-3.5 py-2 bg-white/5 border border-white/5 hover:bg-rose-500/10 hover:text-rose-450 hover:border-rose-500/20 rounded-xl text-slate-400 font-bold font-display uppercase text-[10px] transition-all"
              >
                {t('closeDossier')}
              </button>
              <div className="p-4 pt-10">
                {selectedReport.type === 'text' && selectedReport.factCheckReport ? (
                  <FactCheckResult result={selectedReport} />
                ) : selectedReport.type === 'image' && selectedReport.factCheckReport ? (
                  <ImageForensicResult result={{ ...selectedReport.factCheckReport, _id: selectedReport._id, scanId: selectedReport._id }} />
                ) : selectedReport.type === 'video' && selectedReport.factCheckReport ? (
                  <VideoForensicResult result={selectedReport.factCheckReport || selectedReport} />
                ) : (
                  <ResultCard result={selectedReport} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reports;
