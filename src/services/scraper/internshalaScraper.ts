import { chromium } from "playwright";

import { normalizeInternshalaOpportunities } from "./internshalaNormalizer.js";
import { upsertOpportunities } from "./opportunityRepository.js";
import type { RawInternshalaOpportunity, ScraperRunResult } from "./types.js";

const INTERNSHALA_URL = "https://internshala.com/internships";
const MAX_PAGES = 5;
const MIN_DELAY_MS = 1000;
const MAX_DELAY_MS = 2000;

const clean = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
};

const toAbsoluteUrl = (url: string): string => {
  try {
    return new URL(url, INTERNSHALA_URL).toString();
  } catch {
    return INTERNSHALA_URL;
  }
};

const getPageUrl = (pageNumber: number): string => {
  return `${INTERNSHALA_URL}/page-${pageNumber}`;
};

const getRandomDelay = (): number => {
  return (
    Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS
  );
};

const extractPageItems = async (
  page: any,
): Promise<RawInternshalaOpportunity[]> => {
  const scrapedItems = await page
    .locator("div.individual_internship")
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
          "a.job-title-href, a[href*='/internship/detail/'], a[href*='/internships/']",
        );

        const title =
          readText(card, [
            "h3.job-internship-name",
            "h3.heading_4_5.profile",
            "a.job-title-href",
          ]) ||
          linkElement?.textContent?.replace(/\s+/g, " ").trim() ||
          "";

        const company = readText(card, [
          "p.company-name",
          "a.company-name",
          ".company_and_premium span.company-name",
        ]);

        const location = readText(card, [
          ".locations span a",
          ".location_link",
          "#location_names",
        ]);

        const link = linkElement?.getAttribute("href")?.trim() ?? "";

        return {
          title,
          company,
          location,
          link,
        };
      });
    });

  return scrapedItems
    .map((item: RawInternshalaOpportunity) => ({
      title: clean(item.title),
      company: clean(item.company),
      location: clean(item.location),
      link: clean(item.link),
    }))
    .filter((item: RawInternshalaOpportunity) => item.title && item.company)
    .map((item: RawInternshalaOpportunity) => ({
      ...item,
      link: toAbsoluteUrl(item.link),
    }));
};

export const scrapeInternshala = async (): Promise<
  RawInternshalaOpportunity[]
> => {
  const browser = await chromium.launch({ headless: true });
  const aggregatedResults: RawInternshalaOpportunity[] = [];
  const seenKeys = new Set<string>();

  try {
    const page = await browser.newPage();

    for (let pageNumber = 1; pageNumber <= MAX_PAGES; pageNumber += 1) {
      const pageUrl = getPageUrl(pageNumber);
      console.log(
        `Internshala scraper: scraping page ${pageNumber} (${pageUrl})`,
      );

      try {
        await page.goto(pageUrl, {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        });

        await page.waitForSelector(".individual_internship", {
          timeout: 30000,
        });

        const pageItems = await extractPageItems(page);
        console.log(
          `Internshala scraper: page ${pageNumber} items scraped = ${pageItems.length}`,
        );

        if (pageItems.length === 0) {
          console.log(
            `Internshala scraper: page ${pageNumber} returned zero results, stopping pagination early.`,
          );
          break;
        }

        for (const item of pageItems) {
          const dedupeKey = `${item.title.toLowerCase()}|${item.company.toLowerCase()}`;
          if (!seenKeys.has(dedupeKey)) {
            seenKeys.add(dedupeKey);
            aggregatedResults.push(item);
          }
        }

        if (pageNumber < MAX_PAGES) {
          await page.waitForTimeout(getRandomDelay());
        }
      } catch (pageError) {
        console.error(
          `Internshala scraper: failed on page ${pageNumber}, continuing...`,
          pageError,
        );
      }
    }

    console.log(
      `Internshala scraper: total aggregated items = ${aggregatedResults.length}`,
    );

    return aggregatedResults;
  } catch (error) {
    console.error("Failed to scrape Internshala:", error);
    return [];
  } finally {
    await browser.close();
  }
};

export const runInternshalaScraper = async (): Promise<ScraperRunResult> => {
  try {
    const rawItems = await scrapeInternshala();
    const normalizedItems = normalizeInternshalaOpportunities(rawItems);
    const dbResult = await upsertOpportunities(normalizedItems);

    return {
      scrapedCount: rawItems.length,
      normalizedCount: normalizedItems.length,
      upsertedCount: dbResult.upsertedCount,
      modifiedCount: dbResult.modifiedCount,
    };
  } catch (error) {
    console.error("Internshala scraper failed:", error);

    return {
      scrapedCount: 0,
      normalizedCount: 0,
      upsertedCount: 0,
      modifiedCount: 0,
    };
  }
};
