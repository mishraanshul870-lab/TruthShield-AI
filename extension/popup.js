document.addEventListener('DOMContentLoaded', async () => {
  const currentUrlText = document.getElementById('current-url');
  const btnScan = document.getElementById('btn-scan');
  const btnReset = document.getElementById('btn-reset');
  const btnFullReport = document.getElementById('btn-full-report');
  const btnSaveToken = document.getElementById('btn-save-token');
  const inputToken = document.getElementById('input-token');
  const inputOpenaiKey = document.getElementById('input-openai-key');
  
  // Views
  const scanView = document.getElementById('scan-view');
  const loadingView = document.getElementById('loading-view');
  const resultsView = document.getElementById('results-view');
  const errorView = document.getElementById('error-view');
  
  // Elements
  const loadingStatus = document.getElementById('loading-status');
  const errorMessage = document.getElementById('error-message');
  const btnErrorAction = document.getElementById('btn-error-action');
  
  // Results details
  const resultVerdict = document.getElementById('result-verdict');
  const resultThreat = document.getElementById('result-threat');
  const resultCredibility = document.getElementById('result-credibility');
  const resultRisk = document.getElementById('result-risk');
  const riskFill = document.getElementById('risk-fill');
  const resultExplanation = document.getElementById('result-explanation');

  let activeUrl = '';
  let lastScanId = '';

  // Get active tab URL
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        activeUrl = tabs[0].url;
        currentUrlText.textContent = activeUrl;
        
        // Disable scan on chrome utility pages
        if (activeUrl.startsWith('chrome://') || activeUrl.startsWith('chrome-extension://')) {
          btnScan.disabled = true;
          currentUrlText.textContent = 'System pages cannot be scanned.';
          btnScan.textContent = 'SYSTEM BLOCKED';
        }
      }
    });
  } else {
    // Sandbox / dev testing fallback
    activeUrl = 'https://www.bbc.com/news/world-65123456';
    currentUrlText.textContent = activeUrl;
  }

  // Load saved credentials from storage
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['jwt_token', 'openai_key'], (res) => {
      if (res.jwt_token) inputToken.value = res.jwt_token;
      if (res.openai_key) inputOpenaiKey.value = res.openai_key;
    });
  } else {
    inputToken.value = localStorage.getItem('jwt_token') || '';
    inputOpenaiKey.value = localStorage.getItem('openai_key') || '';
  }

  // Save config action
  btnSaveToken.addEventListener('click', () => {
    const token = inputToken.value.trim();
    const key = inputOpenaiKey.value.trim();
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ jwt_token: token, openai_key: key }, () => {
        alert('Configuration saved successfully.');
      });
    } else {
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('openai_key', key);
      alert('Configuration saved successfully.');
    }
  });

  // Reset scan trigger
  btnReset.addEventListener('click', () => {
    resultsView.classList.add('hidden');
    scanView.classList.remove('hidden');
  });

  // Open Full Report trigger
  btnFullReport.addEventListener('click', () => {
    if (lastScanId) {
      const url = `http://localhost:5173/history?id=${lastScanId}`;
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({ url });
      } else {
        window.open(url, '_blank');
      }
    }
  });

  // Error retry trigger
  btnErrorAction.addEventListener('click', () => {
    errorView.classList.add('hidden');
    scanView.classList.remove('hidden');
  });

  // Scan trigger
  btnScan.addEventListener('click', async () => {
    const token = inputToken.value.trim();
    if (!token) {
      showError('Authentication token required. Expand settings below and paste your JWT token from the web app profile.');
      return;
    }

    // Switch to loading
    scanView.classList.add('hidden');
    loadingView.classList.remove('hidden');
    
    loadingStatus.textContent = 'Contacting TruthShield APIs...';
    const timer1 = setTimeout(() => { loadingStatus.textContent = 'Auditing WHOIS & domain profiles...'; }, 1000);
    const timer2 = setTimeout(() => { loadingStatus.textContent = 'Running linguistic threat analyses...'; }, 2400);

    try {
      const cleanToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
      
      // Build headers with optional OpenAI key
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanToken}`
      };

      // Try to get saved OpenAI key
      let openaiKey = '';
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const stored = await new Promise(resolve => chrome.storage.local.get(['openai_key'], resolve));
        openaiKey = stored.openai_key || '';
      } else {
        openaiKey = localStorage.getItem('openai_key') || '';
      }
      if (openaiKey) {
        headers['x-openai-key'] = openaiKey;
      }

      const response = await fetch('http://localhost:5000/api/analyze/url', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url: activeUrl })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Server returned threat validation error');
      }

      // Track the scan ID for deep link redirection
      lastScanId = data.scanId;

      // Populate results
      resultVerdict.textContent = data.prediction.toUpperCase();
      resultVerdict.className = 'verdict-value ' + (data.prediction === 'Fake' ? 'text-rose' : 'text-emerald');
      
      // Custom text styling colors in CSS
      if (data.prediction === 'Fake') {
        resultVerdict.style.color = '#EF4444';
      } else {
        resultVerdict.style.color = '#22C55E';
      }

      const threatScore = data.prediction === 'Fake' ? data.confidenceScore : (100 - data.confidenceScore);
      resultThreat.textContent = `${threatScore}%`;
      resultCredibility.textContent = `${data.credibilityScore}/100`;
      resultRisk.textContent = data.riskLevel.toUpperCase();
      resultExplanation.textContent = data.explanation;

      // Color risk details
      let riskColor = '#22C55E'; // green
      if (data.riskLevel === 'Medium') riskColor = '#F59E0B'; // orange
      if (data.riskLevel === 'High') riskColor = '#EF4444'; // red
      
      resultRisk.style.color = riskColor;
      riskFill.style.backgroundColor = riskColor;
      riskFill.style.width = `${threatScore}%`;

      // Display results view
      loadingView.classList.add('hidden');
      resultsView.classList.remove('hidden');

    } catch (err) {
      console.error(err);
      showError(err.message || 'Connection failure. Start backend on port 5000.');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
    }
  });

  function showError(msg) {
    loadingView.classList.add('hidden');
    scanView.classList.add('hidden');
    resultsView.classList.add('hidden');
    
    errorMessage.textContent = msg;
    errorView.classList.remove('hidden');
  }
});
