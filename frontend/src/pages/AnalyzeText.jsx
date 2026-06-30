import React, { useState } from 'react';
import { FileText, Upload, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FactCheckResult from '../components/FactCheckResult';

const AnalyzeText = () => {
  const { t } = useTranslation('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setText('');
      setError('');
    } else {
      setError(t('pdfSelectError'));
      setFile(null);
    }
  };

  const handleScanText = async (e) => {
    e.preventDefault();
    if (!text.trim() && !file) {
      setError(t('textProvideError'));
      return;
    }

    setLoading(true);
    setResult(null);
    setError('');
    
    setStatusMessage(t('statusReading'));
    const timer1 = setTimeout(() => setStatusMessage(t('statusLexical')), 1000);
    const timer2 = setTimeout(() => setStatusMessage(t('statusNeural')), 2200);

    try {
      const token = localStorage.getItem('token');
      const customOpenAIKey = localStorage.getItem('x-openai-key') || '';
      
      let response;
      const headers = { 'Authorization': `Bearer ${token}` };
      
      if (customOpenAIKey) {
        headers['x-openai-key'] = customOpenAIKey;
      }

      if (file) {
        const formData = new FormData();
        formData.append('pdf', file);
        
        response = await fetch('/api/analyze/text', {
          method: 'POST',
          headers,
          body: formData
        });
      } else {
        response = await fetch('/api/analyze/text', {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text })
        });
      }

      let data = {};
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        throw new Error(t('offlineError'));
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
    } catch (err) {
      console.error('Scan error:', err);
      if (err.message === 'Failed to fetch') {
        setError(t('offlineError'));
      } else if (err.providerStatuses) {
        setError({ message: err.message, providerStatuses: err.providerStatuses });
      } else {
        setError(err.message || t('threatScanFailedError'));
      }
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setLoading(false);
      setStatusMessage('');
    }
  };

  const handleScanAgain = () => {
    setText('');
    setFile(null);
    setResult(null);
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 bg-cyber-bg min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-extrabold tracking-wider text-white font-display uppercase flex items-center gap-2">
          <FileText className="text-cyber-primary" />
          <span>{t('pageTitle')}</span>
        </h1>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">{t('pageSubtitle')}</p>
      </div>

      {!result ? (
        <div className="glass-panel p-6 sm:p-8 border-white/5 shadow-md">
          <form onSubmit={handleScanText} className="space-y-6">
            
            {/* Input Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Text Input Area */}
              <div className="flex flex-col">
                <label className="block text-[10px] font-bold font-display uppercase tracking-wider text-slate-400 mb-2.5 pl-1">
                  {t('optionAText')}
                </label>
                <textarea
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    if (file) setFile(null);
                  }}
                  disabled={loading}
                  placeholder={t('pastePlaceholder')}
                  className="flex-grow min-h-[180px] bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-cyber-primary/60 transition-colors resize-none"
                />
              </div>

              {/* PDF Dropzone */}
              <div className="flex flex-col">
                <label className="block text-[10px] font-bold font-display uppercase tracking-wider text-slate-400 mb-2.5 pl-1">
                  {t('optionBPdf')}
                </label>
                <div className="flex-grow flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl p-6 bg-white/[0.02] hover:bg-white/[0.05] transition-colors relative min-h-[180px]">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    disabled={loading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload size={36} className="text-slate-500 mb-3" />
                  <span className="text-xs font-bold font-display uppercase tracking-wider text-slate-300">
                    {file ? file.name : t('dragDropPdf')}
                  </span>
                  <span className="text-[9px] text-slate-500 mt-1.5 uppercase font-bold tracking-wider">{t('maxSize')}</span>
                </div>
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

            {/* Scan Action */}
            <button
              type="submit"
              disabled={loading}
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
                  <span>{t('executeScan')}</span>
                </>
              )}
            </button>

          </form>
        </div>
      ) : (
        <FactCheckResult result={result} onScanAgain={handleScanAgain} />
      )}
    </div>
  );
};

export default AnalyzeText;
