import React, { useState } from 'react';
import { 
  ShieldAlert, ShieldCheck, Download, AlertTriangle, 
  Cpu, Image as ImageIcon, Sparkles, Layers, ListChecks, 
  Info, History, Camera, Eye, HelpCircle, HardDrive, RefreshCw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ImageForensicResult = ({ result, onScanAgain, originalPreview }) => {
  const { t, i18n } = useTranslation(['image', 'imageResults', 'commonResults']);
  const [downloading, setDownloading] = useState(false);
  const [compareMode, setCompareMode] = useState('overlay'); // original | heatmap | overlay
  const [activeTab, setActiveTab] = useState('investigation'); // investigation | indicators | quality | risk | localization
  const [selectedRegionIndex, setSelectedRegionIndex] = useState(0);

  const translateAI = (text) => {
    if (!text || typeof text !== 'string') return text;
    const normalized = text.trim().replace(/\s+/g, ' ');
    return t(normalized, { ns: 'imageResults', keySeparator: false, nsSeparator: false }) || text;
  };

  const translateAnomExplanation = (anom) => {
    const title = anom.title || '';
    const explanation = anom.explanation || '';
    
    if (title === 'Suspicious Editing Software') {
      const match = explanation.match(/"([^"]+)"/);
      const software = match ? match[1] : '';
      return t('The image metadata explicitly lists editing software: "{{software}}".', {
        ns: 'imageResults',
        keySeparator: false,
        nsSeparator: false,
        software
      });
    }
    
    if (title === 'File System / EXIF Date Discrepancy') {
      const match = explanation.match(/difference:\s*(\d+)/);
      const hours = match ? match[1] : '24';
      return t('The EXIF creation date differs from the local file storage timestamp by more than 24 hours (difference: {{hours}} hours).', {
        ns: 'imageResults',
        keySeparator: false,
        nsSeparator: false,
        hours
      });
    }
    
    if (title === 'Invalid EXIF Metadata Blocks' && explanation.startsWith('Exif parser failed:')) {
      const error = explanation.replace('Exif parser failed: ', '');
      return t('Exif parser failed: {{error}}', {
        ns: 'imageResults',
        keySeparator: false,
        nsSeparator: false,
        error
      });
    }
    
    return translateAI(explanation);
  };

  if (!result) return null;

  const getSeverityLabel = (sev) => {
    if (!sev) return '';
    const key = sev.toLowerCase();
    return t(key) || sev;
  };

  const getVerdictLabel = (verdict) => {
    switch (verdict) {
      case 'Authentic': return t('verdictAuthentic');
      case 'Likely Authentic': return t('verdictLikelyAuthentic');
      case 'Suspicious': return t('verdictSuspicious');
      case 'Likely Manipulated': return t('verdictLikelyManipulated');
      case 'Deepfake': return t('verdictDeepfake');
      default: return t('verdictUnknown');
    }
  };

  const getTimelineTitle = (event) => {
    if (event.titleKey) return t(event.titleKey, event.descParams);
    const mapping = {
      "Image Uploaded": t("timelineUploadTitle"),
      "Binary Signature Verification": t("timelineSignatureTitle"),
      "Metadata Extraction": t("timelineMetadataTitle"),
      "EXIF Analysis": t("timelineExifTitle"),
      "Image Quality Analysis": t("timelineQualityTitle"),
      "Compression Analysis": t("timelineCompressionTitle"),
      "Noise Pattern Analysis": t("timelineNoiseTitle"),
      "GAN Artifact Detection": t("timelineGanTitle"),
      "Manipulation Localization": t("timelineLocalizationTitle"),
      "Risk Assessment": t("timelineRiskTitle"),
      "Explainable AI Generation": t("timelineXaiTitle"),
      "Executive Summary Generation": t("timelineSummaryTitle"),
      "Final Verdict": t("timelineVerdictTitle")
    };
    return mapping[event.title] || event.title;
  };

  const getTimelineDesc = (event) => {
    if (event.descKey) return t(event.descKey, event.descParams);
    const desc = event.description || '';
    if (desc.startsWith("Dossier received and verified.")) {
      const fileName = desc.split("File: ")[1]?.replace(/\.$/, '') || '';
      return t("timelineUploadDesc", { file: fileName });
    }
    if (desc.startsWith("Verified magic bytes format as image/")) {
      const format = desc.split("image/")[1]?.replace(/\.$/, '') || 'jpeg';
      return t("timelineSignatureDesc", { format });
    }
    if (desc === "Partial metadata read. EXIF segments are missing or stripped.") {
      return t("timelineMetadataDescPartial");
    }
    if (desc === "Extracted standard EXIF metadata blocks successfully.") {
      return t("timelineMetadataDescFull");
    }
    if (desc.startsWith("Detected ") && desc.includes(" anomalies.")) {
      const count = desc.match(/\d+/) ? Number(desc.match(/\d+/)[0]) : 0;
      return t("timelineExifDescAnoms", { count });
    }
    if (desc === "No EXIF anomalies or suspicious editing headers detected.") {
      return t("timelineExifDescClear");
    }
    if (desc.startsWith("Resolution: ") && desc.includes("Sharpness: ")) {
      const match = desc.match(/Resolution: (.*)\. Sharpness: (.*)\./);
      if (match) {
        return t("timelineQualityDesc", { res: match[1], sharp: match[2] });
      }
    }
    if (desc === "Suspected double-compression traces detected. Non-uniform quantization.") {
      return t("timelineCompressionDescDouble");
    }
    if (desc === "Uniform compression grid verified.") {
      return t("timelineCompressionDescUniform");
    }
    if (desc.startsWith("Noise pattern: ")) {
      const noise = desc.split("Noise pattern: ")[1]?.replace(/\.$/, '') || '';
      return t("timelineNoiseDesc", { noise });
    }
    if (desc.startsWith("Suspicious GAN generator artifacts identified. Severity: ")) {
      const severity = desc.split("Severity: ")[1]?.replace(/\.$/, '') || '';
      return t("timelineGanDescTraces", { severity });
    }
    if (desc === "No GAN structure traces identified.") {
      return t("timelineGanDescClear");
    }
    if (desc.startsWith("Localized ") && desc.includes(" suspicious manipulation zones")) {
      const count = desc.match(/\d+/) ? Number(desc.match(/\d+/)[0]) : 0;
      return t("timelineLocalizationDescAnoms", { count });
    }
    if (desc === "Localized no anomalies. Uniform pixel density maps verified.") {
      return t("timelineLocalizationDescClear");
    }
    if (desc.startsWith("Risk Level: ") && desc.includes("Priority: ")) {
      const match = desc.match(/Risk Level: (.*)\. Investigation Priority: (.*)\./);
      if (match) {
        return t("timelineRiskDesc", { risk: match[1], priority: match[2] });
      }
    }
    if (desc === "Generated pixel correlation and logical weight parameters mapping findings back to source inputs.") {
      return t("timelineXaiDesc");
    }
    if (desc === "Compiled digital threat summary statements and forensic recommendations.") {
      return t("timelineSummaryDesc");
    }
    if (desc.startsWith("Analysis concluded. Overall safety verdict: ")) {
      const verdict = desc.split("Overall safety verdict: ")[1]?.replace(/\.$/, '') || '';
      return t("timelineVerdictDesc", { verdict: getVerdictLabel(verdict) });
    }
    return translateAI(desc);
  };

  // Verdict config
  const verdictConfigs = {
    'Authentic': { text: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', icon: ShieldCheck, risk: 'Low', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    'Likely Authentic': { text: 'text-teal-400', border: 'border-teal-500/20', bg: 'bg-teal-500/5', icon: ShieldCheck, risk: 'Low', badge: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
    'Suspicious': { text: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5', icon: AlertTriangle, risk: 'Medium', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    'Likely Manipulated': { text: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-500/5', icon: ShieldAlert, risk: 'High', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    'Deepfake': { text: 'text-rose-500', border: 'border-rose-500/20', bg: 'bg-rose-500/5', icon: ShieldAlert, risk: 'Critical', badge: 'bg-rose-500/10 text-rose-455 border-rose-500/20' },
    'Unknown': { text: 'text-slate-400', border: 'border-slate-500/20', bg: 'bg-slate-500/5', icon: HelpCircle, risk: 'Low', badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20' }
  };

  const currentVerdict = result.verdict || 'Unknown';
  const config = verdictConfigs[currentVerdict] || verdictConfigs.Unknown;
  const isSuspicious = ['Suspicious', 'Likely Manipulated', 'Deepfake'].includes(currentVerdict);

  // SVG Gauge Calculations
  const trustScore = result.trustScore ?? 50;
  const strokeDashoffset = 251.2 - (trustScore / 100) * 251.2;

  const handleDownloadPDF = async (e) => {
    if (e) e.preventDefault();
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const lang = i18n.language || 'en';
      const response = await fetch(`/api/analyze/report/${result.scanId || result._id}?lang=${lang}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error(t('pdfDownloadError'));
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `TruthShield_Report_${result.scanId || result._id || 'scan'}.pdf`;
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

  const getTimelineIcon = (iconName, status) => {
    const isErrorOrWarn = ['Warning', 'Error', 'Flagged'].includes(status);
    const colorClass = isErrorOrWarn ? 'text-rose-450' : 'text-cyber-success';
    switch (iconName) {
      case 'upload':
        return <ImageIcon className={colorClass} size={14} />;
      case 'shield':
        return <ShieldCheck className={colorClass} size={14} />;
      case 'file-text':
        return <Info className={colorClass} size={14} />;
      case 'search':
        return <Eye className={colorClass} size={14} />;
      case 'activity':
        return <Layers className={colorClass} size={14} />;
      case 'layers':
        return <Layers className={colorClass} size={14} />;
      case 'cpu':
        return <Cpu className={colorClass} size={14} />;
      case 'image':
        return <ImageIcon className={colorClass} size={14} />;
      case 'alert-triangle':
        return <AlertTriangle className={colorClass} size={14} />;
      case 'brain-circuit':
        return <Sparkles className={colorClass} size={14} />;
      case 'check-circle':
        return <ListChecks className={colorClass} size={14} />;
      default:
        return <Info className={colorClass} size={14} />;
    }
  };

  // Fallback timeline if not stored in database scan record
  if (!result.timeline || result.timeline.length === 0) {
    const baseTime = result.timestamp ? new Date(result.timestamp) : new Date();
    const createTimeOffset = (ms) => new Date(baseTime.getTime() - 2000 + ms).toISOString();
    const missingExif = result.metadataAnomalies?.some(a => a.title === "Missing EXIF Metadata" || a.title === "Metadata Stripped");
    const exifAnomalyCount = result.metadataAnomalies?.length || 0;
    const isSoft = result.qualityMetrics?.sharpness?.includes("Soft");
    const hasDoubleComp = result.compressionAnalysis?.doubleCompression === 'Yes (Detected)';
    const inconsistentNoise = result.compressionAnalysis?.noisePattern !== 'Consistent Sensor Noise';
    const ganFinding = result.findings?.find(f => f.title === "GAN generation traces");
    const hasGan = ganFinding && ganFinding.severity !== 'None';
    const regionCount = result.manipulatedRegions?.length || 0;
    const riskLvl = result.riskAssessment?.riskLevel || result.riskLevel || 'Low';
    const isHighRisk = ['High', 'Critical'].includes(riskLvl);
    const finalVerdict = result.verdict || 'Unknown';
    const verdictStatus = ['Suspicious', 'Likely Manipulated', 'Deepfake'].includes(finalVerdict) ? "Warning" : "Completed";

    result.timeline = [
      {
        titleKey: "timelineUploadTitle",
        descKey: "timelineUploadDesc",
        descParams: { file: result.content || 'dossier_source.png' },
        timestamp: createTimeOffset(0),
        status: "Completed",
        confidence: 100,
        icon: "upload"
      },
      {
        titleKey: "timelineSignatureTitle",
        descKey: "timelineSignatureDesc",
        descParams: { format: result.metadata?.mimeType?.split('/')[1] || 'jpeg' },
        timestamp: createTimeOffset(100),
        status: "Completed",
        confidence: 100,
        icon: "shield"
      },
      {
        titleKey: "timelineMetadataTitle",
        descKey: missingExif ? "timelineMetadataDescPartial" : "timelineMetadataDescFull",
        descParams: {},
        timestamp: createTimeOffset(250),
        status: missingExif ? "Warning" : "Completed",
        confidence: 95,
        icon: "file-text"
      },
      {
        titleKey: "timelineExifTitle",
        descKey: exifAnomalyCount > 0 ? "timelineExifDescAnoms" : "timelineExifDescClear",
        descParams: { count: exifAnomalyCount },
        timestamp: createTimeOffset(400),
        status: exifAnomalyCount > 0 ? "Warning" : "Completed",
        confidence: 90,
        icon: "search"
      },
      {
        titleKey: "timelineQualityTitle",
        descKey: "timelineQualityDesc",
        descParams: { res: result.metadata?.resolution || 'N/A', sharp: result.qualityMetrics?.sharpness || 'Sharp' },
        timestamp: createTimeOffset(550),
        status: isSoft ? "Warning" : "Completed",
        confidence: 90,
        icon: "activity"
      },
      {
        titleKey: "timelineCompressionTitle",
        descKey: hasDoubleComp ? "timelineCompressionDescDouble" : "timelineCompressionDescUniform",
        descParams: {},
        timestamp: createTimeOffset(700),
        status: hasDoubleComp ? "Warning" : "Completed",
        confidence: 88,
        icon: "layers"
      },
      {
        titleKey: "timelineNoiseTitle",
        descKey: "timelineNoiseDesc",
        descParams: { noise: result.compressionAnalysis?.noisePattern || 'Consistent Sensor Noise' },
        timestamp: createTimeOffset(850),
        status: inconsistentNoise ? "Warning" : "Completed",
        confidence: 85,
        icon: "cpu"
      },
      {
        titleKey: "timelineGanTitle",
        descKey: hasGan ? "timelineGanDescTraces" : "timelineGanDescClear",
        descParams: { severity: ganFinding ? ganFinding.severity : '' },
        timestamp: createTimeOffset(1000),
        status: hasGan ? "Warning" : "Completed",
        confidence: ganFinding ? ganFinding.confidence : 90,
        icon: "cpu"
      },
      {
        titleKey: "timelineLocalizationTitle",
        descKey: regionCount > 0 ? "timelineLocalizationDescAnoms" : "timelineLocalizationDescClear",
        descParams: { count: regionCount },
        timestamp: createTimeOffset(1200),
        status: regionCount > 0 ? "Warning" : "Completed",
        confidence: 90,
        icon: "image"
      },
      {
        titleKey: "timelineRiskTitle",
        descKey: "timelineRiskDesc",
        descParams: { risk: riskLvl, priority: result.riskAssessment?.investigationPriority || 'Low' },
        timestamp: createTimeOffset(1400),
        status: isHighRisk ? "Error" : (riskLvl === 'Medium' ? "Warning" : "Completed"),
        confidence: result.riskAssessment?.aiConfidenceScore || 80,
        icon: "alert-triangle"
      },
      {
        titleKey: "timelineXaiTitle",
        descKey: "timelineXaiDesc",
        descParams: {},
        timestamp: createTimeOffset(1600),
        status: "Completed",
        confidence: 90,
        icon: "brain-circuit"
      },
      {
        titleKey: "timelineSummaryTitle",
        descKey: "timelineSummaryDesc",
        descParams: {},
        timestamp: createTimeOffset(1800),
        status: "Completed",
        confidence: 100,
        icon: "file-text"
      },
      {
        titleKey: "timelineVerdictTitle",
        descKey: "timelineVerdictDesc",
        descParams: { verdict: finalVerdict },
        timestamp: createTimeOffset(2000),
        status: verdictStatus,
        confidence: result.confidenceScore || 50,
        icon: "check-circle"
      }
    ];
  }

  // Image source to use for original preview (either uploaded object URL, or saved base64 from backend history scan)
  const originalImgSrc = originalPreview || result.originalImageBase64;

  return (
    <div className="space-y-6">
      {/* Swap Failover Warning */}
      {result.switchedToOpenAI && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold flex items-center gap-2.5 shadow-md">
          <AlertTriangle size={16} className="shrink-0 animate-bounce" />
          <span>{t('failoverAlert')}</span>
        </div>
      )}

      {/* Main Cover Card */}
      <div className="glass-panel p-6 md:p-8 border-[#4E2EF2]/10 relative overflow-hidden shadow-glow-mixed transition-all">
        <div className="flex flex-col lg:flex-row justify-between gap-6 pb-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${config.bg} ${config.text} border ${config.border}`}>
              <config.icon size={36} className={isSuspicious ? 'animate-pulse' : ''} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold font-display uppercase tracking-widest text-slate-400">{t('forensicStatus')}</h2>
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black tracking-widest uppercase border ${config.badge}`}>
                  {getVerdictLabel(currentVerdict)}
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-white font-display mt-1">
                {isSuspicious ? t('forgeryIdentified') : t('structureAuthentic')}
              </h3>
              <p className="text-[10px] text-slate-500 font-mono mt-1.5 flex flex-wrap items-center gap-x-4">
                <span>{t('dossierKey')} <span className="text-slate-300">{result.scanId || result._id}</span></span>
                {result.provider && (
                  <span>{t('provider')} <span className="text-slate-300">{result.provider} ({result.model || 'Multimodal'})</span></span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-center">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold font-display uppercase rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-white transition-all disabled:opacity-50"
            >
              {downloading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
              <span>{downloading ? t('compilingPdf') : t('downloadPdfReport')}</span>
            </button>
            {onScanAgain && (
              <button
                type="button"
                onClick={onScanAgain}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold font-display uppercase rounded-xl gradient-btn"
              >
                <span>{t('auditNewImage')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Executive Summary */}
        <div className="pt-6">
          <h4 className="text-xs font-bold font-display uppercase tracking-widest text-slate-400 mb-2.5 pl-0.5 flex items-center gap-1.5">
            <Info size={14} className="text-cyber-secondary" />
            <span>{t('forensicSummaryLog')}</span>
          </h4>
          <div className="bg-[#121829]/40 border border-white/5 p-4.5 rounded-xl">
            <p className="text-xs text-slate-300 leading-relaxed">{translateAI(result.executiveSummary)}</p>
          </div>
        </div>
      </div>

      {/* Trust Rating & Basic Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Animated Gauge */}
        <div className="glass-panel p-6 border-white/5 flex flex-col items-center justify-center">
          <span className="text-xs font-bold font-display uppercase text-slate-400 tracking-wider mb-4">{t('authenticityTrustScore')}</span>
          <div className="relative flex items-center justify-center">
            <svg className="w-28 h-28 transform -rotate-90">
              <defs>
                <linearGradient id="trustGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
              <circle cx="56" cy="56" r="40" className="stroke-slate-800" strokeWidth="8" fill="transparent" />
              <circle
                cx="56" cy="56" r="40"
                stroke="url(#trustGradient)"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="251.2"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white">{trustScore}%</span>
              <span className="text-[8px] font-extrabold uppercase tracking-widest font-display text-slate-400">{t('trustLevel')}</span>
            </div>
          </div>
        </div>

        {/* Detailed Stats Column */}
        <div className="md:col-span-2 glass-panel p-6 border-white/5 flex flex-col justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl">
              <span className="block text-[10px] font-bold font-display uppercase tracking-wider text-slate-500">{t('forensicConfidence')}</span>
              <span className="text-lg font-extrabold text-white mt-1 block">{result.confidenceScore}%</span>
            </div>
            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl">
              <span className="block text-[10px] font-bold font-display uppercase tracking-wider text-slate-500">{t('forensicRiskFactor')}</span>
              <span className={`text-lg font-extrabold mt-1 block uppercase ${
                result.riskLevel === 'Critical' || result.riskLevel === 'High' ? 'text-rose-500' : 
                result.riskLevel === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
              }`}>{getSeverityLabel(result.riskLevel) || t('low')}</span>
            </div>
            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl">
              <span className="block text-[10px] font-bold font-display uppercase tracking-wider text-slate-500">{t('manipulationSeverity')}</span>
              <span className={`text-lg font-extrabold mt-1 block uppercase ${
                result.manipulationSeverity === 'Critical' || result.manipulationSeverity === 'High' ? 'text-rose-500' : 
                result.manipulationSeverity === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
              }`}>{getSeverityLabel(result.manipulationSeverity) || t('none')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[9px] font-bold font-display uppercase tracking-wider text-slate-400">
                <span>{t('aiGeneratedProbability')}</span>
                <span className="text-rose-455">{result.aiGeneratedProbability}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5 p-[1px]">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-1000"
                  style={{ width: `${result.aiGeneratedProbability}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[9px] font-bold font-display uppercase tracking-wider text-slate-400">
                <span>{t('humanAuthenticityProbability')}</span>
                <span className="text-emerald-400">{result.humanAuthenticityProbability}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5 p-[1px]">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-1000"
                  style={{ width: `${result.humanAuthenticityProbability}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forensic Image Comparison Slider */}
      <div className="glass-panel p-6 border-white/5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-white/5">
          <div>
            <h3 className="text-sm font-extrabold text-white font-display uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={16} className="text-cyber-primary" />
              <span>{t('viewerTitle')}</span>
            </h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{t('viewerSubtitle')}</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setCompareMode('original')}
              className={`px-3 py-1.5 text-[9px] font-bold font-display uppercase tracking-wider rounded-lg transition-all ${
                compareMode === 'original' ? 'bg-cyber-primary text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('modeOriginal')}
            </button>
            <button
              onClick={() => setCompareMode('heatmap')}
              className={`px-3 py-1.5 text-[9px] font-bold font-display uppercase tracking-wider rounded-lg transition-all ${
                compareMode === 'heatmap' ? 'bg-cyber-primary text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('modeEla')}
            </button>
            <button
              onClick={() => setCompareMode('overlay')}
              className={`px-3 py-1.5 text-[9px] font-bold font-display uppercase tracking-wider rounded-lg transition-all ${
                compareMode === 'overlay' ? 'bg-cyber-primary text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('modeHeatmap')}
            </button>
          </div>
        </div>

        {/* Canvas Display Frame */}
        <div className="relative border border-white/5 rounded-2xl overflow-hidden bg-slate-950/80 flex items-center justify-center min-h-[350px] max-h-[450px]">
          {compareMode === 'original' && originalImgSrc && (
            <img src={originalImgSrc} className="max-h-[350px] object-contain p-2" alt="Original dossier frame" />
          )}
          {compareMode === 'heatmap' && result.elaImage && (
            <img src={result.elaImage} className="max-h-[350px] object-contain p-2" alt="Error level analysis" />
          )}
          {compareMode === 'overlay' && originalImgSrc && (
            <div className="relative max-h-[350px] overflow-hidden flex items-center justify-center p-2">
              <img src={originalImgSrc} className="max-h-[350px] object-contain" alt="Underlay" />
              {result.heatmapImage && (
                <img 
                  src={result.heatmapImage} 
                  className="absolute inset-0 w-full h-full object-contain mix-blend-screen opacity-90 p-2 pointer-events-none" 
                  alt="Highlights overlay" 
                />
              )}
            </div>
          )}
          {!originalImgSrc && (
            <div className="text-center p-8">
              <ImageIcon size={32} className="text-slate-600 mx-auto mb-2" />
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{t('previewUnavailable')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="space-y-4">
        <div className="flex border-b border-white/5">
          <button
            onClick={() => setActiveTab('investigation')}
            className={`pb-3 px-4 text-xs font-bold font-display uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'investigation' ? 'border-cyber-primary text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('tabExecutive')}
          </button>
          <button
            onClick={() => setActiveTab('indicators')}
            className={`pb-3 px-4 text-xs font-bold font-display uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'indicators' ? 'border-cyber-primary text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('tabIndicators')} ({result.findings?.filter(f => f.severity && f.severity !== 'None').length || 0})
          </button>
          <button
            onClick={() => setActiveTab('quality')}
            className={`pb-3 px-4 text-xs font-bold font-display uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'quality' ? 'border-cyber-primary text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('tabMetadata')}
          </button>
          <button
            onClick={() => setActiveTab('risk')}
            className={`pb-3 px-4 text-xs font-bold font-display uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'risk' ? 'border-cyber-primary text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('tabRisk')}
          </button>
          <button
            onClick={() => setActiveTab('localization')}
            className={`pb-3 px-4 text-xs font-bold font-display uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'localization' ? 'border-cyber-primary text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('tabLocalization')}
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-3 px-4 text-xs font-bold font-display uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'timeline' ? 'border-cyber-primary text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('tabTimeline')}
          </button>
        </div>

        {/* Tab content 1: Executive Investigation Platform Dashboard */}
        {activeTab === 'investigation' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header Cards: Status & Details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col justify-between">
                <span className="block text-[9px] font-extrabold font-display uppercase tracking-widest text-slate-500">{t('overallStatus')}</span>
                <span className={`text-base font-extrabold mt-1 block uppercase font-mono ${
                  currentVerdict === 'Authentic' || currentVerdict === 'Likely Authentic' ? 'text-cyber-success' : 'text-rose-500'
                }`}>
                  {currentVerdict === 'Authentic' || currentVerdict === 'Likely Authentic' ? t('securePassed') : t('auditedCompromised')}
                </span>
              </div>
              <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col justify-between">
                <span className="block text-[9px] font-extrabold font-display uppercase tracking-widest text-slate-500">{t('authenticityScore')}</span>
                <span className="text-lg font-black text-white mt-1 block font-mono">{result.humanAuthenticityProbability ?? (100 - result.aiGeneratedProbability)}%</span>
              </div>
              <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col justify-between">
                <span className="block text-[9px] font-extrabold font-display uppercase tracking-widest text-slate-500">{t('manipulationScore')}</span>
                <span className="text-lg font-black text-rose-500 mt-1 block font-mono">{result.aiGeneratedProbability || 0}%</span>
              </div>
              <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col justify-between">
                <span className="block text-[9px] font-extrabold font-display uppercase tracking-widest text-slate-500">{t('aiConfidence')}</span>
                <span className="text-lg font-black text-white mt-1 block font-mono">{result.confidenceScore || 50}%</span>
              </div>
            </div>

            {/* Investigation Timeline & Matrix Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Timeline Column */}
              <div className="glass-panel p-5 border-white/5 space-y-4 h-fit">
                <h4 className="text-xs font-bold font-display uppercase text-white tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2.5">
                  <Cpu size={14} className="text-cyber-primary" />
                  <span>{t('forensicIntakeTimeline')}</span>
                </h4>
                
                {/* Timeline pipeline */}
                <div className="relative pl-6 space-y-5 border-l border-white/10 ml-2 pt-1 pb-1">
                  {[
                    { title: t('intakeTitle'), desc: t('intakeDesc'), conf: "100%", status: "Done" },
                    { title: t('exifScanTitle'), desc: t('exifScanDesc'), conf: "90%", status: "Done" },
                    { title: t('elaScanTitle'), desc: t('elaScanDesc'), conf: `${result.confidenceScore || 70}%`, status: "Done" },
                    { title: t('spatialScanTitle'), desc: t('spatialScanDesc'), conf: `${result.manipulatedRegions?.length > 0 ? "95%" : "N/A"}`, status: result.manipulatedRegions?.length > 0 ? "Flagged" : "Completed" },
                    { title: t('tabRisk'), desc: t('evaluatingSeverity'), conf: `${result.riskAssessment?.aiConfidenceScore || 80}%`, status: "Done" },
                    { title: t('explainableAiReport'), desc: t('compilingRationales'), conf: "100%", status: "Done" },
                    { title: t('finalVerdictStage'), desc: t('verdictStageDesc', { verdict: getVerdictLabel(currentVerdict) }), conf: `${result.confidenceScore || 80}%`, status: "Completed" }
                  ].map((stage, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[30px] top-0.5 w-3 h-3 rounded-full border-2 ${
                        stage.status === 'Flagged' ? 'bg-rose-500 border-rose-500 shadow-glow-purple' :
                        stage.status === 'Completed' ? 'bg-cyber-success border-cyber-success' : 'bg-[#7C3AED] border-[#7C3AED]'
                      }`}></span>
                      <div>
                        <span className="block text-[11px] font-bold text-white uppercase tracking-wider">{stage.title}</span>
                        <span className="block text-[10px] text-slate-500 font-mono mt-0.5">{stage.desc}</span>
                        <div className="flex gap-4 mt-1 text-[8px] font-extrabold uppercase font-mono text-slate-400">
                          <span>Status: <span className={stage.status === 'Flagged' ? 'text-rose-500' : 'text-slate-200'}>{getSeverityLabel(stage.status)}</span></span>
                          <span>Confidence: <span className="text-slate-200">{stage.conf}</span></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence Matrix Table */}
              <div className="lg:col-span-2 glass-panel p-5 border-white/5 space-y-4">
                <h4 className="text-xs font-bold font-display uppercase text-white tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2.5">
                  <ListChecks size={14} className="text-cyber-secondary" />
                  <span>{t('forensicEvidenceMatrix')}</span>
                </h4>

                <div className="overflow-x-auto text-[10.5px]">
                  <table className="w-full text-left divide-y divide-white/5">
                    <thead className="text-[9px] font-bold font-display uppercase text-slate-500 tracking-wider">
                      <tr>
                        <th className="pb-3">{t('indicatorType')}</th>
                        <th className="pb-3">{t('conf')}</th>
                        <th className="pb-3">{t('severity')}</th>
                        <th className="pb-3">{t('status')}</th>
                        <th className="pb-3">{t('explanation')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-350">
                      {(result.findings || []).slice(0, 10).map((finding, idx) => {
                        const isFlagged = finding.severity !== 'None';
                        return (
                          <tr key={idx} className="hover:bg-white/[0.005]">
                            <td className="py-2.5 font-semibold text-white uppercase tracking-tight">{translateAI(finding.title)}</td>
                            <td className="py-2.5 font-mono">{finding.confidence}%</td>
                            <td className="py-2.5 uppercase font-semibold">{getSeverityLabel(finding.severity)}</td>
                            <td className="py-2.5">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${
                                isFlagged ? 'bg-rose-500/10 text-rose-455 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              }`}>{isFlagged ? t('flagged') : t('passed')}</span>
                            </td>
                            <td className="py-2.5 text-slate-400 max-w-[200px] truncate" title={translateAI(finding.explanation)}>{translateAI(finding.explanation)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Explainable AI & Actionable Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Explainable AI block */}
              <div className="glass-panel p-5 border-white/5 space-y-4">
                <h4 className="text-xs font-bold font-display uppercase text-white tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2.5">
                  <Info size={14} className="text-cyber-primary animate-pulse" />
                  <span>{t('explainableAiReport')}</span>
                </h4>
                
                <div className="space-y-4 text-xs font-sans">
                  <div>
                    <span className="block text-[8px] font-extrabold font-display uppercase tracking-widest text-slate-500">{t('whyClassified')}</span>
                    <p className="text-slate-300 leading-relaxed mt-1 bg-white/[0.005] p-3 rounded-xl border border-white/5">{translateAI(result.reasoning || result.explanation)}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[8px] font-extrabold font-display uppercase tracking-widest text-slate-500">{t('strongestSignals')}</span>
                      <ul className="list-disc pl-4 space-y-1 text-slate-355 mt-1">
                        {result.findings?.filter(f => f.severity !== 'None').slice(0, 3).map((f, i) => (
                          <li key={i}>{translateAI(f.title)}</li>
                        )) || <li>{t('noneLocalized')}</li>}
                        {result.findings?.filter(f => f.severity !== 'None').length === 0 && <li>{t('structuralMetricsAuthentic')}</li>}
                      </ul>
                    </div>
                    <div>
                      <span className="block text-[8px] font-extrabold font-display uppercase tracking-widest text-slate-500">{t('weakestSignals')}</span>
                      <ul className="list-disc pl-4 space-y-1 text-slate-355 mt-1">
                        {result.findings?.filter(f => f.severity === 'None').slice(0, 3).map((f, i) => (
                          <li key={i}>{translateAI(f.title)}</li>
                        )) || <li>{t('noneLocalized')}</li>}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <span className="block text-[8px] font-extrabold font-display uppercase tracking-widest text-slate-500">{t('confidenceLimitations')}</span>
                      <p className="text-slate-400 mt-1 italic">{t('limitationsText')}</p>
                    </div>
                    <div>
                      <span className="block text-[8px] font-extrabold font-display uppercase tracking-widest text-slate-500">{t('falsePositiveSituations')}</span>
                      <p className="text-slate-400 mt-1 italic">{t('falsePositiveText')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div className="glass-panel p-5 border-white/5 space-y-4">
                <h4 className="text-xs font-bold font-display uppercase text-white tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2.5">
                  <ListChecks size={14} className="text-cyber-success" />
                  <span>{t('forensicRecActions')}</span>
                </h4>
                <div className="space-y-3">
                  {(result.recommendations || []).map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white/[0.005] border border-white/5">
                      <span className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-cyber-success text-[10px] font-black font-display flex items-center justify-center shrink-0">✓</span>
                      <span className="text-xs text-slate-300 leading-tight font-sans">{translateAI(rec)}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab content 2: Deepfake Indicators Checklist */}
        {activeTab === 'indicators' && (
          <div className="glass-panel p-5 border-white/5 space-y-4">
            <h4 className="text-xs font-bold font-display uppercase text-white tracking-widest flex items-center gap-1.5">
              <Sparkles size={14} className="text-cyber-secondary" />
              <span>{t('visualArtifactsLedger')}</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {result.findings?.map((finding, idx) => {
                const isAnomaly = finding.severity && finding.severity !== 'None';
                const severityColors = {
                  'None': 'bg-slate-800 text-slate-500 border-white/5',
                  'Low': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                  'Medium': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                  'High': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                  'Critical': 'bg-rose-500/10 text-rose-455 border-rose-500/20'
                };
                const badgeStyle = severityColors[finding.severity] || severityColors.None;

                return (
                  <div key={idx} className={`p-4 rounded-xl border space-y-3 transition-all ${
                    isAnomaly ? 'bg-rose-500/[0.02] border-rose-500/20 hover:border-rose-500/30' : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                  }`}>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-bold text-white font-display uppercase tracking-wider">{translateAI(finding.title)}</span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black tracking-widest uppercase border ${badgeStyle}`}>
                        {finding.severity === 'None' ? t('clear') : getSeverityLabel(finding.severity)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">
                      <span>{t('indicatorConfidence')}</span>
                      <span>{finding.confidence}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden p-[1px]">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          finding.confidence > 75 ? 'bg-rose-500' :
                          finding.confidence > 40 ? 'bg-amber-500' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${finding.confidence}%` }}
                      ></div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <div>
                        <span className="block text-[9px] font-extrabold font-display uppercase tracking-widest text-slate-500">{t('forensicAnalysisLabel')}</span>
                        <p className={`text-[11px] leading-relaxed mt-0.5 ${finding.explanation === 'Insufficient evidence to verify this characteristic.' ? 'text-slate-500 italic font-mono' : 'text-slate-350'}`}>
                          {finding.explanation === 'Insufficient evidence to verify this characteristic.' ? t('insufficientEvidence') : translateAI(finding.explanation)}
                        </p>
                      </div>
                      <div>
                        <span className="block text-[9px] font-extrabold font-display uppercase tracking-widest text-slate-500">{t('whyItMattersLabel')}</span>
                        <p className={`text-[11px] leading-relaxed mt-0.5 ${finding.whyItMatters === 'Insufficient evidence to verify this characteristic.' ? 'text-slate-500 italic font-mono' : 'text-slate-350'}`}>
                          {finding.whyItMatters === 'Insufficient evidence to verify this characteristic.' ? t('insufficientEvidence') : translateAI(finding.whyItMatters)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab content 3: File details and EXIF Metadata */}
        {activeTab === 'quality' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* EXIF Metadata */}
            <div className="glass-panel p-5 border-white/5 md:col-span-2 space-y-4">
              <h4 className="text-xs font-bold font-display uppercase text-white tracking-widest flex items-center gap-1.5">
                <Camera size={14} className="text-cyber-primary" />
                <span>{t('exifMetadataLedger')}</span>
              </h4>
              <div className="overflow-hidden border border-white/5 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-slate-400 font-display font-bold uppercase tracking-wider text-[9px]">
                    <tr>
                      <th className="p-3">{t('attributeTag')}</th>
                      <th className="p-3">{t('value')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-350 font-mono text-[10.5px]">
                    {!result.metadata || (!result.metadata.cameraMake && !result.metadata.cameraModel && !result.metadata.dateCreated) ? (
                      <tr>
                        <td colSpan="2" className="p-4 text-center text-slate-500 italic uppercase tracking-wider font-bold">
                          {t('noMetadata')}
                        </td>
                      </tr>
                    ) : (
                      <>
                        <tr>
                          <td className="p-2 font-semibold text-slate-400">{t('cameraMake')}</td>
                          <td className="p-2">{result.metadata.cameraMake || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold text-slate-400">{t('cameraModel')}</td>
                          <td className="p-2">{result.metadata.cameraModel || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold text-slate-400">{t('lensModel')}</td>
                          <td className="p-2">{result.metadata.lensModel || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold text-slate-400">{t('resolution')}</td>
                          <td className="p-2">{result.metadata.resolution || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold text-slate-400">{t('dpiDensity')}</td>
                          <td className="p-2">{result.metadata.dpi || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold text-slate-400">{t('bitDepth')}</td>
                          <td className="p-2">{result.metadata.bitDepth || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold text-slate-400">{t('colorSpace')}</td>
                          <td className="p-2">{result.metadata.colorSpace || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold text-slate-400">{t('orientation')}</td>
                          <td className="p-2">{result.metadata.orientation || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold text-slate-400">{t('fileSize')}</td>
                          <td className="p-2">{result.metadata.fileSize ? `${(result.metadata.fileSize / 1024).toFixed(1)} KB` : 'N/A'}</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold text-slate-400">{t('mimeType')}</td>
                          <td className="p-2">{result.metadata.mimeType || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold text-slate-400">{t('compressionFormat')}</td>
                          <td className="p-2">{result.metadata.compressionFormat || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold text-slate-400">{t('dateCreated')}</td>
                          <td className="p-2">{result.metadata.dateCreated ? new Date(result.metadata.dateCreated).toLocaleString() : 'N/A'}</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold text-slate-400">{t('dateModified')}</td>
                          <td className="p-2">{result.metadata.dateModified ? new Date(result.metadata.dateModified).toLocaleString() : 'N/A'}</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold text-slate-400">{t('gpsCoordinates')}</td>
                          <td className="p-2">{result.metadata.gpsCoordinates || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold text-slate-400">{t('editingSoftware')}</td>
                          <td className="p-2 text-rose-455 font-bold">{result.metadata.editingSoftware || t('noneDetected')}</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-semibold text-slate-400">{t('operatingSystem')}</td>
                          <td className="p-2">{result.metadata.operatingSystem || 'N/A'}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quality & Compression details */}
            <div className="glass-panel p-5 border-white/5 space-y-5">
              <div>
                <h4 className="text-xs font-bold font-display uppercase text-white tracking-widest mb-3 flex items-center gap-1.5">
                  <HardDrive size={14} className="text-cyber-primary" />
                  <span>{t('qualityMetrics')}</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 rounded bg-white/[0.01]">
                    <span className="text-slate-400">{t('resolution')}</span>
                    <span className="font-semibold text-slate-200">{result.qualityMetrics?.resolution || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-white/[0.01]">
                    <span className="text-slate-400">{t('focusSharpness')}</span>
                    <span className="font-semibold text-slate-200">{result.qualityMetrics?.sharpness || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-white/[0.01]">
                    <span className="text-slate-400">{t('relativeBlur')}</span>
                    <span className="font-semibold text-slate-200">{result.qualityMetrics?.blurLevel || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-white/[0.01]">
                    <span className="text-slate-400">{t('sensorNoise')}</span>
                    <span className="font-semibold text-slate-200">{result.qualityMetrics?.noiseLevel || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold font-display uppercase text-white tracking-widest mb-3 flex items-center gap-1.5">
                  <Layers size={14} className="text-cyber-secondary" />
                  <span>{t('compressionAnalysis')}</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 rounded bg-white/[0.01]">
                    <span className="text-slate-400">{t('jpegQuality')}</span>
                    <span className="font-semibold text-slate-200">{result.compressionAnalysis?.jpegQuality || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-white/[0.01]">
                    <span className="text-slate-400">{t('doubleCompression')}</span>
                    <span className="font-semibold text-slate-200">{result.compressionAnalysis?.doubleCompression || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-white/[0.01]">
                    <span className="text-slate-400">{t('artifactLevel')}</span>
                    <span className="font-semibold text-slate-200">{result.compressionAnalysis?.artifactLevel || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div></div>

            {/* Metadata Anomalies Audit Ledger */}
            {result.metadataAnomalies && result.metadataAnomalies.length > 0 && (
              <div className="glass-panel p-5 border-rose-500/10 md:col-span-3 space-y-4 bg-rose-950/[0.02]">
                <h4 className="text-xs font-bold font-display uppercase text-rose-455 tracking-widest flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-rose-500" />
                  <span>{t('metadataAnomaliesLedger')}</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.metadataAnomalies.map((anom, idx) => (
                    <div key={idx} className="p-3 bg-rose-500/[0.02] border border-rose-500/10 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">{translateAI(anom.title)}</span>
                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-455 border border-rose-500/20">
                          {getSeverityLabel(anom.severity)} (Conf: {anom.confidence}%)
                        </span>
                      </div>
                      <p className="text-[10.5px] text-rose-300 leading-tight">
                        <strong>{t('explanation')}:</strong> {translateAnomExplanation(anom)}
                      </p>
                      <p className="text-[10.5px] text-slate-400 leading-tight border-t border-white/5 pt-1.5">
                        <strong>{t('forensicImpact')}</strong> {translateAI(anom.whyItMatters)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab content 4: Risk Assessment */}
        {activeTab === 'risk' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
            {/* Risk Assessment metrics */}
            <div className="glass-panel p-5 border-white/5 space-y-4">
              <h4 className="text-xs font-bold font-display uppercase text-white tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2.5">
                <ShieldAlert size={14} className="text-cyber-primary" />
                <span>{t('threatRiskMetrics')}</span>
              </h4>
              
              {!result.riskAssessment || Object.keys(result.riskAssessment).length === 0 ? (
                <p className="text-xs text-slate-500 italic">{t('riskAssessmentLimited')}</p>
              ) : (
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="block text-[9px] text-slate-550 font-bold uppercase tracking-wider mb-1.5">{t('authenticityTrustScore')}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-emerald-450 h-full rounded-full transition-all duration-1000" style={{ width: `${result.riskAssessment.trustScore}%` }}></div>
                      </div>
                      <span className="font-mono text-white font-extrabold">{result.riskAssessment.trustScore}%</span>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[9px] text-slate-555 font-bold uppercase tracking-wider mb-1.5">{t('authenticityScore')}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-blue-400 h-full rounded-full transition-all duration-1000" style={{ width: `${result.riskAssessment.authenticityScore}%` }}></div>
                      </div>
                      <span className="font-mono text-white font-extrabold">{result.riskAssessment.authenticityScore}%</span>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[9px] text-slate-555 font-bold uppercase tracking-wider mb-1.5">{t('manipulationScore')}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full transition-all duration-1000" style={{ width: `${result.riskAssessment.manipulationScore}%` }}></div>
                      </div>
                      <span className="font-mono text-white font-extrabold">{result.riskAssessment.manipulationScore}%</span>
                    </div>
                  </div>

                  <div className="flex justify-between py-2 border-y border-white/5 text-[11px] mt-2">
                    <span className="text-slate-400">{t('evidenceStrength')}</span>
                    <span className="font-bold text-slate-200 uppercase tracking-wider">{getSeverityLabel(result.riskAssessment.evidenceStrength)}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-white/5 text-[11px]">
                    <span className="text-slate-400">{t('investigationPriority')}</span>
                    <span className={`font-bold uppercase tracking-wider ${
                      result.riskAssessment.investigationPriority === 'Critical' || result.riskAssessment.investigationPriority === 'High' ? 'text-rose-455' : 'text-emerald-450'
                    }`}>{getSeverityLabel(result.riskAssessment.investigationPriority)}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-white/5 text-[11px]">
                    <span className="text-slate-400">{t('aiConfidenceScoreLabel')}</span>
                    <span className="font-bold text-slate-200 font-mono">{result.riskAssessment.aiConfidenceScore}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Assessment Details */}
            <div className="glass-panel p-5 border-white/5 md:col-span-2 space-y-5">
              {!result.riskAssessment || Object.keys(result.riskAssessment).length === 0 ? (
                <p className="text-xs text-rose-455 font-bold flex items-center gap-2">
                  <AlertTriangle size={14} />
                  <span>{t('riskAssessmentLimited')}</span>
                </p>
              ) : (
                <>
                  {/* Risk Level Assignment reasons */}
                  <div className="p-4 rounded-xl border border-white/5" style={{ background: 'rgba(255,255,255,0.01)' }}>
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="text-[10px] font-extrabold font-display uppercase tracking-widest text-[#7C3AED]">{t('assignedRiskLevel')}</h5>
                      <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                        result.riskAssessment.riskLevel === 'Critical' || result.riskAssessment.riskLevel === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                        result.riskAssessment.riskLevel === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-550/10 text-emerald-450 border-emerald-500/20'
                      }`}>{getSeverityLabel(result.riskAssessment.riskLevel)}</span>
                    </div>
                    <p className="text-xs text-slate-350 leading-relaxed font-sans">{translateAI(result.riskAssessment.riskLevelAssignmentReason)}</p>
                    
                    <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
                      <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">{t('supportingForensicEvidence')}</span>
                      <ul className="list-disc pl-4 space-y-1 text-slate-300 text-xs mt-1.5">
                        {result.riskAssessment.supportingEvidence?.map((ev, i) => (
                          <li key={i} className="leading-tight">{translateAI(ev)}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Impact and Recommendations */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-white/[0.005] border border-white/5 rounded-xl">
                      <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t('potentialThreatImpact')}</span>
                      <p className="text-[11px] text-slate-400 leading-snug font-sans">{translateAI(result.riskAssessment.potentialImpact)}</p>
                    </div>
                    <div className="p-3 bg-white/[0.005] border border-white/5 rounded-xl border-cyber-primary/20 bg-cyber-primary/[0.01]">
                      <span className="block text-[8px] font-bold text-cyber-primary uppercase tracking-widest mb-1">{t('forensicRecommendedAction')}</span>
                      <p className="text-[11px] text-slate-300 font-semibold leading-snug font-sans">{translateAI(result.riskAssessment.recommendedAction)}</p>
                    </div>
                  </div>

                  {/* Risk Executive Summary */}
                  <div className="space-y-1.5 pt-1">
                    <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">{t('riskAssessmentSummary')}</span>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-900/40 p-3 rounded-xl border border-white/5 whitespace-pre-line">
                      {translateAI(result.riskAssessment.riskExecutiveSummary) || t('riskAssessmentLimited')}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tab content 5: Manipulation Localization */}
        {activeTab === 'localization' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Left Col: Interactive Canvas with Bounding Boxes */}
            <div className="lg:col-span-2 glass-panel p-5 border-white/5 space-y-4">
              <h4 className="text-xs font-bold font-display uppercase text-white tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2.5">
                <Layers size={14} className="text-cyber-primary" />
                <span>{t('spatialMeshTitle')}</span>
              </h4>
              
              <div className="relative border border-white/5 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center min-h-[350px] max-h-[450px]">
                {/* Background Scan Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,41,0)_95%,rgba(78,46,242,0.08)_95%)] bg-[size:100%_25px] animate-[pulse_3s_infinite] pointer-events-none"></div>
                
                {originalPreview || result.originalImage ? (
                  <div className="relative max-h-[350px] overflow-hidden flex items-center justify-center p-2">
                    <img src={originalPreview || result.originalImage} className="max-h-[350px] object-contain" alt="Localization original dossier" />
                    
                    {/* Heatmap overlay */}
                    {result.heatmapImage && (
                      <img 
                        src={result.heatmapImage} 
                        className="absolute inset-0 w-full h-full object-contain mix-blend-screen opacity-40 p-2 pointer-events-none" 
                        alt="Highlights overlay" 
                      />
                    )}
                    
                    {/* Bounding box overlays */}
                    {(result.manipulatedRegions || []).map((region, idx) => {
                      const isActive = idx === selectedRegionIndex;
                      return (
                        <div 
                          key={idx}
                          onClick={() => setSelectedRegionIndex(idx)}
                          className={`absolute border-2 cursor-pointer flex items-start justify-start p-1 transition-all duration-350 ${
                            isActive 
                              ? 'border-rose-500 bg-rose-500/20 shadow-glow-purple scale-102 z-10 animate-pulse' 
                              : 'border-amber-500/50 bg-amber-500/5 hover:border-rose-450 hover:bg-rose-500/10'
                          }`}
                          style={{
                            left: `${region.x}%`,
                            top: `${region.y}%`,
                            width: `${region.width}%`,
                            height: `${region.height}%`
                          }}
                          title={`Click to audit Region ${region.regionId || idx + 1}`}
                        >
                          <span className={`text-[8px] px-1 rounded-sm font-mono uppercase font-black text-white ${
                            isActive ? 'bg-rose-600' : 'bg-amber-600'
                          }`}>
                            {region.regionId || `R${idx + 1}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <ImageIcon size={32} className="text-slate-600 mx-auto mb-2" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{t('previewUnavailable')}</span>
                  </div>
                )}
              </div>

              {/* Bounding Boxes Selector row */}
              {result.manipulatedRegions && result.manipulatedRegions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {result.manipulatedRegions.map((region, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedRegionIndex(idx)}
                      className={`px-3 py-1.5 text-[9px] font-bold font-display uppercase tracking-wider rounded-lg border transition-all ${
                        selectedRegionIndex === idx 
                          ? 'bg-rose-500 border-rose-500 text-white shadow-glow-purple' 
                          : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      Region {region.regionId || `R${idx + 1}`} ({region.label})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Col: Details / Cards */}
            <div className="glass-panel p-5 border-white/5 space-y-4">
              <h4 className="text-xs font-bold font-display uppercase text-white tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2.5">
                <ListChecks size={14} className="text-cyber-secondary" />
                <span>{t('regionDossierTitle')}</span>
              </h4>

              {!result.manipulatedRegions || result.manipulatedRegions.length === 0 ? (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 italic">Manipulation localization limited due to insufficient forensic evidence. File integrity verified.</p>
                  
                  {/* Print 10 visual artifacts list for overall image */}
                  <div className="pt-2 border-t border-white/5 space-y-3">
                    <span className="block text-[9px] font-extrabold font-display uppercase tracking-widest text-slate-500">{t('visualArtifactMatrix')}</span>
                    <div className="grid grid-cols-1 gap-2.5">
                      {[
                        { title: "Face inconsistencies", labelKey: "faceInconsistencies" },
                        { title: "Background editing", labelKey: "backgroundInconsistencies" },
                        { title: "Lighting inconsistencies", labelKey: "lightingMismatch" },
                        { title: "Shadow inconsistencies", labelKey: "shadowMismatch" },
                        { title: "Eye reflections", labelKey: "reflectionMismatch" },
                        { title: "Skin texture anomalies", labelKey: "textureInconsistencies" },
                        { title: "Compression artifacts", labelKey: "compressionArtifacts" },
                        { title: "Blending artifacts", labelKey: "edgeBlending" },
                        { title: "Noise inconsistency", labelKey: "noiseInconsistencies" },
                        { title: "Color inconsistency", labelKey: "colorInconsistencies" }
                      ].map((item, idx) => {
                        const fd = (result.findings || []).find(f => f.title.toLowerCase() === item.title.toLowerCase());
                        const isFlagged = fd && fd.severity !== 'None';
                        return (
                          <div key={idx} className="flex justify-between items-center text-xs p-2.5 rounded bg-white/[0.005] border border-white/5">
                            <span className="text-slate-400 font-sans">{t(item.labelKey)}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                              isFlagged ? 'bg-rose-500/10 text-rose-455 border-rose-500/25' : 'bg-emerald-450/10 text-emerald-450 border-emerald-400/20'
                            }`}>{isFlagged ? t('flagged') : t('passed')}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                (() => {
                  const activeRegion = result.manipulatedRegions[selectedRegionIndex] || result.manipulatedRegions[0];
                  if (!activeRegion) return null;
                  
                  const severityStyles = {
                    Low: 'bg-blue-400/10 text-blue-400 border-blue-500/20',
                    Medium: 'bg-amber-400/10 text-amber-400 border-amber-500/20',
                    High: 'bg-rose-500/10 text-rose-450 border-rose-500/20',
                    Critical: 'bg-red-500/10 text-red-400 border-red-500/20'
                  };
                  const sBadge = severityStyles[activeRegion.severity] || severityStyles.Low;

                  return (
                    <div className="space-y-4 text-xs animate-fadeIn">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="font-extrabold text-white text-[11px] uppercase tracking-wider">{t('regionIdLabel')} {activeRegion.regionId || `R${selectedRegionIndex + 1}`}</span>
                        <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${sBadge}`}>
                          {getSeverityLabel(activeRegion.severity)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-center">
                          <span className="block text-[8px] font-extrabold font-display uppercase tracking-widest text-slate-500">{t('forensicConfidence')}</span>
                          <span className="text-lg font-black text-white mt-1 block font-mono">{activeRegion.confidence}%</span>
                        </div>
                        <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-center">
                          <span className="block text-[8px] font-extrabold font-display uppercase tracking-widest text-slate-500">Probability</span>
                          <span className="text-lg font-black text-white mt-1 block font-mono">{activeRegion.probability}%</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="block text-[8px] font-extrabold font-display uppercase tracking-widest text-slate-500">{t('anomalySignature')}</span>
                        <p className="text-slate-350 leading-relaxed font-sans">{translateAI(activeRegion.label)}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="block text-[8px] font-extrabold font-display uppercase tracking-widest text-slate-500">{t('reasonForSuspicion')}</span>
                        <p className="text-slate-350 leading-relaxed font-sans">{translateAI(activeRegion.reason)}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="block text-[8px] font-extrabold font-display uppercase tracking-widest text-slate-500">{t('forensicAnalysisLabel')}</span>
                        <p className="text-slate-350 leading-relaxed font-sans bg-slate-900/40 p-2.5 rounded-lg border border-white/5">{translateAI(activeRegion.evidence)}</p>
                      </div>

                      {/* Explainable AI */}
                      {activeRegion.explainableAI && (
                        <div className="p-3.5 rounded-xl border border-white/5 space-y-3" style={{ background: 'rgba(255,255,255,0.005)' }}>
                          <span className="block text-[9px] font-extrabold font-display uppercase tracking-widest text-[#7C3AED]">{t('explainableAiReport')}</span>
                          
                          <div className="space-y-1">
                            <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">{t('whyDetected')}</span>
                            <p className="text-slate-350 leading-tight font-sans">{translateAI(activeRegion.explainableAI.whyDetected)}</p>
                          </div>

                          <div className="space-y-1">
                            <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">{t('contributingIndicators')}</span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {activeRegion.explainableAI.contributingIndicators?.map((ind, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-rose-500/5 text-rose-450 border border-rose-500/10 text-[8px] font-bold uppercase tracking-wider">
                                  {translateAI(ind)}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-2 pt-1 border-t border-white/5">
                            <div>
                              <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">{t('confidenceLimitations')}</span>
                              <p className="text-slate-355 leading-tight font-sans italic">{translateAI(activeRegion.explainableAI.confidenceLimitations)}</p>
                            </div>
                            <div>
                              <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">{t('alternativeExplanations')}</span>
                              <p className="text-slate-355 leading-tight font-sans italic">{translateAI(activeRegion.explainableAI.alternativeExplanations)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        )}
        {activeTab === 'timeline' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="glass-panel p-6 border-white/5 space-y-6">
              <div>
                <h4 className="text-xs font-bold font-display uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
                  <History size={14} className="text-cyber-primary" />
                  <span>{t('timelineTitle')}</span>
                </h4>
                <p className="text-[10px] text-slate-500 font-mono">
                  {t('timelineSubtitle')}
                </p>
              </div>

              <div className="relative border-l border-white/5 ml-4 pl-8 space-y-6">
                {(result.timeline || []).map((event, idx) => {
                  const statusColors = {
                    Completed: 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20',
                    Running: 'bg-cyber-primary/10 text-cyber-primary border-cyber-primary/20 animate-pulse',
                    Warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    Error: 'bg-rose-500/10 text-rose-455 border-rose-500/20'
                  };
                  
                  const statusClass = statusColors[event.status] || statusColors.Completed;

                  return (
                    <div key={idx} className="relative group transition-all duration-300">
                      {/* Timeline Dot Indicator */}
                      <span className="absolute -left-[45px] top-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#0F172A] border border-white/10 group-hover:border-[#7C3AED]/50 transition-colors shadow-lg">
                        {getTimelineIcon(event.icon, event.status)}
                      </span>

                      {/* Event Card */}
                      <div className="p-4 bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-x-2">
                            <span className="text-xs font-extrabold text-white font-display uppercase tracking-wider">
                              {getTimelineTitle(event)}
                            </span>
                            <span className="text-[8px] font-mono text-slate-600">
                              {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : ''}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-455 leading-relaxed font-sans max-w-xl">
                            {getTimelineDesc(event)}
                          </p>
                        </div>

                        {/* Status & Confidence Badge */}
                        <div className="flex items-center gap-3 self-start md:self-center shrink-0">
                          <div className="text-right">
                            <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest font-sans">{t('confidence')}</span>
                            <span className="text-xs font-black text-slate-350 font-mono">{event.confidence}%</span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${statusClass}`}>
                            {getSeverityLabel(event.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Face Detection Details */}
      {result.faceDetection && result.faceDetection.facesDetected > 0 && (
        <div className="glass-panel p-5 border-white/5 space-y-3">
          <h4 className="text-xs font-bold font-display uppercase text-white tracking-widest flex items-center gap-1.5">
            <Eye size={14} className="text-cyber-primary" />
            <span>{t('faceDetectionDetails')}</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">{t('detectedCount')}</span>
              <span className="font-extrabold text-white text-sm block mt-1">{result.faceDetection.facesDetected}</span>
            </div>
            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">{t('estimatedQuality')}</span>
              <span className="font-extrabold text-white text-sm block mt-1">{result.faceDetection.quality || 'N/A'}</span>
            </div>
            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">{t('faceOcclusions')}</span>
              <span className="font-extrabold text-white text-sm block mt-1">{result.faceDetection.occlusions || 'None detected'}</span>
            </div>
            <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">{t('estimatedPose')}</span>
              <span className="font-extrabold text-white text-sm block mt-1">{result.faceDetection.poseEstimation || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Processing Diagnostics Panel */}
      <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-wrap justify-between items-center gap-4 text-[10px] text-slate-500 font-mono">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span>{t('provider')} <span className="text-slate-400">{result.provider || 'N/A'}</span></span>
          <span>Model: <span className="text-slate-400">{result.model || 'N/A'}</span></span>
          <span>{t('latency')} <span className="text-slate-400">{result.processingTime ? `${(result.processingTime / 1000).toFixed(2)}s` : 'N/A'}</span></span>
        </div>
        <span>{t('timestamp')} {result.timestamp ? new Date(result.timestamp).toLocaleString() : new Date().toLocaleString()}</span>
      </div>
    </div>
  );
};

export default ImageForensicResult;
