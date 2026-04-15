import type { Opportunity } from "../shared/types.js";

export interface RawLinkedInOpportunity {
  title: string;
  company: string;
  location: string;
  link: string;
  postedAt?: string;
}

const DEFAULT_DEADLINE_DAYS = 30;

const clean = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
};

const toLinkedInJobUrl = (url: string): string => {
  const cleanedUrl = clean(url);

  if (!cleanedUrl) {
    return "https://www.linkedin.com/jobs/search/?keywords=software%20developer";
  }

  try {
    const absolute = new URL(cleanedUrl, "https://www.linkedin.com");
    if (absolute.protocol !== "https:" && absolute.protocol !== "http:") {
      return "https://www.linkedin.com/jobs/search/?keywords=software%20developer";
    }

    if (!absolute.hostname.includes("linkedin.com")) {
      return "https://www.linkedin.com/jobs/search/?keywords=software%20developer";
    }

    return absolute.toString();
  } catch {
    return "https://www.linkedin.com/jobs/search/?keywords=software%20developer";
  }
};

export const normalizeLinkedInOpportunity = (
  raw: RawLinkedInOpportunity,
): Opportunity => {
  const now = new Date();
  const fallbackDeadline = new Date(now);
  fallbackDeadline.setDate(now.getDate() + DEFAULT_DEADLINE_DAYS);
  const postedAt = clean(raw.postedAt);
  const postedDate = postedAt ? new Date(postedAt) : null;
  const parsedDeadline =
    postedDate && !Number.isNaN(postedDate.getTime())
      ? postedDate
      : fallbackDeadline;

  return {
    title: clean(raw.title) || "Untitled Job",
    company: clean(raw.company) || "Unknown Company",
    skills: [],
    location: clean(raw.location) || "Not specified",
    type: "job",
    deadline: parsedDeadline,
    reward: "",
    source: "LinkedIn",
    link: toLinkedInJobUrl(raw.link),
    createdAt: now,
  };
};

export const normalizeLinkedInOpportunities = (
  items: RawLinkedInOpportunity[],
): Opportunity[] => {
  return items.map(normalizeLinkedInOpportunity);
};
