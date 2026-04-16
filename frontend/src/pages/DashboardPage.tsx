import { useState, useEffect, useMemo, useRef } from "react";
import { RefreshCw, Rocket, Globe, MapPin, Building2, Clock, Sparkles, Check, Bot } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { SkillChip } from "../components/ui/SkillChip";
import { StatCard } from "../components/ui/StatCard";
import { useAuthStore } from "../store/useAuthStore";
import type { OpportunityType } from "../types/auth";
import { fetchRecommendations, fetchAllOpportunities } from "../services/recommendationService";
import type { IOpportunity } from "../types/opportunity";
import { ChatBot } from "../components/ChatBot";

type Opportunity = {
  id: string;
  title: string;
  type: OpportunityType;
  location: string;
  mode: string;
  reward: string;
  link: string;
  skills: string[];
  deadline: string;
  match: number;
  matchPercentage?: number;
  matchReason?: string;
};

const staticOpportunities: Opportunity[] = [
  {
    id: "hack-ai-sprint",
    title: "AI Builder Sprint 2026",
    type: "hackathon",
    location: "Remote",
    mode: "Remote",
    reward: "Cash prize + mentorship",
    link: "https://example.com/ai-builder-sprint",
    skills: ["React", "Python", "AI"],
    deadline: "Apr 28",
    match: 96,
  },
  {
    id: "frontend-fellowship",
    title: "Frontend Engineering Internship",
    type: "internship",
    location: "Bengaluru",
    mode: "Hybrid",
    reward: "Stipend + PPO chance",
    link: "https://example.com/frontend-internship",
    skills: ["React", "TypeScript", "UI design"],
    deadline: "May 4",
    match: 91,
  },
  {
    id: "campus-cloud",
    title: "Campus Cloud Innovation Challenge",
    type: "hackathon",
    location: "Delhi",
    mode: "Onsite",
    reward: "Certificate + hiring fast track",
    link: "https://example.com/cloud-challenge",
    skills: ["Cloud", "Node.js", "APIs"],
    deadline: "May 12",
    match: 88,
  },
  {
    id: "junior-product-engineer",
    title: "Junior Product Engineer",
    type: "job",
    location: "Remote",
    mode: "Remote",
    reward: "Full-time role",
    link: "https://example.com/product-engineer",
    skills: ["React", "TypeScript", "Problem solving"],
    deadline: "Rolling",
    match: 84,
  },
];

type DashboardPageProps = {
  onLogout: () => void;
  onEditPreferences: () => void;
};

export function DashboardPage({
  onLogout,
  onEditPreferences,
}: DashboardPageProps) {
  const user = useAuthStore((state) => state.user);
  const preferences = useAuthStore((state) => state.preferences);
  const token = useAuthStore((state) => state.token);

  const [backendOpportunities, setBackendOpportunities] = useState<IOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const cachedRecommended = useRef<{ opps: IOpportunity[], hasMore: boolean } | null>(null);
  const cachedExplore = useRef<Record<number, { opps: IOpportunity[], hasMore: boolean }>>({});
  const lastRefreshTrigger = useRef<number>(0);

  // Auto-refresh every 4 hours (14400000 ms)
  useEffect(() => {
    const intervalId = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 14400000);
    return () => clearInterval(intervalId);
  }, []);

  // View mode
  const [viewMode, setViewMode] = useState<'recommended' | 'all'>('recommended');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Filter state
  const [typeFilters, setTypeFilters] = useState<OpportunityType[]>([]);
  const [modeFilters, setModeFilters] = useState<string[]>([]);

  const toggleTypeFilter = (type: OpportunityType) => {
    setTypeFilters(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleModeFilter = (mode: string) => {
    setModeFilters(prev => 
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    );
  };

  const clearFilters = () => {
    setTypeFilters([]);
    setModeFilters([]);
  };

  useEffect(() => {
    async function loadRecommendations() {
      if (!user?.id || !token) return;
      
      const isForcedRefresh = refreshTrigger !== lastRefreshTrigger.current;
      
      // If a refresh was triggered manually or via 4-hour cycle, blast the cache
      if (isForcedRefresh) {
        cachedRecommended.current = null;
        cachedExplore.current = {};
        lastRefreshTrigger.current = refreshTrigger;
      }

      try {
        if (viewMode === 'recommended') {
          // Serve from cache if available
          if (cachedRecommended.current) {
            setBackendOpportunities(cachedRecommended.current.opps);
            setHasMore(cachedRecommended.current.hasMore);
            return;
          }
          
          setIsLoading(true);
          const response = await fetchRecommendations(user.id, token);
          cachedRecommended.current = { opps: response.opportunities, hasMore: response.hasMore || false };
          setBackendOpportunities(response.opportunities);
          setHasMore(response.hasMore || false);
        } else {
          // Serve paginated explore data from cache if available
          if (cachedExplore.current[currentPage]) {
            setBackendOpportunities(cachedExplore.current[currentPage].opps);
            setHasMore(cachedExplore.current[currentPage].hasMore);
            return;
          }
          
          setIsLoading(true);
          const response = await fetchAllOpportunities(token, currentPage, 10);
          cachedExplore.current[currentPage] = { opps: response.opportunities, hasMore: response.hasMore || false };
          setBackendOpportunities(response.opportunities);
          setHasMore(response.hasMore || false);
        }
        setError(null);
      } catch (err) {
        console.error("Failed to load recommendations:", err);
        setError(`Could not load ${viewMode} opportunities. Using fallback data.`);
      } finally {
        setIsLoading(false);
      }
    }

    loadRecommendations();
  }, [user?.id, token, viewMode, currentPage, refreshTrigger]);

  // Reset page when switching mode or filters
  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode, typeFilters, modeFilters]);

  const opportunities: Opportunity[] = useMemo(() => {
    if (backendOpportunities.length === 0) {
      // Return hardcoded ones if loading failed/empty
      return staticOpportunities;
    }

    return backendOpportunities.map((opp) => {
      const isRemote = opp.location.toLowerCase().includes("remote");
      const isHybrid = opp.location.toLowerCase().includes("hybrid");
      
      return {
        id: opp._id,
        title: opp.title,
        type: opp.type as OpportunityType,
        location: opp.location,
        mode: isRemote ? "Remote" : isHybrid ? "Hybrid" : "Onsite",
        reward: opp.reward || "Contact for details",
        link: opp.link,
        skills: opp.skills,
        deadline: new Date(opp.deadline).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        match: opp.skillMatch ?? 0, // AI-powered skill match score
        matchPercentage: opp.matchPercentage,
        matchReason: opp.matchReason,
      };
    });
  }, [backendOpportunities]);

  const preferredModes = Array.isArray(preferences?.workMode)
    ? preferences.workMode
    : preferences?.workMode
      ? [preferences.workMode]
      : [];
  const preferredCommitments = Array.isArray(preferences?.timeCommitment)
    ? preferences.timeCommitment
    : preferences?.timeCommitment
      ? [preferences.timeCommitment]
      : [];
  const preferredOpportunityTypes = Array.isArray(preferences?.opportunityType)
    ? preferences.opportunityType
    : preferences?.opportunityType
      ? [preferences.opportunityType]
      : [];

  const recommended = useMemo(() => {
    if (!preferences) {
      return opportunities;
    }

    return [...opportunities]
      .filter((opportunity) => {
        const matchesType = typeFilters.length === 0 || typeFilters.includes(opportunity.type);
        const matchesMode = modeFilters.length === 0 || modeFilters.includes(opportunity.mode);
        return matchesType && matchesMode;
      })
      .map((opportunity) => {
        const typeMatch =
          preferredOpportunityTypes.length === 0 ||
          preferredOpportunityTypes.includes(opportunity.type);
        const locationMatch =
          opportunity.location.toLowerCase() ===
            preferences.location.toLowerCase() ||
          preferredModes.includes(
            opportunity.mode as "Remote" | "Onsite" | "Hybrid",
          );
        const skillHits = opportunity.skills.filter((skill) => {
          const userSkills = Array.isArray(preferences.skills) ? preferences.skills : [];
          return userSkills.some(
            (userSkill) => typeof userSkill === 'string' && userSkill.toLowerCase() === skill.toLowerCase(),
          );
        }).length;

        return {
          ...opportunity,
          match:
            opportunity.match +
            (typeMatch ? 3 : 0) +
            (locationMatch ? 2 : 0) +
            skillHits * 2,
        };
      })
      .sort((first, second) => {
        const aiFirst = first.matchPercentage ?? 0;
        const aiSecond = second.matchPercentage ?? 0;
        if (aiFirst !== aiSecond) return aiSecond - aiFirst;
        return second.match - first.match;
      });
  }, [preferences, opportunities, preferredOpportunityTypes, preferredModes, typeFilters, modeFilters]);

  let preferredSkills = Array.isArray(preferences?.skills) 
    ? preferences.skills 
    : [];
  
  // Flatten if it contains comma separated strings
  if (preferredSkills.some(skill => skill.includes(','))) {
    preferredSkills = preferredSkills.flatMap(skill => skill.split(',').map(s => s.trim()).filter(Boolean));
  }
  
  if (preferredSkills.length === 0) {
    preferredSkills = ["React", "TypeScript"];
  }
  const topOpportunity = recommended[0];
  const highMatchCount = recommended.filter(
    (opportunity) => opportunity.match >= 90,
  ).length;
  const remoteFriendlyCount = recommended.filter(
    (opportunity) => opportunity.mode !== "Onsite",
  ).length;
  const averageMatch = recommended.length
    ? `${Math.round(recommended.reduce((sum, opportunity) => sum + opportunity.match, 0) / recommended.length)}%`
    : "0%";

  const getReasons = (opportunity: Opportunity) => {
    if (opportunity.matchReason) {
      return [opportunity.matchReason];
    }

    const matchingSkill = opportunity.skills.find((skill) =>
      preferredSkills.some(
        (preferredSkill) =>
          preferredSkill.toLowerCase() === skill.toLowerCase(),
      ),
    );

    return [
      matchingSkill
        ? `Strong overlap with your ${matchingSkill} skillset`
        : "Expands the profile you are building",
      opportunity.mode === (preferredModes[0] ?? "Remote")
        ? `Aligned with your ${opportunity.mode.toLowerCase()} work preference`
        : `${opportunity.mode} format gives you flexibility`,
    ];
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_32%),linear-gradient(180deg,_#e0f2fe_0%,_#eff6ff_24%,_#f8fafc_52%,_#ffffff_100%)] text-slate-950">
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-[38rem] bg-[linear-gradient(135deg,_rgba(15,23,42,0.98)_0%,_rgba(12,74,110,0.96)_42%,_rgba(8,145,178,0.88)_100%)]" />
        <div className="absolute left-[-8rem] top-16 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute right-[-6rem] top-32 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl" />

        <section className="relative px-4 pb-8 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-6">
          {isLoading && (
            <div className="absolute inset-0 z-50 flex items-start justify-center pt-24 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-md">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
                <p className="font-bold text-white">Ranking opportunities...</p>
              </div>
            </div>
          )}

          {error && !isLoading && (
            <div className="mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-amber-200 text-sm font-medium flex items-center gap-3">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-slate-950">!</span>
              {error}
            </div>
          )}

          <header className="rounded-[28px] border border-white/12 bg-white/8 p-5 text-white shadow-[0_30px_100px_-48px_rgba(8,47,73,0.95)] backdrop-blur md:p-7 lg:p-8">
            <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-4xl">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">
                  opTrackAI dashboard
                </p>
                <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl xl:text-6xl">
                  A full-screen command center for your next best opportunities
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
                  Welcome back, {user?.username ?? "builder"}. Your dashboard
                  now stretches across the page so the top matches, profile
                  signal, and next actions are all visible without feeling boxed
                  in.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  className="h-12 rounded-2xl border border-white/18 bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/18"
                  onClick={onEditPreferences}
                  type="button"
                >
                  Edit preferences
                </button>
                <button
                  className="h-12 rounded-2xl bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                  onClick={onLogout}
                  type="button"
                >
                  Log out
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-4 xl:grid-cols-[1.3fr_0.9fr_0.9fr]">
              <div className="rounded-[26px] border border-white/12 bg-white/10 p-5 backdrop-blur">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className="border-cyan-300/30 bg-cyan-300/12 text-cyan-100"
                    tone="slate"
                  >
                    {highMatchCount} high-match picks
                  </Badge>
                  <Badge
                    className="border-emerald-300/30 bg-emerald-300/12 text-emerald-100"
                    tone="slate"
                  >
                    {remoteFriendlyCount} flexible options
                  </Badge>
                </div>
                <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-slate-300">
                  Lead recommendation
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">
                  {topOpportunity?.title ?? "No opportunities yet"}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  {topOpportunity
                    ? `${topOpportunity.location} / ${topOpportunity.mode} / ${topOpportunity.reward}`
                    : "Complete your preference setup to surface stronger recommendations."}
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <GlassStat label="Average fit" value={averageMatch} />
                  <GlassStat
                    label="Preferred mode"
                    value={preferredModes.join(", ") || "Not set"}
                  />
                  <GlassStat
                    label="Commitment"
                    value={preferredCommitments.join(", ") || "Not set"}
                  />
                </div>
              </div>

              <div className="rounded-[26px] border border-white/12 bg-slate-950/24 p-5 backdrop-blur">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-300">
                  Your lane
                </p>
                <div className="mt-4 space-y-4">
                  <InfoLine
                    label="Target"
                    value={preferences?.target ?? "Not set"}
                  />
                  <InfoLine
                    label="Opportunity"
                    value={preferredOpportunityTypes.join(", ") || "Not set"}
                  />
                  <InfoLine
                    label="Location"
                    value={preferences?.location || "Not set"}
                  />
                  <InfoLine
                    label="JWT status"
                    value={token ? "Connected" : "Waiting for backend"}
                  />
                </div>
              </div>

              <div className="rounded-[26px] border border-white/12 bg-white p-5 text-slate-950 shadow-[0_24px_80px_-44px_rgba(34,211,238,0.55)]">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                  Profile signal
                </p>
                <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-slate-950">
                  Ready to apply faster
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Your strongest surface area right now is around{" "}
                  {preferredSkills[0]}-leaning roles with{" "}
                  {preferredModes[0] ?? "remote"} flexibility.
                </p>
                <div className="mt-5 space-y-4">
                  <MetricBar
                    label="Match quality"
                    value={averageMatch}
                    width={`${Math.min(Number.parseInt(averageMatch, 10), 100)}%`}
                  />
                  <MetricBar
                    label="Profile completion"
                    value={token ? "100%" : "76%"}
                    width={token ? "100%" : "76%"}
                  />
                </div>
              </div>
            </div>
          </header>

          <section className="mt-6 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="space-y-5">
              <Card className="rounded-[26px] bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] shadow-[0_24px_80px_-48px_rgba(15,23,42,0.28)]">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-700">
                  Skill map
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950">
                  Strengths in rotation
                </h2>
                <div className="mt-5 flex flex-wrap gap-2">
                  {preferredSkills.map((skill) => (
                    <span
                      className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-xs font-black text-cyan-900"
                      key={skill}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  The current opportunity mix leans toward product-building,
                  frontend execution, and fast feedback-loop teams.
                </p>
              </Card>

              <Card className="rounded-[26px] bg-white text-slate-950 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.12)]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-700">
                      Discovery
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950">
                      Filters
                    </h2>
                  </div>
                  {(typeFilters.length > 0 || modeFilters.length > 0) && (
                    <button 
                      onClick={clearFilters}
                      className="text-[10px] font-black uppercase tracking-wider text-cyan-600 hover:text-cyan-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Opportunity Type</p>
                    <div className="flex flex-wrap gap-2">
                      {(["hackathon", "internship", "job"] as OpportunityType[]).map(type => (
                        <button
                          key={type}
                          onClick={() => toggleTypeFilter(type)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            typeFilters.includes(type)
                              ? "bg-cyan-600 text-white shadow-md shadow-cyan-200"
                              : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Work Mode</p>
                    <div className="flex flex-wrap gap-2">
                      {["Remote", "Onsite", "Hybrid"].map(mode => (
                        <button
                          key={mode}
                          onClick={() => toggleModeFilter(mode)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            modeFilters.includes(mode)
                              ? "bg-slate-900 text-white shadow-md shadow-slate-200"
                              : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </aside>

            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <StatCard
                  icon="01"
                  label="Top matches"
                  value={`${recommended.length}`}
                />
                <StatCard
                  icon="WF"
                  label="Preferred mode"
                  value={preferredModes.join(", ") || "Not set"}
                />
                <StatCard
                  icon="TM"
                  label="Time commitment"
                  value={preferredCommitments.join(", ") || "Not set"}
                />
              </div>

              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-700">
                    Opportunity pulse
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950">
                    {viewMode === 'recommended' 
                      ? `You have ${highMatchCount} roles above 90% match`
                      : `Exploring ${recommended.length} Global Opportunities`
                    }
                  </h2>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setRefreshTrigger(prev => prev + 1)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 text-xs font-black uppercase tracking-wider rounded-[16px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-slate-200 hover:bg-slate-50 transition-colors active:scale-95"
                    title="Manual Refresh"
                  >
                    <RefreshCw className="h-4 w-4 text-black" />
                    Refresh
                  </button>
                  <div className="flex p-1.5 bg-slate-100 rounded-[20px] shadow-inner">
                    <button
                      onClick={() => setViewMode('recommended')}
                    className={`flex items-center justify-center px-4 py-2.5 rounded-[16px] text-xs font-black transition-all ${
                      viewMode === 'recommended'
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Rocket className="h-4 w-4 mr-1.5 text-black" /> For You
                  </button>
                  <button
                    onClick={() => setViewMode('all')}
                    className={`flex items-center justify-center px-4 py-2.5 rounded-[16px] text-xs font-black transition-all ${
                      viewMode === 'all'
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Globe className="h-4 w-4 mr-1.5 text-black" /> Explore
                  </button>
                  </div>
                </div>
              </div>

              <Card className="rounded-[26px] border-cyan-100 bg-[linear-gradient(135deg,_rgba(236,254,255,0.98),_rgba(239,246,255,0.92))] shadow-[0_24px_80px_-48px_rgba(14,165,233,0.45)] mb-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-700">
                      Market Context
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {viewMode === 'recommended' 
                        ? "The full-width layout keeps your strongest roles, breakdowns, and call-to-action buttons visible in one scan."
                        : "Showing all available opportunities. Match scores are still calculated based on your profile to help you navigate."
                      }
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-cyan-200 bg-white px-5 py-4 text-center shadow-sm">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                      Average fit
                    </p>
                    <p className="mt-1 text-4xl font-black tracking-[-0.05em] text-slate-950">
                      {averageMatch}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="grid gap-4 grid-cols-1 max-w-[840px]">
                {recommended.map((opportunity, index) => {
                  const matchingSkillCount = opportunity.skills.filter(
                    (skill) =>
                      preferredSkills.some(
                        (preferredSkill) =>
                          preferredSkill.toLowerCase() === skill.toLowerCase(),
                      ),
                  ).length;
                  return (
                    <Card
                      className="rounded-[22px] border-slate-200/90 bg-[linear-gradient(180deg,_#ffffff_0%,_#fbfdff_100%)] p-0 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.26)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-[0_28px_90px_-52px_rgba(14,165,233,0.38)]"
                      key={opportunity.id}
                    >
                      <article className="flex flex-col gap-3 p-4">
                        {/* Header Row: 2-Column Layout */}
                        <div className="flex flex-col lg:flex-row lg:items-start gap-3 xl:gap-6">
                          {/* 1. Left Column: Main Info & Why This Fits */}
                          <div className="flex-1 min-w-0 flex flex-col gap-3">
                            <div>
                              {/* Title Top Left */}
                              <div className="flex items-start gap-3">
                                <h2 className="text-[21px] leading-tight font-black tracking-[-0.04em] text-slate-950 line-clamp-2" title={opportunity.title}>
                                  {opportunity.title}
                                </h2>
                                <div className="shrink-0 mt-0.5">
                                  <Badge>{opportunity.type}</Badge>
                                </div>
                              </div>
                              
                              {/* Location Row directly below Title */}
                              <div className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-[10px] bg-sky-50 px-2.5 py-1.5 text-[11.5px] font-bold text-sky-900 border border-sky-100/60 shadow-sm">
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5 text-black" />
                                  <span>{opportunity.location}</span>
                                </div>
                                <span className="text-sky-300/80 mx-0.5">•</span>
                                <div className="flex items-center gap-1.5">
                                  <Building2 className="h-3.5 w-3.5 text-black" />
                                  <span>{opportunity.mode}</span>
                                </div>
                                <span className="text-sky-300/80 mx-0.5">•</span>
                                <div className="flex items-center gap-1.5 text-rose-700">
                                  <Clock className="h-3.5 w-3.5 text-black" />
                                  <span>Deadline {opportunity.deadline}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Why This Fits specifically placed below the title context */}
                            <div className="rounded-[14px] border border-slate-200 bg-white p-2.5 shadow-sm inline-block self-start">
                              <div className="flex items-center gap-1.5 mb-1.5 w-full">
                                <Sparkles className="h-3.5 w-3.5 text-black" />
                                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                                  Why This Fits
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {getReasons(opportunity).map((reason) => (
                                  <div
                                    className="flex items-center gap-1.5 rounded-[10px] bg-slate-50 px-2.5 py-1 transition-colors hover:bg-cyan-50/60 border border-slate-100"
                                    key={reason}
                                  >
                                    <span className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
                                      <Check className="h-2.5 w-2.5 text-black" strokeWidth={3} />
                                    </span>
                                    <span className="text-[11.5px] font-medium leading-tight text-slate-700">{reason}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Skills at Bottom of Left Column */}
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {opportunity.skills.map((skill) => (
                                <SkillChip
                                  active={preferredSkills.some(
                                    (preferredSkill) =>
                                      preferredSkill.toLowerCase() ===
                                      skill.toLowerCase(),
                                  )}
                                  key={skill}
                                  skill={skill}
                                />
                              ))}
                            </div>
                          </div>

                          {/* 2. Right Column: Action, Scores, & Badges physically locked to right bounds */}
                          <div className="lg:w-44 shrink-0 flex flex-col gap-2.5 lg:self-stretch">
                            <div className="flex-1"></div>
                            
                            {/* Apply Button */}
                            <a
                              className="inline-flex h-10 w-full items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,_#06b6d4_0%,_#0ea5e9_100%)] px-3 text-[12.5px] font-black text-white shadow-md shadow-cyan-500/20 transition-all hover:bg-cyan-400 hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
                              href={opportunity.link}
                              rel="noreferrer"
                              target="_blank"
                            >
                              Apply Now →
                            </a>


                          </div>
                        </div>

                        {/* Action Row Handled in Header */}
                      </article>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {viewMode === 'all' && (
                <div className="mt-10 flex items-center justify-between border-t border-slate-200 pt-8">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || isLoading}
                    className="group flex items-center gap-2 px-6 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md active:scale-95"
                  >
                    <span className="transition-transform group-hover:-translate-x-1">←</span>
                    Previous 10
                  </button>
                  
                  <div className="text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Page</p>
                    <p className="text-lg font-black text-slate-950">{currentPage}</p>
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!hasMore || isLoading}
                    className="group flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-sm font-black text-white transition-all hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-95 shadow-md shadow-slate-200"
                  >
                    Next 10
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </button>
                </div>
              )}
            </div>
          </section>
        </section>
      </div>
      <ChatBot opportunitiesContext={recommended} />
    </main>
  );
}

function GlassStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/12 bg-slate-950/22 px-4 py-4">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-300">
        {label}
      </p>
      <p className="mt-2 text-xl font-black tracking-[-0.03em] text-white">
        {value}
      </p>
    </div>
  );
}

function ActionNote({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/6 p-4">
      <p className="text-sm font-black text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-slate-300">{label}</span>
      <span className="text-right text-sm font-bold capitalize text-white">
        {value}
      </span>
    </div>
  );
}

function MetricBar({
  label,
  value,
  width,
}: {
  label: string;
  value: string;
  width: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-700">{label}</p>
        <p className="text-sm font-black text-slate-950">{value}</p>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          aria-hidden="true"
          className="h-full rounded-full bg-[linear-gradient(90deg,_#06b6d4_0%,_#0f766e_100%)]"
          style={{ width }}
        />
      </div>
    </div>
  );
}
