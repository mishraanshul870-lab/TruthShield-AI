import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Download, AlertTriangle, Cpu, Globe, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import API_BASE from "../api";

const ResultCard = ({ result, onScanAgain }) => {
  const { t, i18n } = useTranslation(['url', 'urlResults', 'commonResults']);

  const translateAI = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    // Split by paragraphs to translate sections individually
    const sections = text.split('\n\n');
    const translatedSections = sections.map(sec => {
      const clean = sec.trim().replace(/\s+/g, ' ');
      if (!clean) return '';
      
      const trans = t(clean, { ns: 'urlResults', keySeparator: false, nsSeparator: false });
      return trans || sec;
    });
    
    return translatedSections.filter(Boolean).join('\n\n');
  };

  const [downloading, setDownloading] = useState(false);

  if (!result) return null;

  const isFake = result.prediction === 'Fake';
  
  // Custom colors based on risk
  const riskColors = {
    Low: { text: 'text-cyber-success', border: 'border-cyber-success/20', bg: 'bg-cyber-success/5', shadow: 'shadow-glow-green', fill: '#6EE7B7' },
    Medium: { text: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5', shadow: 'shadow-glow-violet', fill: '#f59e0b' },
    High: { text: 'text-rose-500', border: 'border-rose-500/20', bg: 'bg-rose-500/5', shadow: 'shadow-glow-purple', fill: '#ef4444' }
  };
  
  const risk = result.riskLevel || 'Low';
  const theme = riskColors[risk] || riskColors.Low;

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const scanId = result.scanId || result._id;
      const lang = i18n.language || 'en';
      const response = await fetch(`${API_BASE}/api/analyze/report/${scanId}?lang=${lang}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('PDF download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `TruthShield_Report_${scanId || 'scan'}.pdf`;
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
      alert(t('pdfDownloadError'));
    } finally {
      setDownloading(false);
    }
  };

  // Threat Index value
  const riskScore = isFake ? result.confidenceScore : (100 - result.confidenceScore);
  const strokeDashoffset = 251.2 - (riskScore / 100) * 251.2;

  return (
    <div className="space-y-6">
      {/* Failover Notification banner */}
      {result.switchedToOpenAI && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold flex items-center gap-2.5 shadow-md">
          <AlertTriangle size={16} className="shrink-0 animate-bounce text-amber-400" />
          <span>{t('quotaWarning')}</span>
        </div>
      )}

      <div className="glass-panel p-6 md:p-8 border-[#4E2EF2]/10 relative overflow-hidden shadow-glow-mixed transition-all duration-500">
        {/* Background gradient light */}
        <div 
          className="absolute top-0 right-0 w-80 h-80 opacity-5 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, #4E2EF2 0%, #6EE7B7 50%, transparent 100%)` }}
        ></div>

        {/* Header Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${theme.bg} ${theme.text} border ${theme.border} ${theme.shadow}`}>
              {isFake ? <ShieldAlert size={36} className="animate-pulse text-rose-500" /> : <ShieldCheck size={36} className="text-cyber-success" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold font-display uppercase tracking-widest text-slate-400">{t('verdict')}</h2>
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black tracking-widest uppercase border ${
                  isFake ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-cyber-success/10 text-cyber-success border-cyber-success/20'
                }`}>
                  {t(result.prediction) || result.prediction}
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-white font-display mt-1">
                {isFake ? t('syntheticDetected') : t('verifiedOriginal')}
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-1 flex flex-wrap items-center gap-x-4">
                <span>{t('referenceSignature')}<span className="text-slate-300">{result.scanId || result._id || t('pending')}</span></span>
                {result.provider && (
                  <span>{t('aiProvider')}<span className={result.provider === 'OpenAI' ? 'text-cyber-primary' : 'text-emerald-400'}>{result.provider === 'OpenAI' ? t('openaiGpt') : t('googleGemini')}</span></span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold font-display uppercase rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-white transition-all disabled:opacity-50"
          >
            {downloading ? <RefreshCw size={14} className="animate-spin text-cyber-secondary" /> : <Download size={14} />}
            <span>{downloading ? t('compilingPdf') : t('downloadPdfDossier')}</span>
          </button>
          
          {onScanAgain && (
            <button
              onClick={onScanAgain}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold font-display uppercase rounded-xl gradient-btn"
            >
              <span>{t('auditNewTarget')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Donut Score & Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b border-white/5">
        
        {/* Risk Donut incorporating linear gradient */}
        <div className="flex flex-col items-center justify-center p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
          <span className="text-xs font-bold font-display uppercase text-slate-400 tracking-wider mb-4">{t('threatIndex')}</span>
          <div className="relative flex items-center justify-center">
            <svg className="w-28 h-28 transform -rotate-90">
              <defs>
                <linearGradient id="donutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4E2EF2" />
                  <stop offset="30%" stopColor="#A855F7" />
                  <stop offset="75%" stopColor="#6EE7B7" />
                  <stop offset="100%" stopColor="#B7F7D4" />
                </linearGradient>
              </defs>
              <circle
                cx="56"
                cy="56"
                r="40"
                className="stroke-[#1E293B]/40"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="56"
                cy="56"
                r="40"
                stroke="url(#donutGradient)"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="251.2"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white">{riskScore}%</span>
              <span className={`text-[9px] font-extrabold uppercase tracking-widest font-display ${theme.text}`}>{t(risk) || risk} {t('riskLabel')}</span>
            </div>
          </div>
        </div>

        {/* Stats Columns */}
        <div className="md:col-span-2 flex flex-col justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Stat 1 */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyber-primary/10 text-cyber-secondary border border-cyber-primary/15">
                <Cpu size={20} />
              </div>
              <div>
                <span className="block text-[10px] font-bold font-display uppercase tracking-wider text-slate-500">{t('inferenceConfidence')}</span>
                <span className="text-base font-extrabold text-white mt-0.5 block">{result.confidenceScore}%</span>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyber-success/10 text-cyber-success border border-[#6EE7B7]/15">
                <Globe size={20} />
              </div>
              <div>
                <span className="block text-[10px] font-bold font-display uppercase tracking-wider text-slate-500">{t('sourceCredibilityIndex')}</span>
                <span className="text-base font-extrabold text-white mt-0.5 block">{result.credibilityScore}/100</span>
              </div>
            </div>

          </div>

          {/* Progress bar matching theme */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold font-display uppercase tracking-wider text-slate-400 pl-1">
              <span>{t('threatLevel')}</span>
              <span>{riskScore}%</span>
            </div>
            <div className="w-full h-3 bg-[#1E293B]/40 rounded-full overflow-hidden border border-white/5 p-[1.5px]">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-[#4E2EF2] via-[#A855F7] via-[#6EE7B7] to-[#B7F7D4] transition-all duration-1000"
                style={{ width: `${riskScore}%` }}
              ></div>
            </div>
          </div>
        </div>

      </div>

      {/* AI Explanation Report */}
      <div className="pt-6">
        <h3 className="text-xs font-bold font-display uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2 pl-1">
          <Cpu size={14} className="text-cyber-secondary" />
          <span>{t('automatedExplanatoryDossier')}</span>
        </h3>
        <div className="bg-[#121829]/40 border border-white/5 p-5 rounded-2xl leading-relaxed text-sm text-slate-300 font-sans shadow-inner">
          <p className="whitespace-pre-line leading-relaxed">{translateAI(result.explanation)}</p>
        </div>
      </div>

      {/* AI Explainability Highlight Overlays */}
      {result.type === 'text' && result.suspiciousSentences && result.suspiciousSentences.length > 0 && (
        <div className="mt-6 border-t border-white/5 pt-6">
          <h3 className="text-xs font-bold font-display uppercase tracking-widest text-slate-400 mb-3 pl-1">
            {t('suspiciousHighlights')}
          </h3>
          <div className="space-y-2">
            {result.suspiciousSentences.map((sent, i) => (
              <div key={i} className="flex gap-3 items-start bg-rose-500/5 border border-rose-500/10 p-3.5 rounded-2xl hover:bg-rose-500/10 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0"></span>
                <p className="text-xs font-mono text-rose-300 leading-relaxed italic">"{sent}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.type === 'image' && result.manipulatedRegions && result.manipulatedRegions.length > 0 && (
        <div className="mt-6 border-t border-white/5 pt-6">
          <h3 className="text-xs font-bold font-display uppercase tracking-widest text-slate-400 mb-3 pl-1">
            {t('visualAnomalyMap')}
          </h3>
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Cybersecurity Mesh Bounding Simulator */}
            <div className="relative w-64 h-44 bg-[#0D111A] border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,41,0)_95%,rgba(78,46,242,0.15)_95%)] bg-[size:100%_20px] animate-[pulse_3s_infinite]"></div>
              <div className="absolute top-0 left-0 w-full h-0.5 bg-cyber-secondary shadow-glow-violet animate-[bounce_4s_infinite]"></div>
              
              <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">{t('imageMeshCanvas')}</span>
              
              {result.manipulatedRegions.map((region, idx) => (
                <div 
                  key={idx}
                  className="absolute border-2 border-rose-500 bg-rose-500/10 animate-pulse flex items-start justify-start p-1"
                  style={{
                    left: `${region.x}%`,
                    top: `${region.y}%`,
                    width: `${region.width}%`,
                    height: `${region.height}%`
                  }}
                >
                  <span className="text-[6px] text-white bg-rose-600 px-0.5 rounded-sm font-mono uppercase tracking-tighter">
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>

            {/* Region legends */}
            <div className="space-y-2.5 w-full">
              {result.manipulatedRegions.map((region, idx) => (
                <div key={idx} className="bg-slate-900/40 border border-white/5 p-3 rounded-2xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-extrabold text-white block uppercase tracking-wider">{t('anomaly')} #{idx + 1}: {region.label}</span>
                    <span className="text-[9px] font-mono text-slate-500 mt-1 block">
                      {t('gridIndex')}: X={region.x}% Y={region.y}% (Dim: {region.width}x{region.height}%)
                    </span>
                  </div>
                  <span className="text-[8px] font-bold font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                    {t('composite')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultCard;
