let tesseractWorker = null;
let currentLang = null;

async function getWorker(lang) {
  if (tesseractWorker && lang === currentLang) return tesseractWorker;

  // Dil değiştiyse eski worker'ı kapat
  if (tesseractWorker) {
    await tesseractWorker.terminate().catch(() => {});
    tesseractWorker = null;
  }

  currentLang = lang;

  // Türkçe → local dosya, diğerleri → CDN
  const langPath = lang === 'tur'
    ? chrome.runtime.getURL('lib/')
    : 'https://tessdata.projectnaptha.com/4.0.0';

  tesseractWorker = await Tesseract.createWorker(lang, 1, {
    workerPath: chrome.runtime.getURL('lib/worker.min.js'),
    corePath: chrome.runtime.getURL('lib/tesseract-core.wasm.js'),
    langPath,
    workerBlobURL: false,
    logger: m => {
      chrome.runtime.sendMessage({
        action: 'initProgress',
        progress: Math.round((m.progress || 0) * 100),
        status: m.status || ''
      }).catch(() => {});
    }
  });

  return tesseractWorker;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.target !== 'offscreen') return;

  if (msg.action === 'init') {
    getWorker(msg.lang || 'tur')
      .then(() => sendResponse({ ok: true }))
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }

  if (msg.action === 'ocr') {
    getWorker(msg.lang || currentLang || 'tur')
      .then(w => w.recognize(msg.imageDataUrl))
      .then(result => sendResponse({ text: result.data.text }))
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }

  if (msg.action === 'generate') {
    generateDocx(msg.pages, msg.filename)
      .then(b64 => sendResponse({ ok: true, data: b64 }))
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }
});

async function generateDocx(pages, filename) {
  const { Document, Packer, Paragraph, HeadingLevel } = docx;

  const children = pages.flatMap(({ page, text }) => [
    new Paragraph({ text: `Page ${page}`, heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ text: text || '' }),
  ]);

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}
