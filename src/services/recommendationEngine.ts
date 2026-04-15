import { IOpportunity } from "../models/Opportunity.js";
import { IUser } from "../models/User.js";
import axios from "axios";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "phi3";

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

export const calculateScoreAI = async (
  opportunity: IOpportunity,
  user: IUser,
): Promise<RecommendationResult> => {
  try {
    const prompt = `You are an expert career and opportunity matching engine.
Analyze the following user profile and an opportunity.

USER PROFILE:
- Skills: ${user.skills?.join(", ") || "Not specified"}
- Target Audience/Experience: ${user.targetAudience?.join(", ") || "Any"}
- Location Preference: ${user.location || "Any"}
- Opportunity Types: ${user.preferredTypes?.join(", ") || "Any"}

OPPORTUNITY:
- Title: ${opportunity.title}
- Company: ${opportunity.company}
- Skills Required: ${(opportunity.skills || []).join(", ") || "None specified"}
- Type: ${opportunity.type}
- Location: ${opportunity.location}

TASK:
Calculate a precise "score" (0-100) evaluating how well this opportunity fits the user's profile, and provide a single concise "reason" (max 15 words).
Respond ONLY with valid JSON. No markdown, no explanation.
Example: {"score": 85, "reason": "Strong skill overlap and matches preferred location."}`;

    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
    }, {
      timeout: 120000,
    });

    const rawText = response.data.response || "";
    let jsonText = rawText.trim();

    const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    } else {
      const braceMatch = jsonText.match(/\{[\s\S]*\}/);
      if (braceMatch) jsonText = braceMatch[0];
    }

    const aiAssessment = JSON.parse(jsonText);

    return {
      score: Math.min(100, Math.max(0, aiAssessment?.score ?? 0)),
      reasons: [aiAssessment?.reason ?? "Profile analysis complete."],
    };
  } catch (error) {
    console.error("[AI Engine] Scoring Error:", error);
    // Fallback to basic match
    const matchedSkills = opportunity.skills.filter((skill) =>
      user.skills?.includes(skill),
    );
    return {
      score: matchedSkills.length > 0 ? 50 : 20,
      reasons: matchedSkills.length > 0 ? ["Partial skill match"] : ["Basic profile match"],
    };
  }
};

export const rankOpportunitiesAI = async (
  opportunities: IOpportunity[],
  user: IUser,
): Promise<RankedOpportunity[]> => {
  if (opportunities.length === 0) return [];

  // We process them in parallel for speed, though for many items you'd want to batch them
  // or use the bulk query approach from recommendationService.ts
  const rankPromises = opportunities.map(async (opportunity) => {
    const { score, reasons } = await calculateScoreAI(opportunity, user);

    const matchedSkills = (opportunity.skills || []).filter((skill) =>
      user.skills?.includes(skill),
    );
    const daysLeft = getDaysLeft(opportunity.deadline);

    // Make sure we carry forward any existing Mongoose object properties if this is a Model instance
    const oppObj = typeof opportunity.toObject === 'function' ? opportunity.toObject() : { ...opportunity };

    return {
      ...oppObj,
      score,
      matchedSkills,
      daysLeft,
      reasons,
    } as RankedOpportunity;
  });

  const ranked = await Promise.all(rankPromises);
  return ranked.sort((a, b) => b.score - a.score);
};

