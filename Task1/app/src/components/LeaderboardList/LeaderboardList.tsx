import { List } from "react-window";
import type { Member } from "../../types";
import { useLeaderboardStore } from "../../store/leaderboardStore";
import { LeaderboardRow } from "./LeaderboardRow";

interface LeaderboardListProps {
  members: Member[];
}

const ROW_HEIGHT = 64;

function VirtualRow({
  index,
  style,
  members,
}: {
  index: number;
  style: React.CSSProperties;
  members: Member[];
}) {
  return (
    <div style={style}>
      <LeaderboardRow member={members[index]} rank={index + 4} />
    </div>
  );
}

export function LeaderboardList({ members }: LeaderboardListProps) {
  const expandedMemberId = useLeaderboardStore((s) => s.expandedMemberId);
  const hasExpanded = expandedMemberId !== null;

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg
          className="mb-4 h-16 w-16 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-600">No results found</h3>
        <p className="mt-1 text-sm text-gray-400">
          Try adjusting your filters or search query.
        </p>
      </div>
    );
  }

  // When a row is expanded, fall back to regular rendering (variable heights)
  if (hasExpanded) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {members.map((member, index) => (
          <LeaderboardRow key={member.id} member={member} rank={index + 4} />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <List
        rowComponent={({ index, style }) => (
          <VirtualRow index={index} style={style} members={members} />
        )}
        rowCount={members.length}
        rowHeight={ROW_HEIGHT}
        rowProps={{}}
        style={{ height: Math.min(members.length * ROW_HEIGHT, 600) }}
      />
    </div>
  );
}
