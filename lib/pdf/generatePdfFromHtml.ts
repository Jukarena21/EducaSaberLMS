import type { PDFOptions } from 'puppeteer-core'
import { launchBrowser } from './launchBrowser'

export async function generatePdfFromHtml(
  html: string,
  pdfOptions: PDFOptions = {}
): Promise<Buffer> {
  const browser = await launchBrowser()

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load', timeout: 60000 })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.3in',
        right: '0.3in',
        bottom: '0.3in',
        left: '0.3in',
      },
      ...pdfOptions,
    })

    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}
