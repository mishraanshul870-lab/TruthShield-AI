import React, { useState } from 'react';
import { Link2, Search, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ResultCard from '../components/ResultCard';

const VerifyUrl = () => {
  const { t, i18n } = useTranslation('url');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleVerifyUrl = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setError(t('enterUrlError'));
      return;
    }

    try {
      new URL(url);
    } catch {
      setError(t('validUrlError'));
      return;
    }

    setLoading(true);
    setResult(null);
    setError('');

    setStatusMessage(t('statusResolving'));
    const timer1 = setTimeout(() => setStatusMessage(t('statusFetching')), 1000);
    const timer2 = setTimeout(() => setStatusMessage(t('statusAnalyzing')), 2000);

    try {
      const token = localStorage.getItem('token');
      const customOpenAIKey = localStorage.getItem('x-openai-key') || '';
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-language': i18n.language || 'en'
      };

      if (customOpenAIKey) {
        headers['x-openai-key'] = customOpenAIKey;
      }

      const response = await fetch('/api/analyze/url', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url })
      });

      let data = {};
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        throw new Error(t('offlineError'));
      }

      if (!response.ok) {
        const errorObj = new Error(data.message || t('verificationFailed'));
        if (data.providerStatuses) {
          errorObj.providerStatuses = data.providerStatuses;
        }
        throw errorObj;
      }

      setResult(data);
      window.dispatchEvent(new Event('scan-completed'));
      window.dispatchEvent(new Event('scan-updated'));
    } catch (err) {
      console.error('URL Verification error:', err);
      if (err.message === 'Failed to fetch') {
        setError(t('offlineError'));
      } else if (err.providerStatuses) {
        setError({ message: err.message, providerStatuses: err.providerStatuses });
      } else {
        setError(err.message || t('domainCheckFailed'));
      }
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setLoading(false);
      setStatusMessage('');
    }
  };

  const handleScanAgain = () => {
    setUrl('');
    setResult(null);
    setError('');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 bg-cyber-bg min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-extrabold tracking-wider text-white font-display uppercase flex items-center gap-2">
          <Link2 className="text-cyber-primary" />
          <span>{t('pageTitle')}</span>
        </h1>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">{t('pageSubtitle')}</p>
      </div>

      {!result ? (
        <div className="glass-panel p-6 sm:p-8 border-white/5 shadow-md">
          <form onSubmit={handleVerifyUrl} className="space-y-6">
            
            <div className="flex flex-col">
              <label className="block text-[10px] font-bold font-display uppercase tracking-wider text-slate-400 mb-2.5 pl-1">
                {t('enterLink')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (error) setError('');
                  }}
                  disabled={loading}
                  placeholder={t('urlPlaceholder')}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-cyber-primary/60 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold space-y-2.5">
                {typeof error === 'object' && error.providerStatuses ? (
                  <div className="space-y-2 text-rose-400">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <AlertCircle size={14} className="shrink-0 text-rose-500" />
                      <span>{error.message}</span>
                    </div>
                    <div className="border-t border-rose-500/20 pt-2 space-y-1 font-mono text-[11px]">
                      {Object.entries(error.providerStatuses).map(([prov, status]) => (
                        <div key={prov} className="flex justify-between">
                          <span className="text-slate-400">{prov}:</span>
                          <span>{status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-rose-400">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{typeof error === 'object' ? error.message : error}</span>
                  </div>
                )}
              </div>
            )}

            {/* Verify button */}
            <button
              type="submit"
              disabled={loading || !url}
              className="w-full py-3.5 rounded-xl gradient-btn shadow-glow-purple font-display uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="animate-spin text-[#0B0F1A]" />
                  <span>{statusMessage}</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={15} />
                  <span>{t('runDiagnostics')}</span>
                </>
              )}
            </button>

          </form>
        </div>
      ) : (
        <ResultCard result={result} onScanAgain={handleScanAgain} />
      )}
    </div>
  );
};

export default VerifyUrl;
