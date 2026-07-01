import React, { useState, useRef } from 'react';
import { Image, Upload, RefreshCw, AlertCircle, ShieldCheck, X, Replace, Search, FileImage } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import API_BASE from "../api";
import ImageForensicResult from '../components/ImageForensicResult';

const AnalyzeImage = () => {
  const { t, i18n } = useTranslation('image');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError('');
    } else {
      setError(t('validImageError'));
      setFile(null);
      setPreview('');
    }
  };

  const handleDrop = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      setPreview(URL.createObjectURL(droppedFile));
      setError('');
    } else {
      setError(t('validImageError'));
    }
  };

  const handleDragOver = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleRemoveFile = () => {
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview('');
    setError('');
  };

  const handleReplaceFile = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleScanImage = async (e) => {
    e.preventDefault();
    if (!file) {
      setError(t('uploadFirstError'));
      return;
    }

    setLoading(true);
    setResult(null);
    setError('');

    setStatusMessage('uploading');
    const timer1 = setTimeout(() => setStatusMessage('extractingMetadata'), 800);
    const timer2 = setTimeout(() => setStatusMessage('runningAi'), 1800);
    const timer3 = setTimeout(() => setStatusMessage('localization'), 3000);
    const timer4 = setTimeout(() => setStatusMessage('buildingReport'), 4200);

    try {
      const token = localStorage.getItem('token');
      const customHFKey = localStorage.getItem('x-huggingface-key') || '';
      
      const formData = new FormData();
      formData.append('image', file);

      const headers = { 
        'Authorization': `Bearer ${token}`,
        'x-language': i18n.language || 'en'
      };

      if (customHFKey) {
        headers['x-huggingface-key'] = customHFKey;
      }

      const response = await fetch(`${API_BASE}/api/analyze/image`, {
        method: 'POST',
        headers,
        body: formData
      });

      let data = {};
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        throw new Error(t('connectionOfflineError'));
      }

      if (!response.ok) {
        const errorObj = new Error(data.message || t('scanFailedError'));
        if (data.providerStatuses) {
          errorObj.providerStatuses = data.providerStatuses;
        }
        throw errorObj;
      }

      setResult(data);
      window.dispatchEvent(new Event('scan-completed'));
      window.dispatchEvent(new Event('scan-updated'));
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          try {
            localStorage.setItem('latestImageScan', JSON.stringify({
              result: data,
              preview: reader.result
            }));
          } catch (cacheErr) {
            console.warn('[AnalyzeImage] Local storage caching failed:', cacheErr.message);
          }
        };
        reader.readAsDataURL(file);
      } else {
        try {
          localStorage.setItem('latestImageScan', JSON.stringify({
            result: data,
            preview: null
          }));
        } catch (cacheErr) {
          console.warn('[AnalyzeImage] Local storage caching failed:', cacheErr.message);
        }
      }
    } catch (err) {
      console.error('Scan error:', err);
      let friendlyMessage = t('unexpectedIssueError');
      const rawMsg = err.message || '';
      
      if (rawMsg === 'Failed to fetch' || rawMsg.includes(t('connectionOfflineError'))) {
        friendlyMessage = t('networkError');
      } else if (rawMsg.toLowerCase().includes('timeout') || rawMsg.includes('ETIMEDOUT')) {
        friendlyMessage = t('timeoutError');
      } else if (rawMsg.toLowerCase().includes('api key') || rawMsg.toLowerCase().includes('key not found') || rawMsg.toLowerCase().includes('api_key')) {
        friendlyMessage = t('authError');
      } else if (rawMsg.toLowerCase().includes('image parsing') || rawMsg.toLowerCase().includes('format') || rawMsg.toLowerCase().includes('corrupt')) {
        friendlyMessage = t('imageParseError');
      } else {
        friendlyMessage = rawMsg || t('processingError');
      }

      if (err.providerStatuses) {
        setError({ message: friendlyMessage, providerStatuses: err.providerStatuses });
      } else {
        setError(friendlyMessage);
      }
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      setLoading(false);
      setStatusMessage('');
    }
  };

  const handleScanAgain = () => {
    localStorage.removeItem('latestImageScan');
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview('');
    setResult(null);
    setError('');
  };

  // Determine current page state
  const isEmpty = !file && !result && !loading;
  const hasFile = !!file && !result && !loading && !error;
  const isAnalyzing = loading;
  const hasFailed = !!error && !result && !loading;
  const hasResult = !!result;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 bg-cyber-bg min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-extrabold tracking-wider text-white font-display uppercase flex items-center gap-2">
          <Image className="text-cyber-primary" />
          <span>{t('detectorTitle')}</span>
        </h1>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">{t('detectorSubtitle')}</p>
      </div>

      {/* ──────────────────── STATE: Results ──────────────────── */}
      {hasResult ? (
        <ImageForensicResult result={result} onScanAgain={handleScanAgain} originalPreview={preview} />
      ) : (
        <div 
          className="glass-panel p-6 sm:p-8 border-white/5 shadow-md"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* ──────────────────── STATE: Empty (Initial) ──────────────────── */}
          {isEmpty && (
            <div
              className="flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl p-10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#7C3AED]/30 transition-all duration-300 relative min-h-[340px] cursor-pointer group"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7C3AED]/20 to-[#A855F7]/10 border border-[#7C3AED]/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(124,58,237,0.2)] transition-all duration-300">
                <FileImage size={36} className="text-[#A855F7]" />
              </div>
              <h2 className="text-sm font-extrabold font-display uppercase tracking-wider text-white mb-2 text-center">
                {t('emptyStateTitle')}
              </h2>
              <p className="text-[11px] text-slate-400 text-center max-w-sm leading-relaxed mb-5">
                {t('emptyStateDesc')}
              </p>
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{t('emptyStateFormats')}</span>
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{t('emptyStateMaxSize')}</span>
              </div>
              <div className="mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white text-[10px] font-extrabold font-display uppercase tracking-widest flex items-center gap-2 group-hover:shadow-glow-purple transition-shadow">
                <Upload size={13} />
                <span>{t('dragClickUpload')}</span>
              </div>
            </div>
          )}

          {/* ──────────────────── STATE: File Selected ──────────────────── */}
          {hasFile && (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center border border-dashed border-[#7C3AED]/30 rounded-2xl p-8 bg-[#7C3AED]/[0.03] min-h-[260px]">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="max-h-48 rounded-xl object-contain border border-white/10 shadow-glow-purple mb-4" 
                />
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck size={13} className="text-[#22C55E]" />
                  <span className="text-[10px] font-extrabold font-display uppercase tracking-wider text-[#22C55E]">{t('fileSelected')}</span>
                </div>
                <span className="text-xs font-bold text-slate-300 font-display">{file.name}</span>
                <span className="text-[10px] text-slate-500 font-bold mt-0.5">{t('fileSizeLabel')} {formatFileSize(file.size)}</span>
                
                <div className="flex items-center gap-3 mt-4">
                  <button
                    type="button"
                    onClick={handleReplaceFile}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-[#7C3AED]/40 text-[10px] font-bold font-display uppercase tracking-wider text-slate-400 hover:text-white transition-all"
                  >
                    <Replace size={11} />
                    <span>{t('replaceImage')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/5 border border-rose-500/20 hover:border-rose-500/40 text-[10px] font-bold font-display uppercase tracking-wider text-rose-400 hover:text-rose-300 transition-all"
                  >
                    <X size={11} />
                    <span>{t('removeImage')}</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleScanImage}
                className="w-full py-3.5 rounded-xl gradient-btn shadow-glow-purple font-display uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                <Search size={15} />
                <span>{t('analyzeImage')}</span>
              </button>
            </div>
          )}

          {/* ──────────────────── STATE: Analyzing ──────────────────── */}
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center min-h-[340px] space-y-6">
              {preview && (
                <img 
                  src={preview} 
                  alt="Analyzing" 
                  className="max-h-32 rounded-xl object-contain border border-white/10 opacity-60" 
                />
              )}
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-[#7C3AED]/30 border-t-[#A855F7] animate-spin" />
                <span className="text-xs font-extrabold font-display uppercase tracking-wider text-white">
                  {t(statusMessage) || t('analyzing')}
                </span>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-pulse" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────── STATE: Error ──────────────────── */}
          {hasFailed && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-rose-500/[0.06] border border-rose-500/20 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                    <AlertCircle size={20} className="text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold font-display uppercase tracking-wider text-white mb-1">{t('errorTitle')}</h3>
                    <p className="text-xs text-rose-400 font-semibold leading-relaxed">
                      {typeof error === 'object' ? error.message : error}
                    </p>
                  </div>
                </div>

                {typeof error === 'object' && error.providerStatuses && (
                  <div className="border-t border-rose-500/20 pt-3 space-y-1 font-mono text-[11px]">
                    {Object.entries(error.providerStatuses).map(([prov, status]) => (
                      <div key={prov} className="flex justify-between text-rose-400">
                        <span className="text-slate-400">{prov}:</span>
                        <span>{status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setError(''); handleScanImage({ preventDefault: () => {} }); }}
                  disabled={!file}
                  className="flex-1 py-3 rounded-xl gradient-btn shadow-glow-purple font-display uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw size={13} />
                  <span>{t('errorRetry')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleScanAgain}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white font-display uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 transition-colors"
                >
                  <Image size={13} />
                  <span>{t('errorChooseAnother')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyzeImage;
