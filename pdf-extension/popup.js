const startBtn = document.getElementById('startBtn');
const appendMode = document.getElementById('appendMode');
const fileWrap = document.getElementById('fileWrap');
const docxFile = document.getElementById('docxFile');
const fileStatus = document.getElementById('fileStatus');

appendMode.addEventListener('change', () => {
  fileWrap.style.display = appendMode.checked ? 'block' : 'none';
  if (!appendMode.checked) { docxFile.value = ''; fileStatus.textContent = ''; }
});

docxFile.addEventListener('change', () => {
  const file = docxFile.files[0];
  fileStatus.textContent = file ? `✓ ${file.name}` : '';
});
const stopBtn = document.getElementById('stopBtn');
const progressWrap = document.getElementById('progressWrap');
const progressBar = document.getElementById('progressBar');
const status = document.getElementById('status');

// Popup açılınca background'da devam eden işlem var mı kontrol et
chrome.storage.session.get('state', ({ state }) => {
  if (state?.running) {
    setRunning(true);
    setProgress(Math.round((state.current / state.total) * 100));
    showStatus(`Page ${state.current} / ${state.total}`);
  } else if (state?.last) {
    const msg = state.last;
    if (msg.action === 'done') {
      showStatus(`Done! ${msg.total} pages saved to output.docx`, 'done');
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

  const append = appendMode.checked;

  if (append) {
    if (!docxFile.files[0]) {
      showStatus('Select a .docx file to append to.', 'error');
      setRunning(false);
      return;
    }

    // Dosyayı direkt buradan servera yükle
    showStatus('Uploading file...');
    try {
      const fileData = await readFileAsBase64(docxFile.files[0]);
      const res = await fetch('http://localhost:8765/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: fileData })
      });
      if (!res.ok) throw new Error('Upload failed');
    } catch (e) {
      showStatus('Could not upload file. Is server running?', 'error');
      setRunning(false);
      return;
    }
  }

  chrome.runtime.sendMessage({ action: 'start', tabId: tab.id, url: tab.url, startPage, stopPage, append });
});

stopBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'stop' });
  showStatus('Stopping...', '');
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'progress') {
    const pct = Math.round((msg.current / msg.total) * 100);
    setProgress(pct);
    showStatus(`Page ${msg.current} / ${msg.total}`);
  } else if (msg.action === 'done') {
    setProgress(100);
    showStatus(`Done! ${msg.total} pages → ${msg.filename || 'output.docx'}`, 'done');
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

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
