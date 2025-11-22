# School Community Ecosystem - Updated Design Guidelines

## Design Approach

**Selected Approach:** Reference-Based (Premium Social Platform)

**Primary References:** 
- Instagram (social feed elegance)
- Discord (community hierarchy)
- Notion (modern card UI)
- Linear (sophisticated minimalism)
- Stripe (premium polish)

**Core Principles:**
- Elevated aesthetics with functional clarity
- Layered depth through glassmorphism and shadows
- Fluid transitions creating premium feel
- Role distinction through subtle visual cues, not heavy borders

---

## Typography

**Font Stack:**
- Primary: Inter (400, 500, 600, 700) via Google Fonts CDN
- Accent: Outfit (500, 600, 700) for headlines/badges via Google Fonts CDN

**Hierarchy:**
- Hero/Dashboard Titles: text-5xl lg:text-6xl, font-bold (Outfit)
- Page Headers: text-3xl lg:text-4xl, font-semibold (Outfit)
- Section Headers: text-xl lg:text-2xl, font-semibold (Inter)
- Card Titles: text-lg font-semibold (Inter)
- Body Text: text-base font-normal leading-relaxed (Inter)
- Captions: text-sm font-medium (Inter)
- Badges/Labels: text-xs font-bold tracking-wide uppercase (Outfit)

**Letter Spacing:**
- Headlines: tracking-tight
- Body: tracking-normal
- Labels: tracking-wider

---

## Layout System

**Spacing Primitives:** Tailwind units of 3, 4, 6, 8, 12, 16, 20, 24, 32

**Container Strategy:**
- Dashboard wrapper: max-w-[1920px] mx-auto px-6 lg:px-8
- Feed content: max-w-4xl mx-auto
- Sidebar panels: w-80 lg:w-96 (wider for premium feel)
- Modal overlays: max-w-2xl mx-auto

**Grid Patterns:**
- News Feed: Single column, gap-8
- Stats Dashboard: 4-column responsive (lg:grid-cols-4 md:grid-cols-2 gap-6)
- Event Cards: 2-column masonry-style (lg:grid-cols-2 gap-8)
- Leaderboard: Single column with ranking cards, gap-4
- Teacher Grid: 3-column (lg:grid-cols-3 md:grid-cols-2 gap-8)

**Padding Standards:**
- Cards: p-6 lg:p-8
- Modals: p-8 lg:p-12
- Sections: py-12 lg:py-16
- Page containers: px-6 lg:px-8

---

## Core Components

### Navigation & Header
- Sticky top nav with backdrop blur (backdrop-blur-lg)
- Semi-transparent background with subtle shadow
- Logo/branding left, scope selector center, profile/notifications right
- Three-tier scope pills: Interactive segmented control with sliding indicator animation
- Search expands on focus with smooth width transition
- Admin avatars: Subtle animated glow ring (animate-pulse-slow)

### News Feed Cards
- Elevated cards: rounded-2xl with multi-layer shadow (shadow-lg shadow-xl on hover)
- Hover lift effect: transform transition with slight scale (hover:scale-[1.02])
- Author bar: Avatar (w-12 h-12 rounded-full with ring) + Name + Timestamp in flex layout
- Glassmorphic credibility badge floating top-right
- Rich media support: Full-bleed images with rounded-t-2xl, aspect-video
- Interaction bar: Icon buttons with counter badges, hover scale effect
- Smooth expansion for comments section

### Admin Interface Elements
- Premium badge system: Animated gradient badges instead of heavy borders
- Admin posts: Subtle accent glow on card edge
- Admin panel: Dedicated dashboard with glassmorphic sidebar
- Crown icon badge with gradient fill next to admin names
- Elevated z-index cards for admin announcements

### Access Code Modal
- Full-screen overlay with backdrop-blur-2xl
- Centered glassmorphic card (rounded-3xl)
- Large monospace input with animated underline
- Success: Checkmark animation with confetti micro-interaction
- Digital key appears in animated slide-in drawer showing unlocked scopes
- Key collection: Icon grid in profile dropdown with unlock animations

### Gamification Dashboard
- Hero stats section: Large circular progress rings with gradient strokes
- Reputation score: Animated counting on page load
- Rank badge: 3D-style shield with gradient overlay and shadow depth
- Achievement showcase: Glassmorphic card grid with hover reveal animations
- Progress bars: Gradient-filled with smooth transition animations
- Leaderboard: Cards with position numbers, top 3 with podium-height variation and special treatments

### Events System
- Calendar: Grid with glassmorphic date cells, current day highlighted
- Event cards: Image header (aspect-video) + glassmorphic content overlay at bottom
- Category pills: Rounded-full badges with semi-transparent backgrounds
- RSVP button: Toggle with smooth color transition and attendee count animation
- Event detail modal: Full-bleed image hero with glassmorphic content section

### Schedule Grid
- Premium table design with rounded corners and cell borders
- Period/day headers with semi-transparent backgrounds
- Hover state: Cell highlight with smooth transition
- Edit mode: Inline editor with glassmorphic dropdown
- Teacher names clickable with underline animation on hover
- Lock indicators: Small icon badges for restricted cells

### Teacher Profile Cards
- Vertical cards with rounded-2xl borders
- Photo: aspect-square rounded-t-2xl with gradient overlay at bottom
- Name/subject on glassmorphic overlay over photo
- Expandable rules section with smooth accordion animation
- Star rating: Large interactive stars with fill animation
- Review modal: Glassmorphic overlay with review cards

### User Stats Panel
- Slide-in panel from right (translate-x animation)
- Glassmorphic background with backdrop blur
- Three metric cards at top with gradient backgrounds
- Badge grid below with stagger animation on panel open
- Achievement timeline with connecting lines and milestone markers

---

## Visual Treatment

### Glassmorphism Implementation
- Cards: backdrop-blur-md with semi-transparent backgrounds
- Overlays: backdrop-blur-xl for modals and dropdowns
- Navigation: backdrop-blur-lg with subtle border
- Sidebar panels: backdrop-blur-sm with gradient overlay

### Shadow Strategy
- Resting cards: shadow-lg with subtle spread
- Hover elevation: shadow-2xl with increased blur
- Modals: shadow-[0_25px_50px_-12px] for depth
- Floating elements: shadow-xl with colored shadow tints

### Border Radius Hierarchy
- Cards: rounded-2xl
- Buttons: rounded-xl
- Badges/Pills: rounded-full
- Modals: rounded-3xl
- Images: rounded-xl (nested in cards use rounded-t-2xl)

### Animation Specifications
- Transitions: transition-all duration-300 ease-in-out (default)
- Hover scales: hover:scale-[1.02] or hover:scale-105
- Micro-interactions: 150ms for button states
- Page transitions: 500ms for route changes
- Loading states: Skeleton screens with shimmer gradient animation
- Success states: Checkmark with scale + opacity animation (300ms)

### Gradient Applications
- Background accents: Subtle radial gradients on sections
- Badge fills: Linear gradients for ranks/achievements
- Button hovers: Gradient shift on interaction
- Stat visualizations: Multi-color gradient progress indicators
- Card overlays: Gradient masks on images

---

## Images

### Profile Images
- User avatars: Circular (rounded-full) with ring borders throughout interface
- Teacher photos: Professional headshots, aspect-square, rounded-xl
- Placeholder: Gradient backgrounds with user initials in Outfit font
- Admin avatars: Animated gradient ring with subtle pulse

### Content Images
- Feed posts: Full-width images, aspect-video or aspect-square, rounded-xl
- Event cards: Hero images aspect-video with glassmorphic content overlay
- Image galleries: Masonry grid with staggered heights, gap-4

### Decorative Elements
- Background: Subtle gradient mesh patterns
- Empty states: Illustrated icons (Heroicons) with gradient fills
- Achievement badges: Icon-based designs with gradient overlays

**Hero Image:** No traditional hero. Dashboard-first application with stats cards and feed taking priority.

---

## Responsive Behavior

**Mobile (base to md):**
- Single column layouts with full-width cards
- Bottom navigation: 4 glassmorphic pill buttons with icons
- Reduced padding (p-4 instead of p-6)
- Smaller shadows and border radius
- Collapsible sections for schedules/leaderboards

**Tablet (md to lg):**
- 2-column grids emerge
- Side navigation converts to slide-out drawer with glassmorphic overlay
- Maintain generous spacing

**Desktop (lg+):**
- Multi-column dashboards (3-4 columns for stats)
- Persistent dual sidebar layout (left nav + right activity feed)
- Sticky navigation and section headers
- Expanded card sizes with more padding

---

## Accessibility

- Focus rings: 3px offset rings with high contrast
- Touch targets: Minimum 48px for all interactive elements
- Motion: Respect prefers-reduced-motion for animations
- Contrast: Maintain WCAG AAA for text, AA for UI elements
- Screen readers: Aria labels for all icon buttons and status indicators
- Keyboard navigation: Tab order follows visual hierarchy, focus indicators on all interactive elements