export interface Opportunity {
  title: string;
  company: string;
  skills: string[];
  location: string;
  type: string;
  deadline: Date;
  reward?: string;
  source: string;
  link: string;
  createdAt: Date;
}

export interface RawInternshalaOpportunity {
  title: string;
  company: string;
  location: string;
  link: string;
}

export interface ScraperRunResult {
  scrapedCount: number;
  normalizedCount: number;
  upsertedCount: number;
  modifiedCount: number;
}
