import { chromium } from "playwright";

import { upsertOpportunities } from "../shared/opportunityRepository.js";
import { normalizeUnstopOpportunities } from "./unstopNormalizer.js";
import type {
  RawUnstopOpportunity,
  UnstopCategory,
  UnstopScraperSummary,
} from "./unstopNormalizer.js";

export type { UnstopScraperSummary };

const UNSTOP_BASE = "https://unstop.com";
const MAX_PAGES = 3;
const MIN_DELAY_MS = 1000;
const MAX_DELAY_MS = 2000;

/**
 * Card selector confirmed from live DOM inspection.
 * Each opportunity is an anchor: a.item[class*="opp_"]
 */
const CARD_SELECTOR = "a.item[class*='opp_']";

const CATEGORY_URLS: Record<UnstopCategory, string> = {
  hackathon: `${UNSTOP_BASE}/hackathons`,
  internship: `${UNSTOP_BASE}/internships`,
  job: `${UNSTOP_BASE}/jobs`,
};

const clean = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
};

const getRandomDelay = (): number => {
  return (
    Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS
  );
};

const getPageUrl = (base: string, pageNumber: number): string => {
  if (pageNumber === 1) {
    return base;
  }

  return `${base}?page=${pageNumber}`;
};

const toAbsoluteUrl = (url: string): string => {
  if (!url) {
    return UNSTOP_BASE;
  }

  try {
    return new URL(url, UNSTOP_BASE).toString();
  } catch {
    return UNSTOP_BASE;
  }
};

const extractCardsFromPage = async (
  page: any,
  category: UnstopCategory,
): Promise<RawUnstopOpportunity[]> => {
  const rawItems = await page
    .locator(CARD_SELECTOR)
    .evaluateAll((cards: any[], cat: UnstopCategory) => {
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
        const title = readText(card, [
          "h3[itemprop='name']",
          "h3.double-wrap",
          "h2.double-wrap",
          ".cptn h3",
        ]);

        const company = readText(card, [
          "p.single-wrap",
          ".cptn p",
          ".org_name",
        ]);

        const location = readText(card, [
          "span.location_text",
          ".location_card span",
          ".location_text",
        ]);

        // Deadline: "14 days left" or "1 day left" labels
        const deadlineEl = [...card.querySelectorAll("label.tag-text")].find(
          (el: any) =>
            el.textContent && el.textContent.toLowerCase().includes("left"),
        );
        const deadlineText =
          deadlineEl?.textContent?.replace(/\s+/g, " ").trim() ?? "";

        // Prize/reward: look for "Prizes worth" or rupee/dollar text nearby
        const prizeEl = card.querySelector(
          "[class*='prize'], .prize_money, .reward",
        );
        const prize = prizeEl?.textContent?.replace(/\s+/g, " ").trim() ?? "";

        const link = card.getAttribute("href") ?? "";

        return {
          title,
          company,
          location,
          deadlineText,
          prize,
          link,
          category: cat,
        };
      });
    }, category);

  return rawItems
    .map(
      (item: RawUnstopOpportunity): RawUnstopOpportunity => ({
        title: clean(item.title),
        company: clean(item.company),
        location: clean(item.location),
        deadlineText: clean(item.deadlineText),
        prize: clean(item.prize),
        link: toAbsoluteUrl(clean(item.link)),
        category: item.category,
      }),
    )
    .filter(
      (item: RawUnstopOpportunity) =>
        Boolean(item.title) && Boolean(item.company) && Boolean(item.link),
    );
};

export const scrapeUnstopCategory = async (
  page: any,
  category: UnstopCategory,
): Promise<RawUnstopOpportunity[]> => {
  const baseUrl = CATEGORY_URLS[category];
  const aggregatedItems: RawUnstopOpportunity[] = [];
  const seenKeys = new Set<string>();

  for (let pageNumber = 1; pageNumber <= MAX_PAGES; pageNumber += 1) {
    const pageUrl = getPageUrl(baseUrl, pageNumber);
    console.log(
      `Unstop scraper [${category}]: scraping page ${pageNumber} (${pageUrl})`,
    );

    try {
      await page.goto(pageUrl, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });

      await page.waitForTimeout(2500);

      await page.waitForSelector(CARD_SELECTOR, {
        timeout: 20000,
      });

      const pageItems = await extractCardsFromPage(page, category);
      console.log(
        `Unstop scraper [${category}]: page ${pageNumber} items = ${pageItems.length}`,
      );

      if (pageItems.length === 0) {
        console.log(
          `Unstop scraper [${category}]: no items on page ${pageNumber}, stopping.`,
        );
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
        `Unstop scraper [${category}]: failed on page ${pageNumber}, continuing...`,
        pageError,
      );
    }

    if (pageNumber < MAX_PAGES) {
      await page.waitForTimeout(getRandomDelay());
    }
  }

  return aggregatedItems;
};

export const scrapeUnstop = async (): Promise<RawUnstopOpportunity[]> => {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      viewport: { width: 1366, height: 768 },
      locale: "en-US",
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();
    const allItems: RawUnstopOpportunity[] = [];
    const categories: UnstopCategory[] = ["hackathon", "internship", "job"];

    for (const category of categories) {
      const items = await scrapeUnstopCategory(page, category);
      console.log(
        `Unstop scraper [${category}]: total collected = ${items.length}`,
      );
      allItems.push(...items);
    }

    console.log(`Unstop scraper: grand total = ${allItems.length}`);
    return allItems;
  } catch (error) {
    console.error("Unstop scraper failed:", error);
    return [];
  } finally {
    await browser.close();
  }
};

export const runUnstopScraper = async (): Promise<UnstopScraperSummary> => {
  try {
    const rawItems = await scrapeUnstop();
    const normalizedItems = normalizeUnstopOpportunities(rawItems);
    const dbResult = await upsertOpportunities(normalizedItems);

    const summary: UnstopScraperSummary = {
      totalScraped: rawItems.length,
      inserted: dbResult.upsertedCount,
      updated: dbResult.modifiedCount,
    };

    console.log(
      `Unstop scraper: done — scraped=${summary.totalScraped} inserted=${summary.inserted} updated=${summary.updated}`,
    );

    return summary;
  } catch (error) {
    console.error("runUnstopScraper failed:", error);
    return { totalScraped: 0, inserted: 0, updated: 0 };
  }
};
