# PageScribe — Open Source PDF to Word Converter

> ⚠️ Beta — bugs may exist. Contributions welcome.

PageScribe is an open source Chrome extension that takes screenshots of PDF pages open in your browser, runs OCR on them, and exports the extracted text as a Word document. No server, no setup — everything runs locally.

## Features

- Capture any page range from a browser-rendered PDF
- On-device OCR powered by Tesseract.js
- Exports to `.docx`
- Supports 7 languages
- Stop anytime mid-process
- Works offline (Turkish bundled, other languages cached after first download)

## Installation

1. Download or clone this repo
2. Open `chrome://extensions` in Chrome or Brave
3. Enable **Developer mode**
4. Click **Load unpacked** → select the `pdf-extension/` folder

## Usage

1. Open a PDF in your browser
2. Click the PageScribe icon
3. Set the page range and language
4. Click **Start**

The output file is saved to your Downloads folder as `output_YYYY-MM-DD-HH-MM-SS.docx`.

On first use, the OCR engine loads (~5–8 MB per language). This is cached — subsequent uses are instant.

## Supported Languages

| Language | First use |
|----------|-----------|
| Turkish  | Instant (bundled) |
| English  | ~5 MB download |
| German   | ~5 MB download |
| French   | ~5 MB download |
| Spanish  | ~5 MB download |
| Arabic   | ~8 MB download |
| Russian  | ~5 MB download |

## Tech Stack

- [Tesseract.js](https://github.com/naptha/tesseract.js) — WebAssembly OCR
- [docx](https://github.com/dolanmiu/docx) — Word document generation
- Chrome Extension Manifest V3

## License

[MIT](LICENSE)
