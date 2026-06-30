import type { Browser, LaunchOptions } from 'puppeteer-core'

const IS_SERVERLESS = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION
)

const LOCAL_LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
]

const DEFAULT_VIEWPORT = {
  width: 1920,
  height: 1080,
  deviceScaleFactor: 1,
}

export async function launchBrowser(
  extraOptions: LaunchOptions = {}
): Promise<Browser> {
  if (IS_SERVERLESS) {
    const chromium = (await import('@sparticuz/chromium')).default
    const puppeteer = await import('puppeteer-core')

    return puppeteer.default.launch({
      args: puppeteer.default.defaultArgs({
        args: [...chromium.args, ...LOCAL_LAUNCH_ARGS],
        headless: 'shell',
      }),
      defaultViewport: DEFAULT_VIEWPORT,
      executablePath: await chromium.executablePath(),
      headless: 'shell',
      ...extraOptions,
    })
  }

  const puppeteer = await import('puppeteer')
  return puppeteer.default.launch({
    headless: true,
    args: LOCAL_LAUNCH_ARGS,
    ...extraOptions,
  })
}

export async function generatePdfFromHtml(
  html: string,
  pdfOptions: Parameters<Browser['newPage'] extends (...args: infer _) => infer R ? R : never> extends never
    ? Record<string, unknown>
    : Record<string, unknown> = {}
): Promise<Buffer> {
  const browser = await launchBrowser()

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 })

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
