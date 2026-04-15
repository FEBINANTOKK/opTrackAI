import pRetry from "p-retry";
import type { Page } from "playwright";

import { createStealthBrowser, randomDelay } from "../../core/browser.js";

import { upsertOpportunities } from "../shared/opportunityRepository.js";
import {
  normalizeLinkedInOpportunities,
  type RawLinkedInOpportunity,
} from "./linkedinNormalizer.js";

const LINKEDIN_SEARCH_BASE_URL = "https://www.linkedin.com/jobs/search/";
const JOB_CARD_SELECTOR = ".job-search-card";
const LOAD_MORE_SELECTOR = "button[aria-label='Load more results']";
const DEFAULT_KEYWORD = "intern";
const DEFAULT_LOCATION = "India";
const DEFAULT_TIME_FILTER = "r86400";
const MIN_SCROLL_PASSES = 5;
const MAX_SCROLL_PASSES = 7;
const MAX_RESULTS = 100;
const NAVIGATION_TIMEOUT_MS = 30000;
const CARD_WAIT_TIMEOUT_MS = 15000;
const SELECTOR_RETRIES = 2;

export interface LinkedInScraperSummary {
  totalScraped: number;
  inserted: number;
  updated: number;
}

export interface LinkedInScrapeOptions {
  keyword?: string;
  location?: string;
  postedWithin?: string;
}

const clean = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
};

const buildSearchUrl = (options: LinkedInScrapeOptions): string => {
  const params = new URLSearchParams({
    keywords: options.keyword ?? DEFAULT_KEYWORD,
    location: options.location ?? DEFAULT_LOCATION,
    f_TPR: options.postedWithin ?? DEFAULT_TIME_FILTER,
  });

  return `${LINKEDIN_SEARCH_BASE_URL}?${params.toString()}`;
};

const isValidLinkedInLink = (value: string): boolean => {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value, "https://www.linkedin.com");
    return (
      (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      parsed.hostname.includes("linkedin.com")
    );
  } catch {
    return false;
  }
};

const toAbsoluteLinkedInUrl = (value: string): string => {
  try {
    return new URL(value, "https://www.linkedin.com").toString();
  } catch {
    return "https://www.linkedin.com/jobs/search/";
  }
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
      retries: 3,
      minTimeout: 3000,
    },
  );
};

const waitForCardsWithRetry = async (page: Page): Promise<boolean> => {
  for (let attempt = 1; attempt <= SELECTOR_RETRIES; attempt += 1) {
    try {
      await page.waitForSelector(JOB_CARD_SELECTOR, {
        timeout: CARD_WAIT_TIMEOUT_MS,
      });
      return true;
    } catch {
      if (attempt < SELECTOR_RETRIES) {
        await randomDelay(page, 1000, 2000);
      }
    }
  }

  return false;
};

const extractVisibleCards = async (
  page: Page,
): Promise<RawLinkedInOpportunity[]> => {
  const rawItems = await page
    .locator(JOB_CARD_SELECTOR)
    .evaluateAll((cards) => {
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

      return cards.map((card) => {
        const linkElement = card.querySelector(
          "a.base-card__full-link, a[href*='/jobs/view/']",
        );

        const title = readText(card, [
          "h3.base-search-card__title",
          "h3.base-card__title",
          "h3",
        ]);

        const company = readText(card, [
          "h4.base-search-card__subtitle",
          "a.hidden-nested-link",
          ".base-search-card__subtitle",
        ]);

        const location = readText(card, [
          ".job-search-card__location",
          ".base-search-card__metadata",
          ".base-search-card__metadata time + span",
        ]);

        const link = linkElement?.getAttribute("href")?.trim() ?? "";
        const postedAt =
          card.querySelector("time")?.getAttribute("datetime")?.trim() ?? "";

        return {
          title,
          company,
          location,
          link,
          postedAt,
        };
      });
    });

  return rawItems
    .map((item: RawLinkedInOpportunity) => ({
      title: clean(item.title),
      company: clean(item.company),
      location: clean(item.location),
      link: toAbsoluteLinkedInUrl(clean(item.link)),
      postedAt: clean(item.postedAt),
    }))
    .filter(
      (item: RawLinkedInOpportunity) =>
        Boolean(item.title) &&
        Boolean(item.company) &&
        isValidLinkedInLink(item.link),
    );
};

const scrollForMorePublicCards = async (page: any): Promise<void> => {
  const totalScrollPasses =
    Math.floor(Math.random() * (MAX_SCROLL_PASSES - MIN_SCROLL_PASSES + 1)) +
    MIN_SCROLL_PASSES;

  for (let pass = 1; pass <= totalScrollPasses; pass += 1) {
    console.log("LinkedIn: scrolling...");

    await page.evaluate(() => {
      const browserGlobal = globalThis as any;
      browserGlobal.scrollBy(0, 800);
    });

    await randomDelay(page, 1000, 2000);
  }
};

const clickLoadMoreIfPresent = async (page: Page): Promise<void> => {
  try {
    const loadMoreButton = page.locator(LOAD_MORE_SELECTOR).first();
    if ((await loadMoreButton.count()) > 0) {
      await loadMoreButton.click({ timeout: 3000 });
      await randomDelay(page, 1000, 2000);
    }
  } catch {
    // Optional element, continue safely.
  }
};

const dedupeAndCapResults = (
  items: RawLinkedInOpportunity[],
): RawLinkedInOpportunity[] => {
  const uniqueItems: RawLinkedInOpportunity[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const key = `${item.title.toLowerCase()}|${item.company.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(item);
    }

    if (uniqueItems.length >= MAX_RESULTS) {
      break;
    }
  }

  return uniqueItems;
};

export const scrapeLinkedInPublicJobs = async (): Promise<
  RawLinkedInOpportunity[]
> => {
  return scrapeLinkedInPublicJobsWithOptions();
};

export const scrapeLinkedInPublicJobsWithOptions = async (
  options: LinkedInScrapeOptions = {},
): Promise<RawLinkedInOpportunity[]> => {
  const { browser, context } = await createStealthBrowser();
  const page = await context.newPage();
  const targetUrl = buildSearchUrl(options);

  try {
    await gotoWithRetry(page, targetUrl);
    console.log("LinkedIn: page loaded");

    const cardsAvailable = await waitForCardsWithRetry(page);
    if (!cardsAvailable) {
      console.warn("LinkedIn: no job cards found after retries");
      return [];
    }

    await scrollForMorePublicCards(page);
    await clickLoadMoreIfPresent(page);
    const extractedItems = await extractVisibleCards(page);

    if (extractedItems.length === 0) {
      console.warn("LinkedIn: no jobs extracted, stopping early");
      return [];
    }

    const uniqueItems = dedupeAndCapResults(extractedItems);
    console.log(`LinkedIn: extracted ${uniqueItems.length} jobs`);

    return uniqueItems;
  } catch (error) {
    console.error("LinkedIn scraper failed:", error);
    await page
      .screenshot({
        path: "debug/linkedin-error.png",
        fullPage: true,
      })
      .catch(() => {
        // Ignore screenshot failures.
      });
    return [];
  } finally {
    await browser.close();
  }
};

export const runLinkedInScraper = async (
  options: LinkedInScrapeOptions = {},
): Promise<LinkedInScraperSummary> => {
  try {
    const rawItems = await scrapeLinkedInPublicJobsWithOptions(options);

    if (rawItems.length === 0) {
      return {
        totalScraped: 0,
        inserted: 0,
        updated: 0,
      };
    }

    const normalizedItems = normalizeLinkedInOpportunities(rawItems);
    const dbResult = await upsertOpportunities(normalizedItems);

    return {
      totalScraped: rawItems.length,
      inserted: dbResult.upsertedCount,
      updated: dbResult.modifiedCount,
    };
  } catch (error) {
    console.error("runLinkedInScraper failed:", error);
    return {
      totalScraped: 0,
      inserted: 0,
      updated: 0,
    };
  }
};
