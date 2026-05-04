# Claude Code Dev Plan: Leader Board Redesign

## Goal

Fully redesign the **Leader Board** feature according to the provided mockups (@thoughts/mockups/EXPECTED).

The final result should match the mockups as closely as possible while preserving existing functionality.

---

## Context

The current leaderboard UI has several issues:

- The list is currently wrapped inside a section/container.
- The list starts from the 4th place because the top 3 users are displayed separately.
- Card styles do not match the new mockups.
- Total score styling does not match the mockups.
- Icons do not match the mockups.

---

## Main Requirements

### 1. Redesign the Leader Board UI

Refactor the existing leaderboard feature to match the provided mockups.

Focus on:

- Layout
- Spacing
- Card structure
- Typography
- Colors
- Border radius
- Shadows
- Icons
- Score display
- Responsive behavior

Do not redesign creatively. Replicate the mockups.

---

## Acceptance Criteria

### Display

- The leaderboard list should no longer be wrapped into a separate section-style container.
- The leaderboard should be displayed as **infinite-scrolled cards**.
- The list should start from the **1st place**, not from the 4th.
- Top users should still appear in the list unless the mockup explicitly separates them.
- Rankings should be continuous and correct:
  - 1st place
  - 2nd place
  - 3rd place
  - 4th place
  - etc.

### Styles

- Each leaderboard card should match the provided mockups.
- The total score should use the same styling as shown in the mockups.
- Icons should match the mockups exactly.
- Existing design tokens, variables, and shared styles should be reused where possible.
- Avoid introducing unnecessary custom styles.

---

## Implementation Plan

### Step 1: Inspect Existing Leaderboard Code

Find all files related to the leaderboard feature.

Look for:

- Main leaderboard page/component
- Top 3 users component
- User list component
- User card component
- Score display component
- Filter/search components
- Infinite scroll logic
- Existing icon usage

Before editing, understand:

- Where leaderboard data is fetched
- How users are sorted
- Where top 3 users are sliced out
- Why the list currently starts from 4th place
- How pagination or infinite scroll currently works

---

### Step 2: Fix Data Display Logic

Update the leaderboard rendering logic so that the card list starts from the first user.

Current likely behavior:

```ts
const topUsers = users.slice(0, 3)
const listUsers = users.slice(3)
