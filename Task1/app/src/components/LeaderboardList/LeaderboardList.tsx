import type { Member } from "../../types";
import { LeaderboardRow } from "./LeaderboardRow";

interface LeaderboardListProps {
  members: Member[];
}

export function LeaderboardList({ members }: LeaderboardListProps) {
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

  return (
    <div className="flex flex-col gap-3">
      {members.map((member, index) => (
        <LeaderboardRow key={member.id} member={member} rank={index + 1} />
      ))}
    </div>
  );
}
