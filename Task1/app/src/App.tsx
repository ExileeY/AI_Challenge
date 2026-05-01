import "./App.css";
import { FilterBar } from "./components/FilterBar/FilterBar";
import { Podium } from "./components/Podium/Podium";
import { LeaderboardList } from "./components/LeaderboardList/LeaderboardList";
import { useLeaderboardStore } from "./store/leaderboardStore";
import { useFilteredMembers } from "./hooks/useFilteredMembers";

function App() {
  const filters = useLeaderboardStore((s) => s.filters);
  const members = useFilteredMembers(filters);

  const top3 = members.slice(0, 3);
  const rest = members.slice(3);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">
        Company Leaderboard
      </h1>

      {/* Filter Bar */}
      <section className="mb-8">
        <FilterBar />
      </section>

      {/* Podium - Top 3 */}
      {top3.length >= 3 && (
        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          <Podium members={top3} />
        </section>
      )}

      {/* Leaderboard List */}
      <section>
        <LeaderboardList members={rest} />
      </section>
    </div>
  );
}

export default App;

