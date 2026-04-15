import { IOpportunity } from "../models/Opportunity.js";
import { IUser } from "../models/User.js";

export interface RecommendationResult {
  score: number;
  reasons: string[];
}

export interface RankedOpportunity extends IOpportunity {
  score: number;
  matchedSkills: string[];
  daysLeft: number;
  reasons: string[];
}

const getDaysLeft = (deadline: Date): number => {
  const now = new Date();
  const timeDiff = deadline.getTime() - now.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

export const calculateScore = (
  opportunity: IOpportunity,
  user: IUser,
): RecommendationResult => {
  let score = 0;
  const reasons: string[] = [];

  // Skill Match
  const matchedSkills = opportunity.skills.filter((skill) =>
    user.skills.includes(skill),
  );

  matchedSkills.forEach(() => {
    score += 4;
  });

  if (matchedSkills.length > 0) {
    reasons.push(
      `Matched ${matchedSkills.length} skill(s): ${matchedSkills.join(", ")}`,
    );
  }

  // Type Match
  if (user.preferredTypes.includes(opportunity.type)) {
    score += 3;
    reasons.push(`Matches your preferred type: ${opportunity.type}`);
  }

  // Location Match
  if (opportunity.location === "Remote") {
    score += 2;
    reasons.push("Remote opportunity - flexible location");
  } else if (opportunity.location === user.location) {
    score += 2;
    reasons.push(`Located in your area: ${user.location}`);
  }

  // Deadline Urgency
  const daysLeft = getDaysLeft(opportunity.deadline);
  if (daysLeft <= 2) {
    score += 3;
    reasons.push(`⏰ Closing soon - ${daysLeft} days left`);
  } else if (daysLeft <= 5) {
    score += 2;
    reasons.push(`📅 Closing in ${daysLeft} days`);
  } else if (daysLeft > 30) {
    score += 1;
    reasons.push(`${daysLeft} days until deadline`);
  }

  // Reward Boost
  if (opportunity.reward) {
    score += 1;
    reasons.push(`Has reward: ${opportunity.reward}`);
  }

  return {
    score: Math.min(score, 100),
    reasons: reasons.length > 0 ? reasons : ["Basic match"],
  };
};

export const rankOpportunities = (
  opportunities: IOpportunity[],
  user: IUser,
): RankedOpportunity[] => {
  return opportunities
    .map((opportunity) => {
      const { score, reasons } = calculateScore(opportunity, user);
      const matchedSkills = opportunity.skills.filter((skill) =>
        user.skills.includes(skill),
      );
      const daysLeft = getDaysLeft(opportunity.deadline);

      return {
        ...opportunity.toObject(),
        score,
        matchedSkills,
        daysLeft,
        reasons,
      } as RankedOpportunity;
    })
    .sort((a, b) => b.score - a.score);
};
