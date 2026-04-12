#!/usr/bin/env python3
"""
Screenshot pages from a browser-rendered PDF URL.
Usage: python screenshot_pdf.py <pdf_url> <stop_page>
"""
import asyncio
import sys
from pathlib import Path
from playwright.async_api import async_playwright


async def screenshot_pdf(pdf_url: str, stop_page: int):
    output_dir = Path("screenshots")
    output_dir.mkdir(exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 900})
        page = await context.new_page()

        print(f"Opening: {pdf_url}")
        print(f"Capturing pages 1 to {stop_page}...\n")

        for page_num in range(1, stop_page + 1):
            url = f"{pdf_url}#page={page_num}"
            await page.goto(url)
            await page.wait_for_timeout(2000)  # wait for PDF viewer to render

            screenshot_path = output_dir / f"page_{page_num:03d}.png"
            await page.screenshot(path=str(screenshot_path))
            print(f"  Page {page_num} -> {screenshot_path}")

        await browser.close()

    print(f"\nDone! {stop_page} screenshots saved in ./{output_dir}/")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python screenshot_pdf.py <pdf_url> <stop_page>")
        print("Example: python screenshot_pdf.py https://example.com/doc.pdf 5")
        sys.exit(1)

    pdf_url = sys.argv[1]
    stop_page = int(sys.argv[2])

    asyncio.run(screenshot_pdf(pdf_url, stop_page))

