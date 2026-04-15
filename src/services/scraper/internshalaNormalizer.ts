import type { Opportunity, RawInternshalaOpportunity } from "./types.js";

const DEFAULT_DEADLINE_DAYS = 30;

const clean = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
};

export const normalizeInternshalaOpportunity = (
  raw: RawInternshalaOpportunity,
): Opportunity => {
  const now = new Date();
  const fallbackDeadline = new Date(now);
  fallbackDeadline.setDate(now.getDate() + DEFAULT_DEADLINE_DAYS);

  const title = clean(raw.title) || "Untitled Internship";
  const company = clean(raw.company) || "Unknown Company";
  const location = clean(raw.location) || "Not specified";
  const link = clean(raw.link) || "https://internshala.com/internships";

  return {
    title,
    company,
    skills: [],
    location,
    type: "Internship",
    deadline: fallbackDeadline,
    source: "Internshala",
    link,
    createdAt: now,
  };
};

export const normalizeInternshalaOpportunities = (
  items: RawInternshalaOpportunity[],
): Opportunity[] => {
  return items.map(normalizeInternshalaOpportunity);
};
