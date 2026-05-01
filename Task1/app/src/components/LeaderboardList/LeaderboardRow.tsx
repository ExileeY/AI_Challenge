import type { Member, Category } from "../../types";
import { useLeaderboardStore } from "../../store/leaderboardStore";
import { ActivityDetail } from "./ActivityDetail";

interface LeaderboardRowProps {
  member: Member;
  rank: number;
}

const categoryIcons: Record<Category, { label: string; color: string }> = {
  Education: { label: "🎓", color: "text-blue-500" },
  "Public Speaking": { label: "🖥️", color: "text-blue-500" },
  "University Partners": { label: "🤝", color: "text-blue-500" },
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
    <div className="border-b border-gray-100 bg-white transition-colors hover:bg-gray-50/50">
      <button
        onClick={() => toggleExpanded(member.id)}
        className="flex w-full items-center gap-4 px-5 py-3.5 text-left"
      >
        {/* Rank */}
        <span className="w-8 text-center text-base font-medium text-gray-400">
          {rank}
        </span>

        {/* Avatar */}
        <img
          src={member.avatar}
          alt={member.name}
          className="h-12 w-12 rounded-full bg-gray-100 object-cover"
        />

        {/* Name & Role */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-gray-900">
            {member.name}
          </p>
          <p className="truncate text-xs text-gray-500">
            {member.role} ({member.teamCode})
          </p>
        </div>

        {/* Activity Icons */}
        <div className="flex items-center gap-4">
          {(Object.keys(categoryIcons) as Category[]).map((cat) =>
            categoryCounts[cat] ? (
              <span
                key={cat}
                className="flex flex-col items-center text-blue-500"
                title={cat}
              >
                <span className="text-base">{categoryIcons[cat].label}</span>
                <span className="text-xs font-medium text-blue-500">{categoryCounts[cat]}</span>
              </span>
            ) : null
          )}
        </div>

        {/* Score */}
        <div className="flex flex-col items-center ml-4">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Total
          </span>
          <div className="flex items-center gap-1">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-lg font-bold text-blue-500">
              {member.totalScore}
            </span>
          </div>
        </div>

        {/* Chevron */}
        <svg
          className={`ml-2 h-5 w-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
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
