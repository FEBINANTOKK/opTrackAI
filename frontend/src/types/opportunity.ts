import { OpportunityType } from "./auth";

export interface IOpportunity {
  _id: string;
  title: string;
  company: string;
  skills: string[];
  location: string;
  type: OpportunityType;
  deadline: string;
  reward?: string;
  source: string;
  link: string;
  skillMatch?: number;
  matchPercentage?: number;
  matchReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecommendationResponse {
  success: boolean;
  count: number;
  total?: number;
  hasMore?: boolean;
  opportunities: IOpportunity[];
}
