import type { Opportunity } from "../shared/types.js";

export type UnstopCategory = "hackathon" | "internship" | "job";

export interface RawUnstopOpportunity {
  title: string;
  company: string;
  location: string;
  deadlineText: string;
  prize?: string;
  link: string;
  category: UnstopCategory;
}

export interface UnstopScraperSummary {
  totalScraped: number;
  inserted: number;
  updated: number;
}

const DEFAULT_DEADLINE_DAYS_FALLBACK = 7;

const clean = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
};

const parseDeadline = (deadlineText: string): Date => {
  const now = new Date();

  const daysMatch = deadlineText.match(/(\d+)\s+days?\s+left/i);
  if (daysMatch) {
    const daysLeft = parseInt(daysMatch[1], 10);
    const deadline = new Date(now);
    deadline.setDate(now.getDate() + daysLeft);
    return deadline;
  }

  const hoursMatch = deadlineText.match(/(\d+)\s+hours?\s+left/i);
  if (hoursMatch) {
    const hoursLeft = parseInt(hoursMatch[1], 10);
    const deadline = new Date(now);
    deadline.setHours(now.getHours() + hoursLeft);
    return deadline;
  }

  const fallback = new Date(now);
  fallback.setDate(now.getDate() + DEFAULT_DEADLINE_DAYS_FALLBACK);
  return fallback;
};

const TYPE_MAP: Record<UnstopCategory, string> = {
  hackathon: "hackathon",
  internship: "internship",
  job: "job",
};

export const normalizeUnstopOpportunity = (
  raw: RawUnstopOpportunity,
): Opportunity => {
  const now = new Date();

  const title = clean(raw.title) || "Untitled Opportunity";
  const company = clean(raw.company) || "Unknown Organization";
  const location = clean(raw.location) || "Online";
  const link = clean(raw.link) || "https://unstop.com";
  const prize = clean(raw.prize);
  const deadline = parseDeadline(clean(raw.deadlineText));

  return {
    title,
    company,
    skills: [],
    location,
    type: TYPE_MAP[raw.category],
    deadline,
    reward: prize || "",
    source: "Unstop",
    link,
    createdAt: now,
  };
};

export const normalizeUnstopOpportunities = (
  items: RawUnstopOpportunity[],
): Opportunity[] => {
  return items.map(normalizeUnstopOpportunity);
};
