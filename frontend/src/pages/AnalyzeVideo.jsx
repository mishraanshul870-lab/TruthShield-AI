import React, { useState, useRef } from 'react';
import { Video, Upload, RefreshCw, AlertCircle, ShieldCheck, X, Replace, Search, FileVideo } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import API_BASE from "../api";
import VideoForensicResult from '../components/VideoForensicResult';

const AnalyzeVideo = () => {
  const { t, i18n } = useTranslation('video');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  const [meta, setMeta] = useState({
    duration: '',
    resolution: '',
    fps: '',
    codec: '',
    fileSize: '',
    thumbnail: ''
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    processVideoFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;
    processVideoFile(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const processVideoFile = (selectedFile) => {
    // Check size limit: 100MB
    if (selectedFile.size > 100 * 1024 * 1024) {
      setError(t('fileSizeError'));
      setFile(null);
      setPreview('');
      return;
    }

    const allowedExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    const ext = selectedFile.name.slice(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setError(t('unsupportedFormatError'));
      setFile(null);
      setPreview('');
      return;
    }

    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
    setError('');

    // Initialize metadata
    setMeta({
      duration: t('detectingMeta'),
      resolution: t('detectingMeta'),
      fps: t('awaitingScan'),
      codec: t('awaitingScan'),
      fileSize: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
      thumbnail: ''
    });

    // Extract client metadata & local thumbnail
    const video = document.createElement('video');
    video.src = objectUrl;
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      const durationFormatted = `${Math.floor(video.duration / 60)}:${String(Math.floor(video.duration % 60)).padStart(2, '0')}`;
      const resolution = `${video.videoWidth}x${video.videoHeight}`;
      
      setMeta(prev => ({
        ...prev,
        duration: durationFormatted,
        resolution
      }));

      // Seek to 1s or middle to capture thumbnail
      video.currentTime = Math.min(1.0, video.duration / 2);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 270;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setMeta(prev => ({
          ...prev,
          thumbnail: dataUrl
        }));
      } catch (err) {
        console.error('Failed to capture local video frame thumbnail:', err);
      }
    };
  };

  const handleRemoveFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview('');
    setError('');
    setMeta({
      duration: '',
      resolution: '',
      fps: '',
      codec: '',
      fileSize: '',
      thumbnail: ''
    });
  };

  const handleReplaceFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleScanVideo = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!file) {
      setError(t('uploadFirstError'));
      return;
    }

    setLoading(true);
    setResult(null);
    setError('');

    setStatusMessage(t('statusUploading'));
    const timer1 = setTimeout(() => setStatusMessage(t('statusDecompiling')), 800);
    const timer2 = setTimeout(() => setStatusMessage(t('statusFrameMesh')), 2000);
    const timer3 = setTimeout(() => setStatusMessage(t('statusLipMovements')), 3500);

    try {
      const token = localStorage.getItem('token');
      const customHFKey = localStorage.getItem('x-huggingface-key') || '';
      
      const formData = new FormData();
      formData.append('video', file);

      const headers = { 
        'Authorization': `Bearer ${token}`,
        'x-language': i18n.language || 'en'
      };

      if (customHFKey) {
        headers['x-huggingface-key'] = customHFKey;
      }

      const response = await fetch(`${API_BASE}/api/analyze/video`, {
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
        throw new Error(data.message || t('scanFailedError'));
      }

      setResult(data);
      window.dispatchEvent(new Event('scan-completed'));
      window.dispatchEvent(new Event('scan-updated'));
      try {
        localStorage.setItem('latestVideoScan', JSON.stringify({
          result: data,
          preview: meta.thumbnail || '',
          meta: meta
        }));
      } catch (cacheErr) {
        console.warn('[AnalyzeVideo] Local storage caching failed:', cacheErr.message);
      }
    } catch (err) {
      console.error('Scan error:', err);
      if (err.message === 'Failed to fetch') {
        setError(t('connectionOfflineError'));
      } else {
        setError(err.message || t('threatScanFailed'));
      }
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setLoading(false);
      setStatusMessage('');
    }
  };

  const handleScanAgain = () => {
    localStorage.removeItem('latestVideoScan');
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview('');
    setResult(null);
    setError('');
    setMeta({
      duration: '',
      resolution: '',
      fps: '',
      codec: '',
      fileSize: '',
      thumbnail: ''
    });
  };

  // Determine current page state
  const isEmpty = !file && !result && !loading && !error;
  const hasFile = !!file && !result && !loading && !error;
  const isAnalyzing = loading;
  const hasFailed = !!error && !result && !loading;
  const hasResult = !!result;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 bg-cyber-bg min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-extrabold tracking-wider text-white font-display uppercase flex items-center gap-2">
          <Video className="text-cyber-primary" />
          <span>{t('pageTitle')}</span>
        </h1>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">{t('pageSubtitle')}</p>
      </div>

      {/* ──────────────────── STATE: Results ──────────────────── */}
      {hasResult ? (
        <VideoForensicResult result={result} onScanAgain={handleScanAgain} />
      ) : (
        <div className="glass-panel p-6 sm:p-8 border-white/5 shadow-md">

          {/* ──────────────────── STATE: Empty (Initial) ──────────────────── */}
          {isEmpty && (
            <div
              className="flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl p-10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-[#7C3AED]/30 transition-all duration-300 relative min-h-[340px] cursor-pointer group"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7C3AED]/20 to-[#A855F7]/10 border border-[#7C3AED]/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(124,58,237,0.2)] transition-all duration-300">
                <FileVideo size={36} className="text-[#A855F7]" />
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
                <span>{t('dragUpload')}</span>
              </div>
            </div>
          )}

          {/* ──────────────────── STATE: File Selected ──────────────────── */}
          {hasFile && (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center border border-dashed border-[#7C3AED]/30 rounded-2xl p-6 bg-[#7C3AED]/[0.03] min-h-[280px]">
                <video 
                  src={preview} 
                  controls
                  className="max-h-60 rounded-2xl border border-[#4E2EF2]/15 w-full max-w-md bg-black shadow-glow-purple mb-4" 
                />

                {/* Forensic Preview HUD */}
                <div className="w-full max-w-md space-y-3">
                  <span className="block text-[10px] font-bold font-display uppercase tracking-widest text-slate-500 mb-2 pl-0.5">{t('streamPreviewParams')}</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                    <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-left relative overflow-hidden group">
                      <span className="block text-[7px] font-bold font-display uppercase tracking-wider text-slate-500">{t('thumbnail')}</span>
                      {meta.thumbnail ? (
                        <img src={meta.thumbnail} className="w-full h-12 object-cover rounded-lg border border-white/5 mt-1.5 shadow-inner" alt={t('previewThumbnail')} />
                      ) : (
                        <div className="w-full h-12 bg-slate-900 animate-pulse rounded-lg mt-1.5 border border-white/5"></div>
                      )}
                    </div>
                    <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-left flex flex-col justify-between">
                      <span className="block text-[7px] font-bold font-display uppercase tracking-wider text-slate-500">{t('duration')}</span>
                      <span className="text-xs font-extrabold text-white mt-1.5 block font-mono">{meta.duration}</span>
                    </div>
                    <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-left flex flex-col justify-between">
                      <span className="block text-[7px] font-bold font-display uppercase tracking-wider text-slate-500">{t('resolution')}</span>
                      <span className="text-xs font-extrabold text-white mt-1.5 block font-mono">{meta.resolution}</span>
                    </div>
                    <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-left flex flex-col justify-between">
                      <span className="block text-[7px] font-bold font-display uppercase tracking-wider text-slate-500">{t('fps')}</span>
                      <span className="text-[9px] font-extrabold text-slate-650 mt-1.5 block font-sans italic">{meta.fps}</span>
                    </div>
                    <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-left flex flex-col justify-between">
                      <span className="block text-[7px] font-bold font-display uppercase tracking-wider text-slate-500">{t('codec')}</span>
                      <span className="text-[9px] font-extrabold text-slate-655 mt-1.5 block font-sans italic">{meta.codec}</span>
                    </div>
                    <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-left flex flex-col justify-between">
                      <span className="block text-[7px] font-bold font-display uppercase tracking-wider text-slate-500">{t('fileSize')}</span>
                      <span className="text-xs font-extrabold text-white mt-1.5 block font-mono">{meta.fileSize}</span>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-4">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <ShieldCheck size={13} className="text-[#22C55E]" />
                    <span className="text-[10px] font-extrabold font-display uppercase tracking-wider text-[#22C55E]">{t('fileSelected')}</span>
                  </div>
                  <span className="block text-xs font-bold text-slate-350 font-display mb-2">{file.name}</span>
                  
                  <div className="flex items-center justify-center gap-3 mt-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={handleReplaceFile}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-[#7C3AED]/40 text-[10px] font-bold font-display uppercase tracking-wider text-slate-400 hover:text-white transition-all"
                    >
                      <Replace size={11} />
                      <span>{t('replaceVideo')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/5 border border-rose-500/20 hover:border-rose-500/40 text-[10px] font-bold font-display uppercase tracking-wider text-rose-450 hover:text-rose-400 transition-all"
                    >
                      <X size={11} />
                      <span>{t('removeVideo')}</span>
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleScanVideo}
                className="w-full py-3.5 rounded-xl gradient-btn shadow-glow-purple font-display uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                <Search size={15} />
                <span>{t('analyzeVideo')}</span>
              </button>
            </div>
          )}

          {/* ──────────────────── STATE: Analyzing ──────────────────── */}
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center min-h-[340px] space-y-6">
              {meta.thumbnail && (
                <img 
                  src={meta.thumbnail} 
                  alt="Analyzing" 
                  className="max-h-32 rounded-xl object-contain border border-white/10 opacity-60" 
                />
              )}
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-[#7C3AED]/30 border-t-[#A855F7] animate-spin" />
                <span className="text-xs font-extrabold font-display uppercase tracking-wider text-white">
                  {statusMessage || t('analyzing')}
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
                    <AlertCircle size={20} className="text-rose-450" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold font-display uppercase tracking-wider text-white mb-1">{t('errorTitle')}</h3>
                    <p className="text-xs text-rose-400 font-semibold leading-relaxed">
                      {error}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleScanVideo}
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
                  <Video size={13} />
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

export default AnalyzeVideo;
