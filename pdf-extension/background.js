let stopRequested = false;

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'init') {
    ensureOffscreen()
      .then(() => sendToOffscreen({ action: 'init', lang: msg.lang || 'tur' }))
      .then(() => {
        chrome.storage.session.set({ tesseractReady: true });
        chrome.runtime.sendMessage({ action: 'initDone' }).catch(() => {});
      })
      .catch(err => chrome.runtime.sendMessage({ action: 'initError', message: err.message }).catch(() => {}));
  } else if (msg.action === 'start') {
    stopRequested = false;
    run(msg.tabId, msg.url, msg.startPage, msg.stopPage, msg.lang);
  } else if (msg.action === 'stop') {
    stopRequested = true;
  }
});

function notify(msg) {
  if (msg.action === 'progress') {
    chrome.storage.session.set({ state: { running: true, current: msg.current, total: msg.total } });
  } else {
    chrome.storage.session.set({ state: { running: false, last: msg } });
  }
  chrome.runtime.sendMessage(msg).catch(() => {});
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function waitForTabLoad(tabId) {
  return new Promise(resolve => {
    const timeout = setTimeout(resolve, 8000);
    function listener(id, info) {
      if (id === tabId && info.status === 'complete') {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function ensureOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['DOM_SCRAPING'],
    justification: 'Tesseract.js OCR and docx generation'
  });
}

function sendToOffscreen(msg) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ ...msg, target: 'offscreen' }, response => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      if (response?.error) return reject(new Error(response.error));
      resolve(response);
    });
  });
}

async function run(tabId, originalUrl, startPage, stopPage, lang = 'tur') {
  const baseUrl = originalUrl.split('#')[0];
  const total = stopPage - startPage + 1;
  const pages = [];
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  const filename = `output_${timestamp}.docx`;

  await ensureOffscreen();

  try {
    for (let page = startPage; page <= stopPage; page++) {
      const current = page - startPage + 1;

      if (stopRequested) {
        notify({ action: 'stopped', current: current - 1 });
        return;
      }

      notify({ action: 'progress', current, total });

      await chrome.tabs.update(tabId, { url: `${baseUrl}#page=${page}` });
      await waitForTabLoad(tabId);
      await sleep(1500);

      if (stopRequested) {
        notify({ action: 'stopped', current });
        return;
      }

      const imageDataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 85 });
      const { text } = await sendToOffscreen({ action: 'ocr', imageDataUrl, lang });
      pages.push({ page, text });
    }

    notify({ action: 'progress', current: total, total, status: 'Generating document...' });

    const { data } = await sendToOffscreen({ action: 'generate', pages, filename });

    const dataUrl = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${data}`;
    await chrome.downloads.download({ url: dataUrl, filename, saveAs: false });

    notify({ action: 'done', total, filename });

  } catch (err) {
    notify({ action: 'error', message: err.message });
  }
}
