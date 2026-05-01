import type { Member } from "../../types";

interface PodiumCardProps {
  member: Member;
  rank: 1 | 2 | 3;
}

const rankConfig = {
  1: {
    height: "h-44",
    badge: "bg-yellow-400 text-yellow-900",
    ring: "ring-yellow-400",
    label: "1st",
  },
  2: {
    height: "h-36",
    badge: "bg-gray-300 text-gray-700",
    ring: "ring-gray-300",
    label: "2nd",
  },
  3: {
    height: "h-32",
    badge: "bg-amber-600 text-white",
    ring: "ring-amber-600",
    label: "3rd",
  },
};

export function PodiumCard({ member, rank }: PodiumCardProps) {
  const config = rankConfig[rank];

  return (
    <div className={`flex ${config.height} flex-col items-center justify-end`}>
      <div className="relative mb-3">
        <img
          src={member.avatar}
          alt={member.name}
          className={`h-16 w-16 rounded-full bg-gray-100 ring-4 ${config.ring} ${rank === 1 ? "h-20 w-20" : ""}`}
        />
        <span
          className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${config.badge}`}
        >
          {rank}
        </span>
      </div>
      <h3 className={`text-center font-semibold text-gray-900 ${rank === 1 ? "text-lg" : "text-sm"}`}>
        {member.name}
      </h3>
      <p className="text-center text-xs text-gray-500">{member.role}</p>
      <p className="text-center text-xs text-gray-400">{member.teamCode}</p>
      <div className="mt-2 flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1">
        <svg className="h-4 w-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span className="text-sm font-bold text-indigo-600">{member.totalScore}</span>
      </div>
    </div>
  );
}
