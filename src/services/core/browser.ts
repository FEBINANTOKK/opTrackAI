import { chromium, type Browser, type BrowserContext } from "playwright";

const MIN_DELAY_MS = 1000;
const MAX_DELAY_MS = 2000;

export interface StealthBrowserSession {
  browser: Browser;
  context: BrowserContext;
}

export const randomDelay = async (
  pageOrContext: { waitForTimeout: (ms: number) => Promise<void> },
  minMs = MIN_DELAY_MS,
  maxMs = MAX_DELAY_MS,
): Promise<void> => {
  const safeMin = Math.max(0, Math.min(minMs, maxMs));
  const safeMax = Math.max(safeMin, maxMs);
  const delayMs = Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
  await pageOrContext.waitForTimeout(delayMs);
};

export const createStealthBrowser =
  async (): Promise<StealthBrowserSession> => {
    const browser = await chromium.launch({
      headless: true,
      args: ["--disable-blink-features=AutomationControlled"],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      viewport: { width: 1366, height: 768 },
      locale: "en-US",
      timezoneId: "Asia/Kolkata",
      ignoreHTTPSErrors: true,
      extraHTTPHeaders: {
        "accept-language": "en-US,en;q=0.9",
        "upgrade-insecure-requests": "1",
      },
    });

    await context.addInitScript(() => {
      Object.defineProperty((globalThis as any).navigator, "webdriver", {
        get: () => undefined,
      });

      Object.defineProperty((globalThis as any).navigator, "languages", {
        get: () => ["en-US", "en"],
      });

      Object.defineProperty((globalThis as any).navigator, "platform", {
        get: () => "Win32",
      });
    });

    return { browser, context };
  };
