import type { Opportunity } from "../shared/types.js";

export interface RawNaukriOpportunity {
  title: string;
  company: string;
  location: string;
  experience?: string;
  salary?: string;
  link: string;
}

const DEFAULT_DEADLINE_DAYS = 30;

const clean = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
};

export const normalizeNaukriOpportunity = (
  raw: RawNaukriOpportunity,
): Opportunity => {
  const now = new Date();
  const fallbackDeadline = new Date(now);
  fallbackDeadline.setDate(now.getDate() + DEFAULT_DEADLINE_DAYS);

  const title = clean(raw.title) || "Untitled Job";
  const company = clean(raw.company) || "Unknown Company";
  const location = clean(raw.location) || "Not specified";
  const link =
    clean(raw.link) || "https://www.naukri.com/software-developer-jobs";
  const reward = clean(raw.salary);

  return {
    title,
    company,
    skills: [],
    location,
    type: "job",
    deadline: fallbackDeadline,
    reward: reward || "",
    source: "Naukri",
    link,
    createdAt: now,
  };
};

export const normalizeNaukriOpportunities = (
  items: RawNaukriOpportunity[],
): Opportunity[] => {
  return items.map(normalizeNaukriOpportunity);
};
