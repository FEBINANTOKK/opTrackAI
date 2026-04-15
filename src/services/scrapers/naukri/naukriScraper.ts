import pRetry from "p-retry";
import type { Page } from "playwright";

import { createStealthBrowser, randomDelay } from "../../core/browser.js";
import { upsertOpportunities } from "../shared/opportunityRepository.js";
import { normalizeNaukriOpportunities } from "./naukriNormalizer.js";
import type { RawNaukriOpportunity } from "./naukriNormalizer.js";

const NAUKRI_HOME_URL = "https://www.naukri.com";
const NAUKRI_BASE_URL = "https://www.naukri.com/software-developer-jobs";
const MAX_PAGES = 3;
const JOB_CARD_SELECTOR =
  ".jobTuple, .srp-jobtuple-wrapper, article.jobTuple, .cust-job-tuple";
const NAVIGATION_TIMEOUT_MS = 30000;

export interface NaukriScraperSummary {
  totalScraped: number;
  inserted: number;
  updated: number;
}

const clean = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
};

const getPageUrl = (pageNumber: number): string => {
  if (pageNumber === 1) {
    return NAUKRI_BASE_URL;
  }

  return `${NAUKRI_BASE_URL}-${pageNumber}`;
};

const toAbsoluteUrl = (url: string): string => {
  try {
    return new URL(url, "https://www.naukri.com").toString();
  } catch {
    return NAUKRI_BASE_URL;
  }
};

const isBlockedPage = async (page: any): Promise<boolean> => {
  const cardCount = await page.locator(JOB_CARD_SELECTOR).count();
  if (cardCount > 0) {
    return false;
  }

  const title = clean(await page.title());
  const bodyText = clean(await page.locator("body").innerText());
  const pageFingerprint = `${title} ${bodyText}`.toLowerCase();

  return ["access denied", "forbidden", "captcha", "verify you are human"].some(
    (marker) => pageFingerprint.includes(marker),
  );
};

const gotoWithRetry = async (page: Page, url: string): Promise<void> => {
  await pRetry(
    async () => {
      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: NAVIGATION_TIMEOUT_MS,
      });
    },
    {
      retries: 2,
      minTimeout: 2500,
    },
  );
};

const warmupNaukriSession = async (page: Page): Promise<void> => {
  await gotoWithRetry(page, NAUKRI_HOME_URL);
  await randomDelay(page, 1200, 2200);
};

const extractPageItems = async (page: any): Promise<RawNaukriOpportunity[]> => {
  const rawItems = await page
    .locator(JOB_CARD_SELECTOR)
    .evaluateAll((cards: any[]) => {
      const readText = (root: any, selectors: string[]): string => {
        for (const selector of selectors) {
          const node = root.querySelector(selector);
          const text = node?.textContent?.replace(/\s+/g, " ").trim() ?? "";
          if (text) {
            return text;
          }
        }

        return "";
      };

      return cards.map((card: any) => {
        const linkElement = card.querySelector(
          "a.title, a[href*='job-listings'], a[href*='naukri.com/job-listings']",
        );

        const title =
          readText(card, ["a.title", ".title", "h2 a"]) ||
          linkElement?.textContent?.replace(/\s+/g, " ").trim() ||
          "";

        const company = readText(card, [
          "a.comp-name",
          ".comp-name",
          ".companyInfo a",
        ]);

        const location = readText(card, [
          ".locWdth",
          ".location span",
          ".row-3 .loc span",
        ]);

        const experience = readText(card, [
          ".expwdth",
          ".experience span",
          ".row-3 .exp span",
        ]);

        const salary = readText(card, [
          ".sal-wrap",
          ".salary span",
          ".row-3 .sal span",
        ]);

        const link = linkElement?.getAttribute("href")?.trim() ?? "";

        return {
          title,
          company,
          location,
          experience,
          salary,
          link,
        };
      });
    });

  return rawItems
    .map((item: RawNaukriOpportunity) => ({
      title: clean(item.title),
      company: clean(item.company),
      location: clean(item.location),
      experience: clean(item.experience),
      salary: clean(item.salary),
      link: toAbsoluteUrl(clean(item.link)),
    }))
    .filter(
      (item: RawNaukriOpportunity) =>
        Boolean(item.title) && Boolean(item.company) && Boolean(item.link),
    );
};

export const scrapeNaukri = async (): Promise<RawNaukriOpportunity[]> => {
  const { browser, context } = await createStealthBrowser();
  const aggregatedItems: RawNaukriOpportunity[] = [];
  const seenKeys = new Set<string>();

  try {
    const page = await context.newPage();
    await warmupNaukriSession(page);

    for (let pageNumber = 1; pageNumber <= MAX_PAGES; pageNumber += 1) {
      const pageUrl = getPageUrl(pageNumber);
      console.log(`Naukri scraper: scraping page ${pageNumber} (${pageUrl})`);

      try {
        await gotoWithRetry(page, pageUrl);
        await randomDelay(page, 1200, 2200);

        if (await isBlockedPage(page)) {
          console.warn(
            `Naukri scraper: blocked by target site on page ${pageNumber}. Stopping further pagination.`,
          );
          break;
        }

        await page
          .waitForLoadState("networkidle", { timeout: 10000 })
          .catch(() => {
            // Continue even if networkidle is not reached.
          });

        try {
          await page.waitForSelector(JOB_CARD_SELECTOR, {
            timeout: 15000,
          });
        } catch {
          const cardCount = await page.locator(JOB_CARD_SELECTOR).count();
          if (cardCount === 0) {
            throw new Error("No job cards found on page");
          }
        }

        const pageItems = await extractPageItems(page);
        console.log(
          `Naukri scraper: page ${pageNumber} items scraped = ${pageItems.length}`,
        );

        if (pageItems.length === 0) {
          break;
        }

        for (const item of pageItems) {
          const key = `${item.title.toLowerCase()}|${item.company.toLowerCase()}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            aggregatedItems.push(item);
          }
        }
      } catch (pageError) {
        console.error(
          `Naukri scraper: failed on page ${pageNumber}, continuing...`,
          pageError,
        );
      }

      if (pageNumber < MAX_PAGES) {
        await randomDelay(page, 1000, 2000);
      }
    }

    return aggregatedItems;
  } catch (error) {
    console.error("Naukri scraper failed:", error);
    return [];
  } finally {
    await browser.close();
  }
};

export const runNaukriScraper = async (): Promise<NaukriScraperSummary> => {
  try {
    const rawItems = await scrapeNaukri();
    const normalizedItems = normalizeNaukriOpportunities(rawItems);
    const dbResult = await upsertOpportunities(normalizedItems);

    const summary: NaukriScraperSummary = {
      totalScraped: rawItems.length,
      inserted: dbResult.upsertedCount,
      updated: dbResult.modifiedCount,
    };

    console.log("Naukri scraper: total items scraped =", summary.totalScraped);

    return summary;
  } catch (error) {
    console.error("runNaukriScraper failed:", error);
    return {
      totalScraped: 0,
      inserted: 0,
      updated: 0,
    };
  }
};
