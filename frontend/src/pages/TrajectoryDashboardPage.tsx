import { useMemo } from "react";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { InsightBanner } from "../components/ui/InsightBanner";
import { SkillChip } from "../components/ui/SkillChip";
import { StatCard } from "../components/ui/StatCard";
import { useAuthStore } from "../store/useAuthStore";
import type { OpportunityType } from "../types/auth";

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
};

const opportunities: Opportunity[] = [
  {
    id: "hack-ai-sprint",
    title: "AI Builder Sprint 2026",
    type: "hackathon",
    location: "Remote",
    mode: "Remote",
    reward: "Cash prize and mentorship",
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
    reward: "Stipend and PPO opportunity",
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
    reward: "Certificate and hiring fast track",
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

type TrajectoryDashboardPageProps = {
  onLogout: () => void;
  onEditPreferences: () => void;
};

export function TrajectoryDashboardPage({
  onLogout,
  onEditPreferences,
}: TrajectoryDashboardPageProps) {
  const user = useAuthStore((state) => state.user);
  const preferences = useAuthStore((state) => state.preferences);
  const token = useAuthStore((state) => state.token);

  const preferredModes = preferences?.workMode ?? [];
  const preferredCommitments = preferences?.timeCommitment ?? [];
  const preferredOpportunityTypes = preferences?.opportunityType ?? [];

  const recommended = useMemo(() => {
    if (!preferences) {
      return opportunities;
    }

    return [...opportunities]
      .map((opportunity) => {
        const typeMatch =
          preferences.opportunityType.length === 0 ||
          preferences.opportunityType.includes(opportunity.type);
        const locationMatch =
          opportunity.location.toLowerCase() ===
            preferences.location.toLowerCase() ||
          preferences.workMode.includes(
            opportunity.mode as "Remote" | "Onsite" | "Hybrid",
          );
        const skillHits = opportunity.skills.filter((skill) =>
          preferences.skills.some(
            (userSkill) => userSkill.toLowerCase() === skill.toLowerCase(),
          ),
        ).length;

        return {
          ...opportunity,
          match:
            opportunity.match +
            (typeMatch ? 3 : 0) +
            (locationMatch ? 2 : 0) +
            skillHits * 2,
        };
      })
      .sort((first, second) => second.match - first.match);
  }, [preferences]);

  const preferredSkills = preferences?.skills.length
    ? preferences.skills
    : ["React", "TypeScript"];
  const highMatchCount = recommended.filter(
    (opportunity) => opportunity.match >= 88,
  ).length;
  const missingNodeCount = recommended.filter(
    (opportunity) => !preferredSkills.includes("Node.js"),
  ).length;
  const topSkill = preferredSkills[0] ?? "React";

  const getReasons = (opportunity: Opportunity) => {
    const skillMatch = opportunity.skills.find((skill) =>
      preferredSkills.some(
        (preferredSkill) =>
          preferredSkill.toLowerCase() === skill.toLowerCase(),
      ),
    );

    return [
      skillMatch
        ? `Matches your ${skillMatch} skill`
        : `Builds on your ${topSkill} profile`,
      opportunity.mode === (preferredModes[0] ?? "Remote")
        ? `Fits your ${opportunity.mode} preference`
        : `${opportunity.mode} option available`,
      opportunity.deadline === "Rolling"
        ? "Open on a rolling basis"
        : "Deadline is coming up",
    ];
  };

  return (
    <main className="auth-page min-h-screen bg-[#f3f6fb] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-7xl overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">
        <header className="border-b border-slate-200 bg-[#eef1f5]">
          <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div className="flex items-start gap-4">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[#1257d6] text-xs font-black text-white">
                OT
              </div>
              <div>
                <p className="text-sm font-black text-[#1257d6]">Optrack AI</p>
                <h1 className="mt-1 text-2xl font-black tracking-[-0.03em] text-slate-900 sm:text-3xl">
                  Recommended for {user?.username || "you"}
                </h1>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Your AI-curated opportunity feed.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className="h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-[#1257d6] hover:text-[#1257d6]"
                onClick={onEditPreferences}
                type="button"
              >
                Edit preferences
              </button>
              <button
                className="h-11 rounded-lg bg-[#1257d6] px-4 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:bg-[#0c49bd]"
                onClick={onLogout}
                type="button"
              >
                Log out
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-6 px-6 py-8 lg:grid-cols-[290px_1fr] lg:px-8">
          <aside className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#1257d6]">
                Profile
              </p>
              <h2 className="mt-1 text-lg font-black tracking-[-0.02em] text-slate-900">
                Your preferences
              </h2>
              <dl className="mt-4 space-y-3">
                <ProfileRow
                  label="Target"
                  value={preferences?.target ?? "Not set"}
                />
                <ProfileRow
                  label="Opportunity"
                  value={preferredOpportunityTypes.join(", ") || "Not set"}
                />
                <ProfileRow
                  label="Location"
                  value={preferences?.location || "Not set"}
                />
                <ProfileRow
                  label="JWT status"
                  value={token ? "Connected" : "Waiting for backend"}
                />
              </dl>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#1257d6]">
                Skills
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(preferences?.skills.length
                  ? preferences.skills
                  : ["React", "TypeScript"]
                ).map((skill) => (
                  <span
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700"
                    key={skill}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          <div>
            <InsightBanner>
              You have {highMatchCount} high-match opportunities based on your{" "}
              {topSkill} skills and {preferredModes.join(", ") || "Remote"}{" "}
              preference.
            </InsightBanner>

            <div className="mt-4">
              <Card className="border-yellow-200 bg-yellow-50/80 p-4 shadow-sm hover:shadow-md">
                <div className="flex gap-3">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <h2 className="text-sm font-black text-yellow-900">
                      Skill gap insight
                    </h2>
                    <p className="mt-1 text-sm font-bold leading-6 text-yellow-800">
                      You are missing Node.js for {missingNodeCount} high-match
                      opportunities.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <StatCard
                icon="⭐"
                label="Top matches"
                value={`${recommended.length}`}
              />
              <StatCard
                icon="🌍"
                label="Preferred mode"
                value={preferredModes.join(", ") || "Not set"}
              />
              <StatCard
                icon="⏱"
                label="Time commitment"
                value={preferredCommitments.join(", ") || "Not set"}
              />
            </div>

            <div className="mt-6 grid gap-4">
              {recommended.map((opportunity) => (
                <Card
                  className="group p-5 hover:-translate-y-1 hover:border-blue-200"
                  key={opportunity.id}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{opportunity.type}</Badge>
                        <Badge tone="blue">⭐ {opportunity.match}%</Badge>
                        <Badge tone="yellow">🔥 Closing soon</Badge>
                      </div>
                      <h2 className="mt-3 text-xl font-black tracking-[-0.02em] text-slate-900">
                        {opportunity.title}
                      </h2>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                        {opportunity.location} - {opportunity.mode} - Deadline{" "}
                        {opportunity.deadline}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
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
                      <div className="mt-4 rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                          Why this matches you
                        </p>
                        <ul className="mt-2 grid gap-2 text-sm font-bold text-slate-700 sm:grid-cols-3">
                          {getReasons(opportunity).map((reason) => (
                            <li className="flex gap-2" key={reason}>
                              <span className="text-[#1257d6]">✔</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="min-w-48 space-y-3 lg:text-right">
                      <p className="text-sm font-bold text-slate-700">
                        {opportunity.reward}
                      </p>
                      <a
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1257d6] px-4 text-sm font-black text-white shadow-lg shadow-blue-100 transition-all duration-200 hover:scale-105 hover:bg-[#0c49bd]"
                        href={opportunity.link}
                        rel="noreferrer"
                        target="_blank"
                      >
                        View opportunity
                      </a>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  const configured = value !== "Not set";

  return (
    <div>
      <dt className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">
        {label}
      </dt>
      <dd
        className={`mt-1 capitalize text-sm font-bold ${configured ? "text-slate-800" : "italic text-slate-400"}`}
      >
        {configured ? value : "Not configured"}
      </dd>
    </div>
  );
}
