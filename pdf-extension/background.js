let stopRequested = false;

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'start') {
    stopRequested = false;
    run(msg.tabId, msg.url, msg.startPage, msg.stopPage, msg.append);
  } else if (msg.action === 'stop') {
    stopRequested = true;
  }
});

function notify(msg) {
  // Storage'a kaydet (popup kapalıysa bile state korunur)
  if (msg.action === 'progress') {
    chrome.storage.session.set({ state: { running: true, current: msg.current, total: msg.total } });
  } else if (msg.action === 'done' || msg.action === 'stopped' || msg.action === 'error') {
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

async function run(tabId, originalUrl, startPage, stopPage, append = false) {
  const baseUrl = originalUrl.split('#')[0];
  const total = stopPage - startPage + 1;

  let filename = 'output.docx';
  if (!append) {
    const res = await fetch('http://localhost:8765/reset', { method: 'POST' }).catch(() => null);
    if (res) {
      const data = await res.json().catch(() => ({}));
      if (data.filename) filename = data.filename;
    }
  }

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

      const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 85 });

      const res = await fetch('http://localhost:8765/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page, image: dataUrl })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error on page ${page}`);
      }
    }

    notify({ action: 'done', total, filename });

  } catch (err) {
    notify({ action: 'error', message: err.message });
  }
}
