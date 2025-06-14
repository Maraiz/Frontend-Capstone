// config.js - Simple Fallback Version
const CONFIG = {
  URLS: [
    'http://api-itcalori-cc25-cf336.duckdns.org',
    'http://85.209.163.247:5000'
  ],
  BASE_URL: null, // akan di-set otomatis
  TIMEOUT: 3000,
  _currentIndex: 0,
  _lastCheck: 0,
  _checkInterval: 5 * 60 * 1000 // 5 menit
};

// Simple health check
async function testURL(url) {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
    
    const response = await fetch(`${url}/health`, {
      signal: controller.signal
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Get working URL dengan caching
async function getWorkingURL() {
  const now = Date.now();
  
  // Kalau masih fresh, pakai yang ada
  if (CONFIG.BASE_URL && (now - CONFIG._lastCheck) < CONFIG._checkInterval) {
    return CONFIG.BASE_URL;
  }
  
  // Test dari current index dulu
  for (let i = 0; i < CONFIG.URLS.length; i++) {
    const index = (CONFIG._currentIndex + i) % CONFIG.URLS.length;
    const url = CONFIG.URLS[index];
    
    if (await testURL(url)) {
      CONFIG.BASE_URL = url;
      CONFIG._currentIndex = index;
      CONFIG._lastCheck = now;
      console.log(`🌐 Using server: ${url}`);
      return url;
    }
  }
  
  // Kalau semua gagal, pakai yang pertama
  CONFIG.BASE_URL = CONFIG.URLS[0];
  CONFIG._lastCheck = now;
  console.warn('⚠️ All servers failed, using primary as fallback');
  return CONFIG.BASE_URL;
}

// Function untuk force next URL (kalau ada error)
function switchToNextURL() {
  CONFIG._currentIndex = (CONFIG._currentIndex + 1) % CONFIG.URLS.length;
  CONFIG._lastCheck = 0; // Force recheck
  CONFIG.BASE_URL = null;
  console.log(`🔄 Switching to next server...`);
}

// Export dynamic BASE_URL
CONFIG.getBaseURL = getWorkingURL;
CONFIG.switchToNext = switchToNextURL;

// Initialize saat startup
getWorkingURL();

export default CONFIG;