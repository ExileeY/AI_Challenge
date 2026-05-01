import type { Member } from "../../types";

interface PodiumCardProps {
  member: Member;
  rank: 1 | 2 | 3;
}

const rankConfig = {
  1: {
    avatarSize: "h-32 w-32",
    badge: "bg-yellow-400 text-yellow-900",
    ring: "ring-4 ring-yellow-400",
    ringOffset: "ring-offset-2",
    scorePill: "bg-yellow-100 border-yellow-300 text-yellow-800",
    starColor: "text-yellow-500",
  },
  2: {
    avatarSize: "h-22 w-22",
    badge: "bg-gray-400 text-white",
    ring: "ring-4 ring-gray-300",
    ringOffset: "ring-offset-2",
    scorePill: "bg-blue-50 border-blue-200 text-blue-700",
    starColor: "text-blue-400",
  },
  3: {
    avatarSize: "h-22 w-22",
    badge: "bg-amber-700 text-white",
    ring: "ring-4 ring-amber-700",
    ringOffset: "ring-offset-2",
    scorePill: "bg-blue-50 border-blue-200 text-blue-700",
    starColor: "text-blue-400",
  },
};

export function PodiumCard({ member, rank }: PodiumCardProps) {
  const config = rankConfig[rank];

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Avatar with ring and rank badge */}
      <div className="relative">
        <img
          src={member.avatar}
          alt={member.name}
          className={`${config.avatarSize} rounded-full bg-gray-100 object-cover ${config.ring} ${config.ringOffset}`}
        />
        <span
          className={`absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow ${config.badge}`}
        >
          {rank}
        </span>
      </div>

      {/* Name */}
      <h3 className="text-center text-sm font-bold text-gray-900">
        {member.name}
      </h3>

      {/* Role & Team */}
      <p className="text-center text-xs text-gray-500">
        {member.role} ({member.teamCode})
      </p>

      {/* Score pill */}
      <div className={`flex items-center gap-1 rounded-full border px-4 py-1.5 ${config.scorePill}`}>
        <svg className={`h-4 w-4 ${config.starColor}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span className="text-sm font-bold">{member.totalScore}</span>
      </div>
    </div>
  );
}
