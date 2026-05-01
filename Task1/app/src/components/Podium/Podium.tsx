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
      {/* Cards row - aligned to bottom so #1 appears higher */}
      <div className="flex items-end justify-center gap-6 w-full">
        {/* Rank #2 - Left */}
        <div className="flex-1 flex flex-col items-center gap-4">
          <PodiumCard member={second} rank={2} />
          <div className="w-full h-32 flex items-center justify-center rounded-2xl bg-blue-100/50 shadow-inner">
            <span className="text-8xl font-bold text-blue-200/70 select-none">2</span>
          </div>
        </div>

        {/* Rank #1 - Center (larger, gold) */}
        <div className="flex-1 flex flex-col items-center gap-4">
          <PodiumCard member={first} rank={1} />
          <div className="w-full h-44 flex items-center justify-center rounded-2xl bg-gradient-to-b from-yellow-100 to-yellow-200 border border-yellow-300 shadow-md shadow-yellow-200/50">
            <span className="text-9xl font-bold text-yellow-400/60 select-none">1</span>
          </div>
        </div>

        {/* Rank #3 - Right */}
        <div className="flex-1 flex flex-col items-center gap-4">
          <PodiumCard member={third} rank={3} />
          <div className="w-full h-28 flex items-center justify-center rounded-2xl bg-blue-100/40 shadow-inner">
            <span className="text-8xl font-bold text-blue-200/60 select-none">3</span>
          </div>
        </div>
      </div>
    </div>
  );
}
