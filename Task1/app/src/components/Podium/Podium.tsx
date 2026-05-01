import type { Member } from "../../types";
import { PodiumCard } from "./PodiumCard";

interface PodiumProps {
  members: Member[];
}

export function Podium({ members }: PodiumProps) {
  if (members.length < 3) return null;

  const [first, second, third] = members;

  return (
    <div className="flex flex-col items-center">
      {/* Cards row */}
      <div className="flex items-end justify-center gap-4 w-full">
        <div className="flex-1 flex flex-col items-center">
          <PodiumCard member={second} rank={2} />
        </div>
        <div className="flex-1 flex flex-col items-center">
          <PodiumCard member={first} rank={1} />
        </div>
        <div className="flex-1 flex flex-col items-center">
          <PodiumCard member={third} rank={3} />
        </div>
      </div>
      {/* Podium blocks */}
      <div className="flex w-full items-end justify-center gap-2 mt-2">
        <div className="flex-1 flex h-28 items-start justify-center rounded-t-xl bg-blue-100/60 pt-4">
          <span className="text-6xl font-bold text-blue-200">2</span>
        </div>
        <div className="flex-1 flex h-40 items-start justify-center rounded-t-xl bg-yellow-100/60 pt-4">
          <span className="text-6xl font-bold text-yellow-300">1</span>
        </div>
        <div className="flex-1 flex h-24 items-start justify-center rounded-t-xl bg-blue-100/40 pt-4">
          <span className="text-6xl font-bold text-blue-200">3</span>
        </div>
      </div>
    </div>
  );
}
