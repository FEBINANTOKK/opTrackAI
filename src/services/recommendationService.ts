import Opportunity, { IOpportunity } from "../models/Opportunity.js";
import Preference from "../models/Preference.js";
import axios from "axios";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "phi3";


const MINIMUM_RESULTS = 10;
const DEFAULT_RETURN_LIMIT = 20;
const DEFAULT_FETCH_LIMIT = 200;
const DEFAULT_MIN_SCORE = 0;
const MAX_FETCH_LIMIT = 200;

// ... [Keep existing weight-based scoring constants and helpers] ...
const STRONG_TITLE_KEYWORDS = [
  "developer",
  "engineer",
  "analyst",
  "designer",
  "manager",
];

const SKILL_MAP: Record<string, string[]> = {
  react: ["reactjs", "frontend", "ui", "nextjs", "spa"],
  node: ["nodejs", "backend", "api", "express"],
  javascript: ["js", "frontend", "web"],
  python: ["ml", "ai", "data", "backend", "analytics", "sql", "automation"],
  design: ["ui", "ux", "figma", "graphic", "visual"],
  marketing: ["seo", "social media", "content", "campaign"],
  sql: ["database", "analytics", "data"],
  java: ["backend", "software", "api"],
  "software developer": ["frontend", "backend", "fullstack", "coding"],
};

const ROLE_MAP: Record<string, string[]> = {
  frontend: ["react", "nextjs", "ui", "frontend", "web"],
  backend: ["node", "express", "api", "database", "software"],
  fullstack: ["react", "node", "mern", "web", "fullstack"],
  design: ["ui", "ux", "figma", "graphic"],
  marketing: ["seo", "social media", "content"],
  sales: ["business development", "lead generation", "sales", "client"],
  data: ["python", "sql", "analytics", "data"],
  ai: ["python", "ml", "ai", "automation"],
  hr: ["recruitment", "human resources", "hr"],
};

type ScoredOpportunity = {
  opportunity: IOpportunity & { matchPercentage?: number; matchReason?: string };
  score: number;
};

export interface RecommendationResponse {
  success: true;
  count: number;
  opportunities: Array<IOpportunity & { matchPercentage?: number; matchReason?: string }>;
}

export interface RecommendationQueryOptions {
  limit?: number;
  minScore?: number;
  fetchLimit?: number;
}

const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => normalizeText(item))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const text = normalizeText(value);
    return text ? [text] : [];
  }

  return [];
};

const splitTokens = (value: string): string[] =>
  value
    .split(/[\s\-_/(),.]+/)
    .map((token) => token.trim())
    .filter(Boolean);

const unique = (items: string[]): string[] => [...new Set(items)];

const expandSkillTerms = (term: string): string[] => {
  const normalized = normalizeText(term);
  if (!normalized) {
    return [];
  }

  const direct = SKILL_MAP[normalized] ?? [];
  const reverse = Object.entries(SKILL_MAP)
    .filter(([, values]) =>
      values.map((value) => normalizeText(value)).includes(normalized),
    )
    .map(([key]) => key);

  return unique([
    normalized,
    ...splitTokens(normalized),
    ...direct.map((value) => normalizeText(value)),
    ...reverse,
  ]);
};

const inferRole = (title: string): string[] => {
  const normalizedTitle = normalizeText(title);
  const roles = new Set<string>();

  if (
    normalizedTitle.includes("frontend") ||
    normalizedTitle.includes("react") ||
    normalizedTitle.includes("web")
  ) {
    roles.add("frontend");
  }

  if (
    normalizedTitle.includes("node") ||
    normalizedTitle.includes("backend") ||
    normalizedTitle.includes("api")
  ) {
    roles.add("backend");
  }

  if (
    normalizedTitle.includes("full stack") ||
    normalizedTitle.includes("fullstack")
  ) {
    roles.add("fullstack");
  }

  if (
    normalizedTitle.includes("design") ||
    normalizedTitle.includes("video editing") ||
    normalizedTitle.includes("graphic") ||
    normalizedTitle.includes("ui") ||
    normalizedTitle.includes("ux") ||
    normalizedTitle.includes("content creator")
  ) {
    roles.add("design");
  }

  if (
    normalizedTitle.includes("marketing") ||
    normalizedTitle.includes("content writing") ||
    normalizedTitle.includes("social media") ||
    normalizedTitle.includes("seo")
  ) {
    roles.add("marketing");
  }

  if (
    normalizedTitle.includes("sales") ||
    normalizedTitle.includes("business development") ||
    normalizedTitle.includes("client acquisition")
  ) {
    roles.add("sales");
  }

  if (
    normalizedTitle.includes("data") ||
    normalizedTitle.includes("analyst") ||
    normalizedTitle.includes("analytics")
  ) {
    roles.add("data");
  }

  if (
    normalizedTitle.includes("ai") ||
    normalizedTitle.includes("machine learning") ||
    normalizedTitle.includes("ml") ||
    normalizedTitle.includes("automation") ||
    normalizedTitle.includes("agent")
  ) {
    roles.add("ai");
  }

  if (
    normalizedTitle.includes("hr") ||
    normalizedTitle.includes("human resource") ||
    normalizedTitle.includes("recruitment") ||
    normalizedTitle.includes("compliance")
  ) {
    roles.add("hr");
  }

  if (
    normalizedTitle.includes("developer") ||
    normalizedTitle.includes("engineer")
  ) {
    roles.add("backend");
    roles.add("frontend");
    roles.add("fullstack");
  }

  return [...roles];
};

const termMatches = (left: string, right: string): boolean =>
  left === right || left.includes(right) || right.includes(left);

const inferUserRoles = (preferenceSkills: string[]): string[] => {
  const skills = new Set(
    preferenceSkills.flatMap((skill) => expandSkillTerms(skill)),
  );
  const roles: string[] = [];

  for (const [role, roleSkills] of Object.entries(ROLE_MAP)) {
    const hasRoleSkill = roleSkills.some((roleSkill) => {
      const expandedRoleSkill = expandSkillTerms(roleSkill);
      return expandedRoleSkill.some((term) => skills.has(term));
    });

    if (hasRoleSkill) {
      roles.push(role);
    }
  }

  return unique(roles);
};

const hasTitleCategoryOverlap = (
  titleRoles: string[],
  preferenceSkills: string[],
): boolean => {
  if (titleRoles.length === 0 || preferenceSkills.length === 0) {
    return false;
  }

  const expandedPreferenceSkills = new Set(
    preferenceSkills.flatMap((skill) => expandSkillTerms(skill)),
  );

  return titleRoles.some((role) =>
    (ROLE_MAP[role] ?? []).some((roleTerm) =>
      expandSkillTerms(roleTerm).some((term) =>
        expandedPreferenceSkills.has(term),
      ),
    ),
  );
};

const hasSecondarySkillMatch = (
  titleRoles: string[],
  preferenceSkills: string[],
  opportunitySkills: string[],
  title: string,
): boolean => {
  if (preferenceSkills.length === 0) {
    return false;
  }

  const titleTokens = splitTokens(normalizeText(title));
  const roleTerms = titleRoles.flatMap((role) => ROLE_MAP[role] ?? []);
  const opportunityTerms = [
    ...titleTokens,
    ...roleTerms,
    ...opportunitySkills,
    ...opportunitySkills.flatMap((skill) => expandSkillTerms(skill)),
  ];

  for (const preferenceSkill of preferenceSkills) {
    const candidateTerms = expandSkillTerms(preferenceSkill);
    if (
      candidateTerms.some((candidate) =>
        opportunityTerms.some((term) => termMatches(candidate, term)),
      )
    ) {
      return true;
    }
  }

  return false;
};

const hasLooseLocationMatch = (
  preferenceLocation: string,
  preferenceWorkModes: string[],
  opportunityLocation: string,
): boolean => {
  if (!opportunityLocation) {
    return false;
  }

  if (!preferenceLocation && preferenceWorkModes.length === 0) {
    return false;
  }

  const remoteOpportunity =
    opportunityLocation.includes("remote") ||
    opportunityLocation.includes("online");

  if (preferenceWorkModes.includes("remote") && remoteOpportunity) {
    return true;
  }

  if (
    (preferenceWorkModes.includes("onsite") ||
      preferenceWorkModes.includes("hybrid")) &&
    !remoteOpportunity
  ) {
    return true;
  }

  if (!preferenceLocation) {
    return false;
  }

  return (
    preferenceLocation === opportunityLocation ||
    preferenceLocation.includes(opportunityLocation) ||
    opportunityLocation.includes(preferenceLocation)
  );
};

const hasRoleMatch = (userRoles: string[], titleRoles: string[]): boolean =>
  userRoles.some((role) => titleRoles.includes(role));

const getScoredOpportunity = (
  opportunity: IOpportunity,
  preference: {
    types: string[];
    skills: string[];
    userRoles: string[];
    rewards: string[];
    workModes: string[];
    location: string;
  },
): ScoredOpportunity => {
  const opportunityType = normalizeText(opportunity.type);
  const opportunitySkills = normalizeStringArray(opportunity.skills);
  const opportunityReward = normalizeText(opportunity.reward);
  const opportunityLocation = normalizeText(opportunity.location);
  const title = normalizeText(opportunity.title);
  const titleRoles = inferRole(title);

  let score = 0;

  if (
    preference.types.length > 0 &&
    preference.types.includes(opportunityType)
  ) {
    score += 3;
  }

  if (hasRoleMatch(preference.userRoles, titleRoles)) {
    score += 5;
  }

  if (hasTitleCategoryOverlap(titleRoles, preference.skills)) {
    score += 3;
  }

  if (
    hasSecondarySkillMatch(
      titleRoles,
      preference.skills,
      opportunitySkills,
      title,
    )
  ) {
    score += 2;
  }

  if (
    hasLooseLocationMatch(
      preference.location,
      preference.workModes,
      opportunityLocation,
    )
  ) {
    score += 2;
  }

  if (
    preference.rewards.length > 0 &&
    preference.rewards.includes(opportunityReward)
  ) {
    score += 1;
  }

  if (STRONG_TITLE_KEYWORDS.some((keyword) => title.includes(keyword))) {
    score += 1;
  }

  return {
    opportunity,
    score,
  };
};

const dedupeByOpportunity = (items: IOpportunity[]): IOpportunity[] => {
  const seen = new Set<string>();
  const uniqueItems: IOpportunity[] = [];

  for (const item of items) {
    const key = item.link || item._id.toString();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    uniqueItems.push(item);
  }

  return uniqueItems;
};

// --- NEW AI MATCHING LOGIC ---

async function enrichWithAI(
  userProfile: any,
  candidates: IOpportunity[],
): Promise<Array<IOpportunity & { matchPercentage?: number; matchReason?: string }>> {
  if (candidates.length === 0) {
    console.log("[AI] Skipping enrichment: no candidates");
    return candidates;
  }

  const skills = normalizeStringArray(userProfile?.skills);
  const workMode = normalizeStringArray(userProfile?.workMode);
  const location = normalizeText(userProfile?.location);
  const opportunityType = normalizeStringArray(userProfile?.opportunityType);
  const target = normalizeText(userProfile?.target) || "student";

  console.log(`[AI] Enriching ${candidates.length} candidates via Ollama (${OLLAMA_MODEL}) for profile: skills=[${skills}], workMode=[${workMode}], location=${location}`);

  try {
    const prompt = `You are an expert career and opportunity matching engine.
Analyze the following user profile and opportunities.

USER PROFILE:
- Target: ${target}
- Skills: ${skills.join(", ") || "Not specified"}
- Work Mode Preference: ${workMode.join(", ") || "Any"}
- Location Preference: ${location || "Any"}
- Opportunity Types: ${opportunityType.join(", ") || "Any"}

OPPORTUNITIES:
${candidates.map((c, i) => `[${i}] Title: ${c.title}, Company: ${c.company}, Skills: ${(c.skills || []).join(", ")}, Type: ${c.type}, Location: ${c.location}`).join("\n")}

TASK:
For each opportunity, calculate TWO scores:
1. "skillMatch" (0-100): How well the user's skills, location and work mode match this opportunity
2. "matchPercentage" (0-100): Overall AI-assessed fit considering career growth, relevance and opportunity quality
Also provide a "matchReason" (max 15 words) explaining the fit.

Respond ONLY with a valid JSON array. No markdown, no explanation, no extra text.
Example: [{"index": 0, "skillMatch": 72, "matchPercentage": 85, "matchReason": "Strong React overlap and remote aligns with preference."}]`;

    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
    }, {
      timeout: 120000,
    });

    const rawText = response.data.response || "";
    console.log("[AI] Raw Ollama response:", rawText.substring(0, 300));

    // Extract JSON from the response
    let jsonText = rawText.trim();
    
    const jsonArrayMatch = jsonText.match(/\[[\s\S]*\]/);
    if (jsonArrayMatch) {
      jsonText = jsonArrayMatch[0];
    }

    const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
      const innerArrayMatch = jsonText.match(/\[[\s\S]*\]/);
      if (innerArrayMatch) jsonText = innerArrayMatch[0];
    }

    let aiAssessments: any[] = [];
    try {
      aiAssessments = JSON.parse(jsonText);
    } catch (parseErr) {
      console.log("[AI] Initial JSON parse failed, attempting repair...");
      // Try to fix common LLM JSON issues:
      // 1. Remove trailing commas
      let repaired = jsonText.replace(/,\s*([}\]])/g, '$1');
      // 2. Fix unterminated strings by removing the last incomplete object
      const lastCloseBrace = repaired.lastIndexOf('}');
      if (lastCloseBrace !== -1) {
        repaired = repaired.substring(0, lastCloseBrace + 1) + ']';
      }
      try {
        aiAssessments = JSON.parse(repaired);
      } catch {
        console.error("[AI] JSON repair failed, extracting individual objects...");
        // Extract valid objects individually
        const objRegex = /\{[^{}]*"index"\s*:\s*\d+[^{}]*\}/g;
        const matches = repaired.match(objRegex) || [];
        for (const m of matches) {
          try {
            aiAssessments.push(JSON.parse(m));
          } catch { /* skip malformed */ }
        }
      }
    }
    
    console.log(`[AI] Successfully parsed ${aiAssessments.length} assessments from Ollama`);
    
    return candidates.map((opp, i) => {
      const assessment = aiAssessments.find((a: any) => a.index === i);
      const oppObj = typeof opp.toObject === 'function' ? opp.toObject() : { ...opp };
      return {
        ...oppObj,
        skillMatch: Math.min(100, Math.max(0, assessment?.skillMatch ?? 0)),
        matchPercentage: Math.min(100, Math.max(0, assessment?.matchPercentage ?? 0)),
        matchReason: assessment?.matchReason ?? "Profile analysis complete.",
      };
    });
  } catch (error: any) {
    if (error?.code === 'ECONNREFUSED') {
      console.error("[AI] Ollama not running at", OLLAMA_URL);
    } else {
      console.error("[AI] Enrichment Error:", error?.message || error);
    }
    // Return candidates without AI data rather than failing
    return candidates.map((opp) => {
      const oppObj = typeof opp.toObject === 'function' ? opp.toObject() : { ...opp };
      return { ...oppObj };
    });
  }
}



export const getRecommendations = async (
  userId: string,
  options: RecommendationQueryOptions = {},
): Promise<RecommendationResponse> => {
  const preference = await Preference.findOne({ userId });
  const minScore = Math.max(0, options.minScore ?? DEFAULT_MIN_SCORE);
  const fetchLimit = Math.min(
    MAX_FETCH_LIMIT,
    Math.max(20, options.fetchLimit ?? DEFAULT_FETCH_LIMIT),
  );
  const requestedLimit = Math.max(
    MINIMUM_RESULTS,
    options.limit ?? DEFAULT_RETURN_LIMIT,
  );
  const now = new Date();

  const preferenceTypes = normalizeStringArray(preference?.opportunityType);
  const preferenceSkills = normalizeStringArray(preference?.skills);
  const userRoles = inferUserRoles(preferenceSkills);
  const preferenceRewards = normalizeStringArray(preference?.reward);
  const preferenceWorkModes = normalizeStringArray(preference?.workMode);
  const preferenceLocation = normalizeText(preference?.location);

  const baseQuery: Record<string, unknown> = {
    deadline: { $gte: now },
  };

  if (preferenceTypes.length > 0) {
    baseQuery.type = { $in: preferenceTypes };
  }

  if (preferenceLocation) {
    const locationRegex = new RegExp(preferenceLocation, "i");
    const locationFilters: Array<Record<string, unknown>> = [
      { location: locationRegex },
    ];

    if (preferenceWorkModes.includes("remote")) {
      locationFilters.push({ location: /remote|online/i });
    }

    baseQuery.$or = locationFilters;
  }

  const candidateOpportunities = await Opportunity.find(baseQuery)
    .sort({ createdAt: -1 })
    .limit(fetchLimit);

  const scored = candidateOpportunities
    .map((opportunity) =>
      getScoredOpportunity(opportunity, {
        types: preferenceTypes,
        skills: preferenceSkills,
        userRoles,
        rewards: preferenceRewards,
        workModes: preferenceWorkModes,
        location: preferenceLocation,
      }),
    )
    .filter((item) => item.score >= minScore)
    .sort((left, right) => right.score - left.score);

  console.log(`[Reco] Scored ${scored.length} opportunities from ${candidateOpportunities.length} candidates`);

  let finalOpportunities = dedupeByOpportunity(
    scored.map((item) => item.opportunity),
  );

  if (finalOpportunities.length < MINIMUM_RESULTS) {
    const fallback = await Opportunity.find({})
      .sort({ createdAt: -1 })
      .limit(fetchLimit);

    console.log(`[Reco] Added ${fallback.length} fallback opportunities`);
    finalOpportunities = dedupeByOpportunity([
      ...finalOpportunities,
      ...fallback,
    ]);
  }

  const sliced = finalOpportunities.slice(
    0,
    Math.max(MINIMUM_RESULTS, requestedLimit),
  );

  // Enrich top 10 with AI (after all filtering and fallback)
  const topForAI = sliced.slice(0, 10);
  const rest = sliced.slice(10);
  const aiEnrichedTop = await enrichWithAI(preference, topForAI);

  const opportunities = [...aiEnrichedTop, ...rest];

  return {
    success: true,
    count: opportunities.length,
    opportunities,
  };
};

export const getRecommendationsForUser = getRecommendations;
