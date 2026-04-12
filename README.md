# PageScribe

A Chrome extension + local Python server that captures PDF pages displayed in the browser and converts them to a Word document using OCR (Tesseract).

## How It Works

1. Open a PDF in your browser
2. Click the PageScribe extension icon
3. Set the page range (From / To)
4. Hit **Start** — the extension screenshots each page, sends it to the local server, which runs OCR and saves the text to a `.docx` file

## Requirements

- macOS (tested on Apple Silicon)
- Python 3.9+
- Tesseract (`brew install tesseract tesseract-lang`)
- Chrome or Brave browser

## Setup

### 1. Install Python dependencies

```bash
pip3 install flask pytesseract python-docx pillow
```

### 2. Install Tesseract

```bash
brew install tesseract tesseract-lang
```

### 3. Load the extension

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `pdf-extension/` folder

### 4. Start the server

```bash
python3 server.py
```

Server runs on `http://localhost:8765`

## Usage

1. Start `server.py`
2. Open a PDF in the browser
3. Click the PageScribe icon
4. Set **From** and **To** page numbers
5. (Optional) Toggle **Append to existing file** and select a `.docx` to append to
6. Click **Start**

Output files are saved to the `hack/` folder as `output_YYYYMMDD_HHMMSS.docx`.

## Project Structure

```
hack/
├── server.py              # Flask OCR server
├── pdf-extension/
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   └── background.js
└── README.md
```

## Language

OCR defaults to Turkish (`tur`). To change, edit `server.py`:

```python
text = pytesseract.image_to_string(image, lang="eng")
```
