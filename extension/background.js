// TruthShield AI Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('🛡️ TruthShield AI - Web Authenticity Extension initialized successfully.');
});

// Event listener for tab transitions if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log(`Navigated to active tab: ${tab.url}`);
  }
});
