## UI Task: Implement Top 3 Leaderboard (Podium Layout)

Improve the "Top 3 leaderboard" UI exactly as shown in the reference image.

---

## Layout Structure

- Create a horizontal layout with **3 user blocks**:
  - Center: Rank #1 (primary, highlighted)
  - Left: Rank #2
  - Right: Rank #3

- The center (#1) item must be:
  - Visually larger
  - More prominent than #2 and #3

---

## Each User Block

Each block should contain (top to bottom):

1. **Avatar**
   - Circular
   - Center aligned

2. **User Name**
   - Bold text
   - Center aligned

3. **User Role**
   - Smaller, muted text
   - Center aligned

4. **Score Badge**
   - Pill-shaped container
   - Contains:
     - Star icon
     - Score value
   - Center aligned

5. **Rank Card**
   - Large rectangular card with rounded corners
   - Contains a large, semi-transparent rank number (1, 2, or 3)

---

## Styling Details

### Rank #1 (Center)
- Background: **gold gradient**
- Subtle glow or elevation (soft shadow)
- Larger size than others
- Score badge:
  - Yellow/gold background
  - Darker text

### Rank #2 and #3
- Background: **light gray/blue**
- Lower visual emphasis
- Same layout but smaller
- Score badge:
  - Blue background
  - White or dark text

---

## Rank Number (inside cards)
- Very large font size
- Centered both vertically and horizontally
- Low opacity (faded look)

---

## Spacing & Alignment
- All elements must be **center-aligned**
- Consistent vertical spacing between:
  - Avatar
  - Name
  - Role
  - Badge
  - Card
- Equal horizontal spacing between the 3 blocks

---

## Constraints
- Reuse existing design tokens (colors, spacing, radius, shadows)
- Do NOT introduce new arbitrary styles
- Keep implementation clean and component-based
- Ensure responsiveness (should adapt to smaller screens)

---

## Expected Result
- Pixel-accurate match to the reference
- Clear visual hierarchy:
  - #1 stands out immediately
  - #2 and #3 are secondary but consistent