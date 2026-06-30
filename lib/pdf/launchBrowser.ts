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
      args: [...chromium.args, ...LOCAL_LAUNCH_ARGS],
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
