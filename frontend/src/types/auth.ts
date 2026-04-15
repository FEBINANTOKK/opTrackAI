export type WorkMode = "Remote" | "Onsite" | "Hybrid";

export type OpportunityType = "hackathon" | "internship" | "job";

export type RewardType =
  | "certificate"
  | "cash_prize"
  | "internship_offer"
  | "job_offer"
  | "swags"
  | "experience";

export type TimeCommitment =
  | "1_day"
  | "1_week"
  | "2_weeks"
  | "1_month"
  | "long_term";

export type Target = "student" | "job seeker";

export type User = {
  id: string;
  username: string;
  email?: string;
};

export type Preferences = {
  timeCommitment: TimeCommitment[];
  location: string;
  workMode: WorkMode[];
  skills: string[];
  college?: string;
  year?: string;
  reward: RewardType[];
  opportunityType: OpportunityType[];
  target: Target;
};

export type LoginInput = {
  username: string;
  password: string;
};

export type SignupInput = {
  username: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};
