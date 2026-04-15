import cron from "node-cron";

import { runAllScrapers } from "../services/scrapers/index.js";

let cronStarted = false;

const SCRAPER_CRON_SCHEDULE = "0 */4 * * *";

const executeScraperRun = async (trigger: "startup" | "scheduled") => {
  console.log(`Cron: starting ${trigger} scraper run`);

  try {
    const result = await runAllScrapers();
    console.log(`Cron: ${trigger} scraper run completed`, result);
  } catch (error) {
    console.error(`Cron: ${trigger} scraper run failed`, error);
  }
};

export const startScraperCronJobs = (): void => {
  if (cronStarted) {
    return;
  }

  cron.schedule(SCRAPER_CRON_SCHEDULE, async () => {
    await executeScraperRun("scheduled");
  });

  cronStarted = true;
  console.log(`Cron jobs started with schedule ${SCRAPER_CRON_SCHEDULE}`);

  // Run once on server startup so you don't wait for the next cron window.
  void executeScraperRun("startup");
};
