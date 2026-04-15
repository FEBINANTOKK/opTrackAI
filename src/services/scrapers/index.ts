import { runInternshalaScraper } from "./internshala/internshalaScraper.js";
import {
  runNaukriScraper,
  type NaukriScraperSummary,
} from "./naukri/naukriScraper.js";
import {
  runUnstopScraper,
  type UnstopScraperSummary,
} from "./unstop/unstopScraper.js";
import {
  runLinkedInScraper,
  type LinkedInScraperSummary,
} from "./linkedin/linkedinScraper.js";
import type { ScraperRunResult } from "./shared/types.js";

export interface ScraperExecutionSummary {
  totalScraped: number;
  inserted: number;
  updated: number;
  error?: string;
}

export interface RunAllScrapersSummary {
  internshala: ScraperExecutionSummary;
  unstop: ScraperExecutionSummary;
  linkedin: ScraperExecutionSummary;
  executionTimeMs: number;
}

const toInternshalaSummary = (
  result: ScraperRunResult,
): ScraperExecutionSummary => {
  return {
    totalScraped: result.scrapedCount,
    inserted: result.upsertedCount,
    updated: result.modifiedCount,
  };
};

const toSourceSummary = (
  result: UnstopScraperSummary | LinkedInScraperSummary | NaukriScraperSummary,
): ScraperExecutionSummary => {
  return {
    totalScraped: result.totalScraped,
    inserted: result.inserted,
    updated: result.updated,
  };
};

const createErrorSummary = (error: unknown): ScraperExecutionSummary => {
  return {
    totalScraped: 0,
    inserted: 0,
    updated: 0,
    error: error instanceof Error ? error.message : "Unknown scraper failure",
  };
};

export const runAllScrapers = async (): Promise<RunAllScrapersSummary> => {
  const startedAt = Date.now();
  console.log("Starting all scrapers...");

  const [internshala, unstop, linkedin] = await Promise.all([
    (async (): Promise<ScraperExecutionSummary> => {
      try {
        const result = await runInternshalaScraper();
        console.log("Internshala completed");
        return toInternshalaSummary(result);
      } catch (error) {
        console.error(
          "Internshala scraper failed during orchestrator run:",
          error,
        );
        return createErrorSummary(error);
      }
    })(),
    (async (): Promise<ScraperExecutionSummary> => {
      try {
        const result = await runUnstopScraper();
        console.log("Unstop completed");
        return toSourceSummary(result);
      } catch (error) {
        console.error("Unstop scraper failed during orchestrator run:", error);
        return createErrorSummary(error);
      }
    })(),
    (async (): Promise<ScraperExecutionSummary> => {
      try {
        const result = await runLinkedInScraper();
        console.log("LinkedIn completed");
        return toSourceSummary(result);
      } catch (error) {
        console.error(
          "LinkedIn scraper failed during orchestrator run:",
          error,
        );
        return createErrorSummary(error);
      }
    })(),
  ]);

  const executionTimeMs = Date.now() - startedAt;
  console.log(`All scrapers finished in ${executionTimeMs}ms`);

  return {
    internshala,
    unstop,
    linkedin,
    executionTimeMs,
  };
};

export { runInternshalaScraper, runNaukriScraper, runUnstopScraper };
export { runLinkedInScraper };
export type { LinkedInScraperSummary };
