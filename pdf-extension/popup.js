const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const progressWrap = document.getElementById('progressWrap');
const progressBar = document.getElementById('progressBar');
const status = document.getElementById('status');
const initOverlay = document.getElementById('initOverlay');
const initBar = document.getElementById('initBar');
const initStatus = document.getElementById('initStatus');

const langSelect = document.getElementById('langSelect');

// Kaydedilmiş dili yükle
chrome.storage.local.get('lang', ({ lang }) => {
  if (lang) langSelect.value = lang;
});

// Dil değişince yeniden init et
langSelect.addEventListener('change', () => {
  const lang = langSelect.value;
  chrome.storage.local.set({ lang });
  chrome.storage.session.set({ tesseractReady: false });
  document.body.appendChild(buildOverlay());
  chrome.runtime.sendMessage({ action: 'init', lang });
});

// Init durumunu kontrol et
chrome.storage.session.get(['tesseractReady', 'state'], (data) => {
  const lang = langSelect.value;
  if (!data.tesseractReady) {
    chrome.runtime.sendMessage({ action: 'init', lang });
  } else {
    initOverlay.classList.add('hidden');
    setTimeout(() => initOverlay.remove(), 400);
  }
});

function buildOverlay() {
  const existing = document.getElementById('initOverlay');
  if (existing) return existing;
  const el = document.createElement('div');
  el.id = 'initOverlay';
  el.innerHTML = `
    <svg width="44" height="44" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="white" fill-opacity="0.15"/>
      <path d="M7 7h14v2H7zM7 12h14v2H7zM7 17h9v2H7z" fill="white"/>
    </svg>
    <h3>PageScribe</h3>
    <p>Loading language data,<br>this only happens once per language.</p>
    <div class="init-progress-wrap"><div id="initBar"></div></div>
    <div id="initStatus">Starting...</div>`;
  return el;
}

// Devam eden işlem var mı kontrol et
chrome.storage.session.get('state', ({ state }) => {
  if (state?.running) {
    setRunning(true);
    setProgress(Math.round((state.current / state.total) * 100));
    showStatus(`Page ${state.current} / ${state.total}`);
  } else if (state?.last) {
    const msg = state.last;
    if (msg.action === 'done') {
      showStatus(`Done! ${msg.total} pages → ${msg.filename}`, 'done');
    } else if (msg.action === 'stopped') {
      showStatus(`Stopped at page ${msg.current}.`, 'stopped');
    } else if (msg.action === 'error') {
      showStatus(`Error: ${msg.message}`, 'error');
    }
  }
});

startBtn.addEventListener('click', async () => {
  const startPage = parseInt(document.getElementById('startPage').value);
  const stopPage = parseInt(document.getElementById('stopPage').value);
  if (!startPage || !stopPage || startPage < 1 || stopPage < startPage) {
    showStatus('Invalid page range.', 'error');
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  setRunning(true);
  setProgress(0);
  showStatus('Starting...');

  chrome.runtime.sendMessage({ action: 'start', tabId: tab.id, url: tab.url, startPage, stopPage, lang: langSelect.value });
});

stopBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'stop' });
  showStatus('Stopping...', '');
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'initProgress') {
    initBar.style.width = msg.progress + '%';
    initStatus.textContent = msg.status || 'Loading...';
  } else if (msg.action === 'initDone') {
    initBar.style.width = '100%';
    initStatus.textContent = 'Ready!';
    setTimeout(() => {
      initOverlay.classList.add('hidden');
      setTimeout(() => initOverlay.remove(), 400);
    }, 500);
  } else if (msg.action === 'initError') {
    initStatus.textContent = `Error: ${msg.message}`;
  } else if (msg.action === 'progress') {
    setProgress(Math.round((msg.current / msg.total) * 100));
    showStatus(msg.status ? `${msg.status}` : `Page ${msg.current} / ${msg.total}`);
  } else if (msg.action === 'done') {
    setProgress(100);
    showStatus(`Done! ${msg.total} pages → ${msg.filename}`, 'done');
    setRunning(false);
  } else if (msg.action === 'stopped') {
    showStatus(`Stopped at page ${msg.current}.`, 'stopped');
    setRunning(false);
  } else if (msg.action === 'error') {
    showStatus(`Error: ${msg.message}`, 'error');
    setRunning(false);
  }
});

function setRunning(running) {
  startBtn.disabled = running;
  stopBtn.style.display = running ? 'block' : 'none';
  progressWrap.style.display = running ? 'block' : 'none';
}

function setProgress(pct) {
  progressBar.style.width = pct + '%';
}

function showStatus(text, type = '') {
  status.textContent = text;
  status.className = type;
}
