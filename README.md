# PageScribe - OPEN SOURCE

> ⚠️ **This project is currently in beta.** Expect bugs and rough edges — contributions and feedback are welcome.

PageScribe is open source and free to use, modify, and distribute under the [MIT License](LICENSE).

A Chrome/Brave extension that captures PDF pages displayed in the browser and converts them to a Word document using OCR. No server required — everything runs locally in the browser.

## How It Works

1. Open a PDF in your browser
2. Click the PageScribe extension icon
3. Set the page range (From / To) and OCR language
4. Hit **Start** — the extension screenshots each page, runs Tesseract.js OCR, and saves the text to a `.docx` file

## Requirements

- Chrome or Brave (Chromium-based browser)
- No Python, no server, no extra installs

## Setup

1. Clone or download this repo
2. Open `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** → select the `pdf-extension/` folder

## Usage

1. Open a PDF in the browser
2. Click the **PageScribe** icon
3. Set **From** / **To** page numbers
4. Select OCR language
5. Click **Start**

On first use (or when switching languages), the OCR engine will initialize and download the language data (~5–8 MB). This is cached after the first download.

Output files are saved to your Downloads folder as `output_YYYY-MM-DD-HH-MM-SS.docx`.

## Supported Languages

| Language | Code | Data source |
|----------|------|-------------|
| Turkish  | tur  | Bundled locally |
| English  | eng  | Downloaded on first use |
| German   | deu  | Downloaded on first use |
| French   | fra  | Downloaded on first use |
| Spanish  | spa  | Downloaded on first use |
| Arabic   | ara  | Downloaded on first use |
| Russian  | rus  | Downloaded on first use |

## Project Structure

```
pdf-extension/
├── manifest.json
├── popup.html
├── popup.js
├── background.js
├── offscreen.html     # Tesseract.js + docx.js run here
├── offscreen.js
└── lib/
    ├── tesseract.min.js
    ├── worker.min.js
    ├── tesseract-core.wasm.js
    ├── tur.traineddata.gz   # Bundled Turkish language data
    └── docx.umd.js
```

## Tech Stack

- [Tesseract.js](https://github.com/naptha/tesseract.js) — in-browser OCR
- [docx](https://github.com/dolanmiu/docx) — Word document generation
- Chrome Extension Manifest V3 + Offscreen Documents API
