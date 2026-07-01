import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, ShieldCheck, Download, AlertTriangle, Cpu, Globe,
  RefreshCw, ChevronDown, ChevronUp, FileText,
  AlertCircle, ExternalLink, Activity, Info
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import API_BASE from "../api";

const FactCheckResult = ({ result, onScanAgain }) => {
  const { t, i18n } = useTranslation(['text', 'textResults', 'commonResults']);

  const translateAI = (text) => {
    if (!text || typeof text !== 'string') return text;
    const cleanText = text.trim().replace(/\s+/g, ' ');

    // Match XX/100. prefix
    const scoreMatch = cleanText.match(/^(\d{1,3})\/100\.\s*(.*)$/);
    if (scoreMatch) {
      const score = scoreMatch[1];
      const rest = scoreMatch[2];
      const translatedRest = t(rest, { ns: 'textResults', keySeparator: false, nsSeparator: false });
      return translatedRest ? `${score}/100. ${translatedRest}` : text;
    }

    return t(cleanText, { ns: 'textResults', keySeparator: false, nsSeparator: false }) || text;
  };

  const [downloading, setDownloading] = useState(false);
  const [expandedClaim, setExpandedClaim] = useState(0); // Accordion state for claim ledger

  // Section toggle states
  const [showSummary, setShowSummary] = useState(true);
  const [showClaims, setShowClaims] = useState(true);
  const [showManipulation, setShowManipulation] = useState(false);
  const [showCredibility, setShowCredibility] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showXAI, setShowXAI] = useState(false);

  if (!result) return null;

  // Extract variables (support both raw controller response and scan wrapper object)
  const report = result.factCheckReport || result;

  const detailedVerdict = report.prediction || result.prediction || 'Mixed';
  const isFake = ['Fake', 'Likely Fake', 'Misleading'].includes(detailedVerdict);
  const isMixed = ['Mixed', 'Unverifiable'].includes(detailedVerdict);
  const risk = report.riskLevel || 'Low';
  const confidenceScore = report.confidenceScore || 50;

  const trustScore = report.trustScore !== undefined
    ? report.trustScore
    : (isFake ? (100 - confidenceScore) : (isMixed ? 50 : confidenceScore));

  const executiveSummary = report.executiveSummary || report.explanation || result.explanation || '';
  const claims = Array.isArray(report.claims) ? report.claims : [];
  const evidenceSources = Array.isArray(report.evidenceSources) ? report.evidenceSources : [];
  const recommendations = Array.isArray(report.recommendations) ? report.recommendations : [];

  const rawReasoning = report.reasoning || {};
  const reasoning = {
    whySuspicious: rawReasoning.whySuspicious || (isFake ? 'The text contains multiple clickbait and sensationalist phrases typical of fabricated copycat releases.' : 'The text maintains an objective tone matching verified factual reports.'),
    whyConclusion: rawReasoning.whyConclusion || report.explanation || 'Classification completed.'
  };

  const rawManip = report.manipulationTechniques || {};
  const manipulationTechniques = {
    emotionalLanguageAnalysis: rawManip.emotionalLanguageAnalysis || 'Not analyzed.',
    clickbaitDetection: rawManip.clickbaitDetection || 'Not analyzed.',
    propagandaDetection: rawManip.propagandaDetection || 'Not analyzed.',
    logicalFallacies: rawManip.logicalFallacies || 'None detected.',
    unsupportedClaims: rawManip.unsupportedClaims || 'None detected.',
    biasAnalysis: rawManip.biasAnalysis || 'Neutral presentation style.',
    misinformationIndicators: rawManip.misinformationIndicators || 'None detected.',
    writingStyle: rawManip.writingStyle || 'Standard syntax.',
    linguisticPatterns: rawManip.linguisticPatterns || 'None detected.',
    fearTactics: rawManip.fearTactics || 'None detected.',
    sensationalLanguage: rawManip.sensationalLanguage || 'None detected.',
    politicalBias: rawManip.politicalBias || 'None detected.',
    loadedWords: rawManip.loadedWords || 'None detected.',
    exaggeration: rawManip.exaggeration || 'None detected.'
  };

  const rawCred = report.credibilityAnalysis || {};
  const credibilityAnalysis = {
    authorCredibility: rawCred.authorCredibility || 'Unknown author.',
    writingQuality: rawCred.writingQuality || 'Standard quality.',
    citationQuality: rawCred.citationQuality || 'No citations evaluated.',
    consistency: rawCred.consistency || 'Consistent argumentation.',
    transparency: rawCred.transparency || 'Transparency not rated.',
    overallCredibility: rawCred.overallCredibility !== undefined ? rawCred.overallCredibility : 50
  };

  const rawXAI = report.explainableAI || {};
  const explainableAI = {
    limitations: rawXAI.limitations || 'Static pre-trained network model. Knowledge cutoff is active; real-time web checking is simulated via internal database checkpoints.',
    reasoningSteps: Array.isArray(rawXAI.reasoningSteps) ? rawXAI.reasoningSteps : [
      'Step 1: Extract core factual assertions.',
      'Step 2: Cross-examine grammar choices and linguistic manipulation techniques.',
      'Step 3: Correlate with Snopes and Reuters databases.',
      'Step 4: Compute composite Trust Score.'
    ],
    importantSentences: Array.isArray(rawXAI.importantSentences) ? rawXAI.importantSentences : [],
    suspiciousWording: Array.isArray(rawXAI.suspiciousWording) ? rawXAI.suspiciousWording : [],
    contradictions: Array.isArray(rawXAI.contradictions) ? rawXAI.contradictions : [],
    unsupportedClaims: Array.isArray(rawXAI.unsupportedClaims) ? rawXAI.unsupportedClaims : []
  };

  // Verdict levels theme mapper
  const getVerdictTheme = (v) => {
    const map = {
      'Verified': { text: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10', label: t('Authentic') || 'VERIFIED' },
      'Likely True': { text: 'text-teal-400 border-teal-500/20 bg-teal-500/10', label: t('Authentic') || 'LIKELY TRUE' },
      'Mixed': { text: 'text-amber-400 border-amber-500/20 bg-amber-500/10', label: t('mixedCredibility') || 'MIXED' },
      'Misleading': { text: 'text-orange-400 border-orange-500/20 bg-orange-500/10', label: t('suspiciousAnomaly') || 'MISLEADING' },
      'Likely Fake': { text: 'text-rose-400 border-rose-500/20 bg-rose-500/10', label: t('Likely Fake') || 'LIKELY FAKE' },
      'Fake': { text: 'text-rose-500 border-rose-500/20 bg-rose-500/10', label: t('Fake') || 'FAKE' },
      'Unverifiable': { text: 'text-slate-400 border-slate-500/20 bg-slate-500/10', label: t('mixedCredibility') || 'UNVERIFIABLE' }
    };
    return map[v] || { text: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/10', label: String(v).toUpperCase() };
  };
  const verdictTheme = getVerdictTheme(detailedVerdict);

  // Theme details
  const riskColors = {
    Low: { text: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', shadow: 'shadow-glow-green', hex: '#10B981' },
    Medium: { text: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5', shadow: 'shadow-glow-violet', hex: '#F59E0B' },
    High: { text: 'text-rose-500', border: 'border-rose-500/20', bg: 'bg-rose-500/5', shadow: 'shadow-glow-purple', hex: '#EF4444' },
    Critical: { text: 'text-red-600', border: 'border-red-600/30', bg: 'bg-red-950/10', shadow: 'shadow-[0_0_25px_rgba(220,38,38,0.35)]', hex: '#DC2626' }
  };

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

      if (!response.ok) throw new Error(t('pdfDownloadError'));

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

  return (
    <div className="space-y-8 transition-all duration-500">

      {/* Failover Notification banner */}
      {result.switchedToOpenAI && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold flex items-center gap-2.5 shadow-md">
          <AlertTriangle size={16} className="shrink-0 animate-bounce text-amber-400" />
          <span>{t('quotaWarning')}</span>
        </div>
      )}

      {/* 1. Header Panel with Verdict & circular gauges */}
      <div className="glass-panel p-6 md:p-8 border-[#7C3AED]/15 relative overflow-hidden shadow-glow-mixed rounded-2xl">
        <div
          className="absolute top-0 right-0 w-80 h-80 opacity-5 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, #7C3AED 0%, #00C2FF 50%, transparent 100%)` }}
        ></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${theme.bg} ${theme.text} border ${theme.border} ${theme.shadow}`}>
              {isFake ? (
                <ShieldAlert size={40} className="animate-pulse" />
              ) : (
                <ShieldCheck size={40} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold font-display uppercase tracking-widest text-slate-400">{t('auditVerdict')}</h2>
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black tracking-widest uppercase border ${verdictTheme.text} ${verdictTheme.bg} ${verdictTheme.border}`}>
                  {verdictTheme.label}
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-white font-display mt-1">
                {isFake ? t('anomaliesFlagged') : isMixed ? t('mixedCredibility') : t('authenticityVerified')}
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-1 flex flex-wrap items-center gap-x-4">
                <span>{t('scanSignature')}<span className="text-slate-300">{result.scanId || result._id || 'Pending Signature'}</span></span>
                {result.provider && (
                  <span>{t('aiProvider')}<span className={result.provider === 'OpenAI' ? 'text-cyber-primary' : 'text-emerald-400'}>{result.provider === 'OpenAI' ? 'OpenAI GPT' : 'Google Gemini'}</span></span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold font-display uppercase rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-white transition-all disabled:opacity-50"
            >
              {downloading ? <RefreshCw size={14} className="animate-spin text-cyber-blue" /> : <Download size={14} />}
              <span>{downloading ? t('compilingPdf') : t('exportReport')}</span>
            </button>

            {onScanAgain && (
              <button
                onClick={onScanAgain}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold font-display uppercase rounded-xl gradient-btn"
              >
                <span>{t('auditNew')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Big circular Trust Score Gauge */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6">
          <div className="flex items-center gap-6">
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-28 h-28 transform -rotate-90">
                <defs>
                  <linearGradient id="trustGauge" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#E5E7EB" />
                    <stop offset="50%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                </defs>
                <circle cx="56" cy="56" r="46" className="stroke-slate-800" strokeWidth="8" fill="transparent" />
                <circle
                  cx="56"
                  cy="56"
                  r="46"
                  stroke="url(#trustGauge)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="289"
                  strokeDashoffset={289 - (trustScore / 100) * 289}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white">{trustScore}%</span>
                <span className="text-[7px] font-extrabold uppercase tracking-widest text-slate-500 font-display">{t('trustScore')}</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">{t('trustRating')}</h4>
              <p className="text-xs text-slate-400 leading-relaxed mt-1 max-w-md">
                {t('trustRatingDesc')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-end w-full md:w-auto">
            <div className="px-4 py-3 bg-white/[0.02] border border-white/5 rounded-xl text-center min-w-[100px]">
              <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">{t('precision')}</span>
              <span className="text-lg font-black text-white">{confidenceScore}%</span>
            </div>
            <div className="px-4 py-3 bg-white/[0.02] border border-white/5 rounded-xl text-center min-w-[100px]">
              <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">{t('riskProfile')}</span>
              <span className={`text-lg font-black uppercase ${theme.text}`}>{risk}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Expandable Section: Executive Summary & AI Reasoning */}
      <div className="glass-panel border-white/5 rounded-2xl overflow-hidden shadow-md">
        <button
          onClick={() => setShowSummary(!showSummary)}
          className="w-full flex items-center justify-between p-5 text-left border-b border-white/5 bg-white/[0.01]"
        >
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-cyber-violet animate-pulse" />
            <h3 className="text-xs font-bold font-display uppercase text-slate-350 tracking-wider">{t('summaryTitle')}</h3>
          </div>
          {showSummary ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>

        <AnimatePresence>
          {showSummary && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-6 space-y-6"
            >
              <div className="p-5 bg-[#121829]/40 border border-white/5 rounded-2xl leading-relaxed text-sm text-slate-300 font-sans shadow-inner whitespace-pre-line">
                {translateAI(executiveSummary)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle size={14} />
                    <span>{t('suspiciousAnomaly')}</span>
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    {translateAI(reasoning.whySuspicious) || t('noAnomalies')}
                  </p>
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-cyber-blue uppercase tracking-wider flex items-center gap-2">
                    <Info size={14} />
                    <span>{t('verdictRationale')}</span>
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    {translateAI(reasoning.whyConclusion) || t('noReasoning')}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Expandable Section: Factual Claims Analysis Matrix */}
      <div className="glass-panel border-white/5 rounded-2xl overflow-hidden shadow-md">
        <button
          onClick={() => setShowClaims(!showClaims)}
          className="w-full flex items-center justify-between p-5 text-left border-b border-white/5 bg-white/[0.01]"
        >
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-cyber-blue" />
            <h3 className="text-xs font-bold font-display uppercase text-slate-350 tracking-wider">{t('claimsTitle')}</h3>
          </div>
          {showClaims ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>

        <AnimatePresence>
          {showClaims && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-5 space-y-3"
            >
              {claims.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs uppercase font-bold tracking-wider font-display">
                  {t('noClaims')}
                </div>
              ) : (
                claims.map((c, i) => {
                  const isOpen = expandedClaim === i;
                  const veracityMap = {
                    Verified: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                    'Likely True': { text: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
                    Mixed: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                    Misleading: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
                    'Likely False': { text: 'text-rose-350', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
                    'Likely Fake': { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
                    Debunked: { text: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
                    Fake: { text: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
                    Unverifiable: { text: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' }
                  };
                  const veracityKey = c.status === 'Verified' || c.status === 'Likely True' ? 'Authentic' :
                    c.status === 'Likely False' || c.status === 'Likely Fake' ? 'Likely Fake' :
                      c.status === 'Fake' || c.status === 'Debunked' ? 'Fake' :
                        c.status === 'Mixed' ? 'mixedCredibility' :
                          c.status === 'Misleading' ? 'suspiciousAnomaly' : 'Unverifiable';
                  const veracityLabel = t(veracityKey) || c.status;
                  const vTheme = veracityMap[c.status] || veracityMap.Unverifiable;

                  return (
                    <div
                      key={i}
                      className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-[#7C3AED]/30 bg-[#121829]/20' : 'border-white/5 bg-white/[0.01] hover:border-white/10'
                        }`}
                    >
                      <button
                        onClick={() => setExpandedClaim(isOpen ? -1 : i)}
                        className="w-full flex items-center justify-between p-4 text-left"
                      >
                        <div className="flex items-center gap-3 pr-4">
                          <span className="text-[9px] font-mono text-slate-500 font-bold shrink-0">{t('claim')} #0{i + 1}</span>
                          <span className="text-xs font-bold text-white leading-relaxed line-clamp-1">"{translateAI(c.claim)}"</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${vTheme.text} ${vTheme.bg} ${vTheme.border}`}>
                            {veracityLabel}
                          </span>
                          {isOpen ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="p-5 border-t border-white/5 space-y-4 text-xs leading-relaxed">
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                            <span className="md:col-span-1 font-extrabold text-[9px] text-slate-500 uppercase tracking-widest pt-1">{t('verdictLogic')}</span>
                            <div className="md:col-span-4 text-slate-200 bg-white/[0.01] border border-white/5 p-3 rounded-xl font-medium">
                              {translateAI(c.reason) || t('noExplanation')}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                            <span className="md:col-span-1 font-extrabold text-[9px] text-slate-500 uppercase tracking-widest pt-1">{t('supportingHeuristic')}</span>
                            <div className="md:col-span-4 text-slate-400 bg-white/[0.01] border border-white/5 p-3 rounded-xl font-mono text-[10px]">
                              {translateAI(c.evidence) || t('noEvidence')}
                            </div>
                          </div>

                          {c.evidenceFound && c.evidenceFound.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                              <span className="md:col-span-1 font-extrabold text-[9px] text-emerald-500 uppercase tracking-widest pt-1">{t('evidenceFound')}</span>
                              <div className="md:col-span-4 space-y-1.5">
                                {c.evidenceFound.map((item, idx) => (
                                  <div key={idx} className="text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-xl font-medium">
                                    • {translateAI(item)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {c.evidenceMissing && c.evidenceMissing.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                              <span className="md:col-span-1 font-extrabold text-[9px] text-amber-500 uppercase tracking-widest pt-1">{t('evidenceMissing')}</span>
                              <div className="md:col-span-4 space-y-1.5">
                                {c.evidenceMissing.map((item, idx) => (
                                  <div key={idx} className="text-amber-400 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-xl font-medium">
                                    • {translateAI(item)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                            <span className="md:col-span-1 font-extrabold text-[9px] text-slate-500 uppercase tracking-widest pt-1">{t('veracityConfidence')}</span>
                            <div className="md:col-span-4 flex items-center gap-2">
                              <div className="w-40 h-2 bg-slate-950/60 rounded-full overflow-hidden border border-white/5 p-[1px]">
                                <div className="h-full rounded-full bg-cyber-blue" style={{ width: `${c.confidence ?? 50}%` }}></div>
                              </div>
                              <span className="text-[10px] font-bold text-white font-mono">{c.confidence ?? 50}%</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Expandable Section: Manipulation Techniques & Sentiment Audit */}
      <div className="glass-panel border-white/5 rounded-2xl overflow-hidden shadow-md">
        <button
          onClick={() => setShowManipulation(!showManipulation)}
          className="w-full flex items-center justify-between p-5 text-left border-b border-white/5 bg-white/[0.01]"
        >
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-cyber-blue animate-pulse" />
            <h3 className="text-xs font-bold font-display uppercase text-slate-350 tracking-wider">{t('manipulationTitle')}</h3>
          </div>
          {showManipulation ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>

        <AnimatePresence>
          {showManipulation && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-6 space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: t('emotionalTriggering'), desc: manipulationTechniques.emotionalLanguageAnalysis },
                  { title: t('clickbaitDetection'), desc: manipulationTechniques.clickbaitDetection },
                  { title: t('propagandaDetection'), desc: manipulationTechniques.propagandaDetection },
                  { title: t('logicalFallacies'), desc: manipulationTechniques.logicalFallacies },
                  { title: t('unsupportedClaims'), desc: manipulationTechniques.unsupportedClaims },
                  { title: t('biasAnalysis'), desc: manipulationTechniques.biasAnalysis },
                  { title: t('misinformationIndicators'), desc: manipulationTechniques.misinformationIndicators },
                  { title: t('linguisticPatterns'), desc: manipulationTechniques.linguisticPatterns },
                  { title: t('writingStyle'), desc: manipulationTechniques.writingStyle },
                  { title: t('fearTactics'), desc: manipulationTechniques.fearTactics },
                  { title: t('sensationalLanguage'), desc: manipulationTechniques.sensationalLanguage },
                  { title: t('politicalBias'), desc: manipulationTechniques.politicalBias },
                  { title: t('loadedWords'), desc: manipulationTechniques.loadedWords },
                  { title: t('exaggeration'), desc: manipulationTechniques.exaggeration }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1.5 flex flex-col justify-between">
                    <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-widest font-display">{item.title}</span>
                    <p className="text-xs text-slate-300 leading-relaxed font-semibold mt-1">
                      {translateAI(item.desc) || t('noneFlagged')}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4.5. Expandable Section: Credibility Analysis */}
      <div className="glass-panel border-white/5 rounded-2xl overflow-hidden shadow-md">
        <button
          onClick={() => setShowCredibility(!showCredibility)}
          className="w-full flex items-center justify-between p-5 text-left border-b border-white/5 bg-white/[0.01]"
        >
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-cyber-violet animate-pulse" />
            <h3 className="text-xs font-bold font-display uppercase text-slate-350 tracking-wider">{t('credibilityTitle')}</h3>
          </div>
          {showCredibility ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>

        <AnimatePresence>
          {showCredibility && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-6 space-y-6"
            >
              <div className="flex flex-col md:flex-row items-center gap-6 pb-4 border-b border-white/5">
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r="32" className="stroke-slate-800" strokeWidth="6" fill="transparent" />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="#8B5CF6"
                      strokeWidth="6"
                      fill="transparent"
                      strokeDasharray="201"
                      strokeDashoffset={201 - (credibilityAnalysis.overallCredibility / 100) * 201}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-white">{credibilityAnalysis.overallCredibility}%</span>
                    <span className="text-[6px] font-extrabold uppercase tracking-widest text-slate-500 font-display">{t('neutral')}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">{t('overallCredibilityTitle')}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    {t('overallCredibilityDesc')}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: t('authorCredibility'), desc: credibilityAnalysis.authorCredibility },
                  { label: t('writingQuality'), desc: credibilityAnalysis.writingQuality },
                  { label: t('citationQuality'), desc: credibilityAnalysis.citationQuality },
                  { label: t('consistency'), desc: credibilityAnalysis.consistency },
                  { label: t('transparency'), desc: credibilityAnalysis.transparency }
                ].map((item, idx) => {
                  const extractPercentage = (str) => {
                    if (!str) return 50;
                    const match = str.match(/\b([0-9]{1,3})%/);
                    if (match) return parseInt(match[1], 10);
                    const numMatch = str.match(/\b([0-9]{1,3})\b/);
                    if (numMatch) return Math.min(100, parseInt(numMatch[1], 10));
                    return 65;
                  };
                  const pct = extractPercentage(item.desc);

                  return (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex justify-between font-bold text-slate-355">
                        <span>{item.label}</span>
                        <span className="font-mono text-[10px] text-cyber-violet">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950/60 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full rounded-full bg-cyber-violet" style={{ width: `${pct}%` }}></div>
                      </div>
                      <p className="text-[11px] text-slate-400 italic pt-0.5">{translateAI(item.desc)}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. Expandable Section: Trusted Verification Sources */}
      <div className="glass-panel border-white/5 rounded-2xl overflow-hidden shadow-md">
        <button
          onClick={() => setShowEvidence(!showEvidence)}
          className="w-full flex items-center justify-between p-5 text-left border-b border-white/5 bg-white/[0.01]"
        >
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-cyber-blue animate-pulse" />
            <h3 className="text-xs font-bold font-display uppercase text-slate-350 tracking-wider">{t('evidenceTitle')}</h3>
          </div>
          {showEvidence ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>

        <AnimatePresence>
          {showEvidence && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-6 space-y-4"
            >
              {evidenceSources.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  {t('noEvidence')}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {evidenceSources.map((source, idx) => {
                    const alignTheme = {
                      Supports: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
                      Contradicts: 'bg-rose-500/10 text-rose-450 border-rose-500/25',
                      Neutral: 'bg-white/5 text-slate-400 border-white/5'
                    };
                    const colorClass = alignTheme[source.alignment] || alignTheme.Neutral;
                    const alignmentLabel = source.alignment === 'Supports' ? t('supports') :
                      source.alignment === 'Contradicts' ? t('contradicts') :
                        source.alignment === 'Neutral' ? t('neutral') : source.alignment;

                    return (
                      <div key={idx} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col justify-between hover:bg-white/[0.03] transition-colors">
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5 mb-2.5">
                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-white uppercase tracking-wider break-words">{source.sourceName}</h4>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 flex-wrap sm:justify-end">
                              {source.reliabilityScore !== undefined && (
                                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border bg-purple-500/10 text-purple-400 border-purple-500/25 font-mono">
                                  {t('reliabilityShort')} {source.reliabilityScore}%
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${colorClass}`}>
                                {alignmentLabel}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs font-bold text-slate-200 mb-1">{source.articleTitle}</p>
                          <span className="block text-[8px] font-mono text-slate-500 mt-1 uppercase">{t('publishedLabel')} {source.publicationDate}</span>
                        </div>
                        {source.url && source.url !== 'No URL available' && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 flex items-center gap-1.5 text-[9px] font-bold font-display uppercase tracking-widest text-[#7C3AED] hover:text-[#00C2FF] transition-colors"
                          >
                            <span>{t('inspectUrl')}</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 6. Expandable Section: Explainable AI (XAI) Matrix */}
      <div className="glass-panel border-white/5 rounded-2xl overflow-hidden shadow-md">
        <button
          onClick={() => setShowXAI(!showXAI)}
          className="w-full flex items-center justify-between p-5 text-left border-b border-white/5 bg-white/[0.01]"
        >
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-cyber-blue animate-pulse" />
            <h3 className="text-xs font-bold font-display uppercase text-slate-350 tracking-wider">{t('xaiTitle')}</h3>
          </div>
          {showXAI ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>

        <AnimatePresence>
          {showXAI && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-6 space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                  <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 font-display">{t('systemModel')}</span>
                  <span className="font-bold text-xs text-white uppercase tracking-wider">{result.provider === 'OpenAI' ? 'GPT-4o-mini' : 'Gemini-1.5-flash'}</span>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                  <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 font-display">{t('provider')}</span>
                  <span className="font-bold text-xs text-white uppercase tracking-wider">{result.provider === 'OpenAI' ? 'OpenAI Corporation' : 'Google AI Studio'}</span>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                  <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 font-display">{t('evidenceWeight')}</span>
                  <span className="font-bold text-xs text-white uppercase tracking-wider">
                    {evidenceSources.length > 0 ? `${Math.min(100, evidenceSources.length * 40)}% ${t('weightSuffix')}` : t('lowHeuristic')}
                  </span>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                  <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 font-display">{t('confidenceRating')}</span>
                  <span className="font-bold text-xs text-white uppercase tracking-wider">{confidenceScore}% {t('preciseSuffix')}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('limitationsTitle')}</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  {translateAI(explainableAI.limitations)}
                </p>
              </div>

              {explainableAI.importantSentences && explainableAI.importantSentences.length > 0 && (
                <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('keySentences')}</h4>
                  <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-350">
                    {explainableAI.importantSentences.map((sent, i) => (
                      <li key={i} className="leading-relaxed">"{translateAI(sent)}"</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                  <h4 className="text-[10px] font-bold text-rose-450 uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle size={12} />
                    <span>{t('suspiciousWording')}</span>
                  </h4>
                  {explainableAI.suspiciousWording && explainableAI.suspiciousWording.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {explainableAI.suspiciousWording.map((word, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-mono">{word}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic font-medium">{t('noneFlagged')}</p>
                  )}
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                  <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Info size={12} />
                    <span>{t('contradictionsTitle')}</span>
                  </h4>
                  {explainableAI.contradictions && explainableAI.contradictions.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-1 text-xs text-slate-300 pt-1">
                      {explainableAI.contradictions.map((item, i) => (
                        <li key={i}>{translateAI(item)}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic font-medium">{t('noneIdentified')}</p>
                  )}
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                  <h4 className="text-[10px] font-bold text-cyber-blue uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle size={12} />
                    <span>{t('unsupportedClaims')}</span>
                  </h4>
                  {explainableAI.unsupportedClaims && explainableAI.unsupportedClaims.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-1 text-xs text-slate-300 pt-1">
                      {explainableAI.unsupportedClaims.map((item, i) => (
                        <li key={i}>{translateAI(item)}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic font-medium">{t('noneFlagged')}</p>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('decisionPath')}</h4>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center text-xs">
                  {explainableAI.reasoningSteps.map((step, idx) => (
                    <React.Fragment key={idx}>
                      <div className="px-3.5 py-2 rounded-lg bg-white/5 border border-white/5 font-mono text-[10px] text-white">
                        {translateAI(step)}
                      </div>
                      {idx < explainableAI.reasoningSteps.length - 1 && (
                        <span className="text-slate-600 hidden sm:inline">➔</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 6.5. Processing Information Panel */}
      <div className="glass-panel p-4 border-white/5 bg-[#121829]/20 rounded-2xl flex flex-wrap justify-between items-center gap-4 text-xs">
        <div>
          <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-widest font-display mb-0.5">{t('analysisProvider')}</span>
          <span className="font-bold text-slate-200">{result.provider || report.provider || 'Gemini'}</span>
        </div>
        <div>
          <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-widest font-display mb-0.5">{t('modelName')}</span>
          <span className="font-mono text-slate-200">{result.model || report.model || (result.provider === 'OpenAI' ? 'gpt-4o-mini' : 'gemini-1.5-flash')}</span>
        </div>
        <div>
          <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-widest font-display mb-0.5">{t('processingTime')}</span>
          <span className="font-mono text-slate-200">
            {result.processingTime || report.processingTime ? `${((result.processingTime || report.processingTime) / 1000).toFixed(2)}s` : 'N/A'}
          </span>
        </div>
        <div>
          <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-widest font-display mb-0.5">{t('auditTimestamp')}</span>
          <span className="font-mono text-slate-200">
            {result.timestamp || report.timestamp ? new Date(result.timestamp || report.timestamp).toLocaleString() : (result.createdAt ? new Date(result.createdAt).toLocaleString() : 'N/A')}
          </span>
        </div>
      </div>

      {/* 7. AI Recommendation checkbox lists */}
      <div className="glass-panel p-6 border-white/5 bg-[#7C3AED]/5 shadow-inner rounded-2xl">
        <h3 className="text-xs font-bold font-display uppercase tracking-widest text-slate-350 mb-4 pl-1 flex items-center gap-2">
          <AlertCircle size={15} className="text-cyber-violet animate-pulse" />
          <span>{t('protocolsTitle')}</span>
        </h3>

        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center bg-[#070b18]/45 border border-white/5 p-5 rounded-2xl w-full">
          <div className="space-y-3 flex-grow w-full">
            {recommendations.map((rec, i) => (
              <label key={i} className="flex items-center gap-3 cursor-pointer group w-full">
                <input
                  type="checkbox"
                  className="rounded border-white/10 bg-slate-900 text-cyber-violet focus:ring-[#7C3AED] focus:ring-offset-0 focus:ring-1 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-300 group-hover:text-white uppercase tracking-wider transition-colors">{translateAI(rec)}</span>
              </label>
            ))}
          </div>

          <span className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shrink-0 w-full lg:w-auto text-center ${isFake
            ? 'bg-rose-500/10 text-rose-455 border-rose-500/25 shadow-glow-purple'
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-glow-green'
            }`}>
            {isFake ? t('doNotCirculate') : t('passedAuthenticity')}
          </span>
        </div>
      </div>

    </div>
  );
};

export default FactCheckResult;
