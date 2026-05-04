import type { Member, Category } from "../../types";
import { useLeaderboardStore } from "../../store/leaderboardStore";
import { ActivityDetail } from "./ActivityDetail";

interface LeaderboardRowProps {
  member: Member;
  rank: number;
}

const categoryIcons: Record<Category, React.ReactNode> = {
  Education: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10L12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c0 0 2.5 3 6 3s6-3 6-3v-5" />
    </svg>
  ),
  "Public Speaking": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="4" width="14" height="10" rx="1" />
      <line x1="12" y1="14" x2="12" y2="20" />
      <line x1="8" y1="20" x2="16" y2="20" />
    </svg>
  ),
  "University Partners": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 10h.01M15 10h.01" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    </svg>
  ),
};

export function LeaderboardRow({ member, rank }: LeaderboardRowProps) {
  const { expandedMemberId, toggleExpanded } = useLeaderboardStore();
  const isExpanded = expandedMemberId === member.id;

  // Count activities by category
  const categoryCounts = member.activities.reduce(
    (acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
      <button
        onClick={() => toggleExpanded(member.id)}
        className="flex w-full items-center gap-4 px-5 h-24 text-left"
      >
        {/* Rank */}
        <span className="w-10 shrink-0 text-center text-xl font-semibold text-gray-400">
          {rank}
        </span>

        {/* Avatar */}
        <img
          src={member.avatar}
          alt={member.name}
          className="h-12 w-12 shrink-0 rounded-full bg-gray-100 object-cover"
        />

        {/* Name & Role */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-gray-900">
            {member.name}
          </p>
          <p className="truncate text-sm text-gray-500">
            {member.role} ({member.teamCode})
          </p>
        </div>

        {/* Activity Icons */}
        <div className="flex items-center gap-5">
          {(Object.keys(categoryIcons) as Category[]).map((cat) =>
            categoryCounts[cat] ? (
              <span
                key={cat}
                className="flex flex-col items-center text-blue-400"
                title={cat}
              >
                {categoryIcons[cat]}
                <span className="mt-0.5 text-sm font-semibold text-[#475569]">{categoryCounts[cat]}</span>
              </span>
            ) : null
          )}
        </div>

        {/* Score */}
        <div className="flex flex-col items-center ml-6 mr-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Total
          </span>
          <div className="flex items-center gap-1.5">
            <svg
              className="h-7 w-7 text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-2xl font-bold leading-7 text-blue-500">
              {member.totalScore}
            </span>
          </div>
        </div>

        {/* Chevron */}
        <svg
          className={`ml-1 h-5 w-5 shrink-0 text-blue-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && <ActivityDetail member={member} />}
    </div>
  );
}
