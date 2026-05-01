# T1 — Development Plan: Company Leaderboard Client

## Summary of Decisions

| Area | Decision |
|------|----------|
| Data source | Mock JSON file (static, bundled) |
| Categories | From mockups: Education, Public Speaking, University Partners, etc. |
| Expandable rows | Yes — show Recent Activity details |
| Styling | Tailwind CSS |
| State management | Zustand |
| Large dataset handling | Virtualization (react-window) |

---

## Data Model

```ts
interface Member {
  id: string;
  name: string;
  role: string;       // e.g. "Senior Software Engineer"
  teamCode: string;   // e.g. "SK.U1.D1.G1"
  avatar: string;     // URL or path
  totalScore: number;
  activities: Activity[];
}

interface Activity {
  id: string;
  name: string;
  category: Category;
  date: string;       // ISO date
  points: number;
}

type Category = "Education" | "Public Speaking" | "University Partners";

type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

interface Filters {
  year: number | null;       // null = All Years
  quarter: Quarter | null;   // null = All Quarters
  category: Category | null; // null = All Categories
  search: string;
}
```

---

## Architecture

```
src/
├── main.tsx
├── App.tsx
├── data/
│   └── members.json          # Static mock dataset (~100+ entries)
├── store/
│   └── leaderboardStore.ts   # Zustand store (filters, derived rankings)
├── components/
│   ├── Layout/
│   │   └── Header.tsx
│   ├── FilterBar/
│   │   ├── FilterBar.tsx
│   │   ├── DropdownFilter.tsx
│   │   └── SearchInput.tsx
│   ├── Podium/
│   │   ├── Podium.tsx
│   │   └── PodiumCard.tsx
│   └── LeaderboardList/
│       ├── LeaderboardList.tsx    # Virtualized list container
│       ├── LeaderboardRow.tsx     # Single row (collapsed)
│       └── ActivityDetail.tsx     # Expanded row content
├── hooks/
│   ├── useFilteredMembers.ts     # Derived filtered + sorted data
│   └── useActivityStats.ts       # Compute icon counts per member
├── types/
│   └── index.ts
└── utils/
    ├── scoring.ts                # Rank computation helpers
    └── filters.ts                # Filter logic
```

---

## Implementation Phases

### Phase 1 — Project Setup & Foundations
1. Install dependencies: `tailwindcss`, `zustand`, `react-window`
2. Configure Tailwind CSS with Vite
3. Define TypeScript types (`types/index.ts`)
4. Create mock data JSON (~100 members with activities)

### Phase 2 — State Management
5. Implement Zustand store with filter state + actions
6. Implement `useFilteredMembers` hook (filter, search, sort, rank)

### Phase 3 — Filter Bar
7. Build `DropdownFilter` component (reusable select)
8. Build `SearchInput` component (debounced text input)
9. Assemble `FilterBar` — wire to Zustand store

### Phase 4 — Podium (Top 3)
10. Build `PodiumCard` component (avatar, badge, name, role, score)
11. Build `Podium` layout (center-left-right podium arrangement)

### Phase 5 — Leaderboard List
12. Build `LeaderboardRow` component (rank, avatar, name, role, icons, score, chevron)
13. Build `ActivityDetail` component (expanded table: activity, category pill, date, points)
14. Integrate `react-window` for virtualized scrolling
15. Wire expand/collapse logic

### Phase 6 — Integration & Polish
16. Assemble full page layout in `App.tsx`
17. Handle empty states (no results found)
18. Responsive styling adjustments
19. Performance verification with full dataset

---

## Key UX Details (from mockups)

- **Podium order**: 2nd (left) → 1st (center, tallest) → 3rd (right)
- **Rank badges**: Gold (#1), Silver (#2), Bronze (#3) circular badges on avatar
- **Score display**: Star icon + score number in a pill/badge
- **List row**: Rank number | Avatar | Name + Role (team code) | Activity type icons with counts | "TOTAL" label + star score | Expand chevron
- **Expanded detail**: "RECENT ACTIVITY" header, table with columns: Activity, Category, Date, Points
- **Category pills**: Rounded gray badges (e.g., "Public Speaking", "Education")
- **Search**: Placeholder "Search employee..."
- **Filters default**: "All Years", "All Quarters", "All Categories"

---

## Dependencies to Install

```json
{
  "tailwindcss": "^4",
  "@tailwindcss/vite": "^4",
  "zustand": "^5",
  "react-window": "^1.8",
  "@types/react-window": "^1.8"
}
```
