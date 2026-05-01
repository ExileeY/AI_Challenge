import type { Member } from "../../types";
import { PodiumCard } from "./PodiumCard";

interface PodiumProps {
  members: Member[];
}

export function Podium({ members }: PodiumProps) {
  if (members.length < 3) return null;

  const [first, second, third] = members;

  return (
    <div className="flex items-end justify-center gap-6 py-8">
      <PodiumCard member={second} rank={2} />
      <PodiumCard member={first} rank={1} />
      <PodiumCard member={third} rank={3} />
    </div>
  );
}
