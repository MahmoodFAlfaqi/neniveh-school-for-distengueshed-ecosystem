# School Community Ecosystem - Design Guidelines

## Design Approach

**Selected Approach:** Reference-Based (Social Platform)

**Primary References:** Instagram (social feed), Discord (community sections), Duolingo (gamification), Linear (clean UI hierarchy)

**Key Principles:**
- Clear visual hierarchy separating admin/student/teacher roles
- Gamification elements that feel rewarding, not gimmicky
- Community-focused layouts prioritizing content discovery
- Trust-building through credible design patterns

---

## Typography

**Font Stack:**
- Primary: Inter (via Google Fonts CDN)
- Accent: Space Grotesk for ranks/badges (via Google Fonts CDN)

**Hierarchy:**
- Hero/Page Titles: text-4xl to text-5xl, font-bold
- Section Headers: text-2xl to text-3xl, font-semibold
- Card Titles: text-lg, font-semibold
- Body Text: text-base, font-normal
- Captions/Meta: text-sm, font-medium
- Admin Labels: text-sm, font-bold, tracking-wide, uppercase

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24

**Container Strategy:**
- Main content: max-w-7xl mx-auto px-4
- News feed: max-w-3xl mx-auto (optimal reading width)
- Sidebar panels: w-80 fixed positioning
- Admin dashboard: Full-width grid layouts

**Grid Patterns:**
- News Feed: Single column, gap-6
- Stats/Leaderboards: 3-column grid (lg:grid-cols-3 md:grid-cols-2)
- Event Cards: 2-column grid (lg:grid-cols-2)
- Teacher Profiles: 4-column grid (lg:grid-cols-4 md:grid-cols-2)

---

## Core Components

### Navigation & Header
- Fixed top navigation bar with school branding left, user profile/notification bell right
- Three-tier scope selector (Global → Stage → Section) as prominent segmented control below header
- Search bar with dropdown for filtering by content type
- Admin users get gold 3px border on avatar with subtle glow effect

### News Feed Cards
- White/dark cards with rounded-xl corners, shadow-md
- Author info bar: Avatar (w-10 h-10, rounded-full) + Name + Timestamp + Credibility badge
- Post content area with generous padding (p-6)
- Interaction bar: Like, Comment, Share icons (Heroicons outline) with counts
- Credibility indicator: Small pill badge (High/Medium/Low) next to author name

### Admin Distinction
- Gold 4px border on all admin UI elements (border-amber-400)
- Admin posts: Slightly larger card with gold left border accent
- Admin avatars: Double ring effect (outer gold, inner white/dark)
- Special "Admin" badge with crown icon next to username

### Access Code Interface
- Modal overlay (backdrop-blur-sm) for code entry
- Large centered input field (text-2xl, tracking-widest, font-mono)
- Visual feedback: Green checkmark animation on success, saved "Digital Key" icon appears in user's key collection
- Key collection display: Small badge icons showing unlocked scopes in user profile dropdown

### Gamification Elements
- Reputation score: Large circular progress indicator with score in center
- Rank badge: Shield/medal shaped element with rank title below user avatar
- Stats card: Card layout showing score, rank, badges earned (icons from Heroicons)
- Leaderboard: Gradient ranking list, top 3 users get podium treatment with different heights

### Events System
- Calendar grid view with color coding (curricular = blue accent, extracurricular = purple accent)
- Event cards: Image thumbnail + Title + Date/Time + RSVP count + Category badge
- RSVP button: Toggle state with attendee count

### Schedule Grid
- Table layout with period headers (columns) and day headers (rows)
- Editable cells with teacher name + subject display
- Hover state reveals "Edit" icon (only for key holders)
- Lock icon for cells requiring Section Key

### Teacher Profiles
- Card-based grid with teacher photo, name, subjects taught
- Expandable section for classroom rules (icon list)
- Star rating display (read-only for students, 5-star system)
- Review section with moderation pending badge for unreviewed content

### Admin Handover Modal
- Full-screen overlay with warning/confirmation UI
- Two-step confirmation: Select successor from dropdown, then confirm button
- Visual transition animation showing privilege transfer
- Success state with "You are now Alumni" message

### User Stats Card (Profile Click)
- Modal/slide-out panel design
- Three prominent metrics at top: Reputation Score, Rank, Total Badges
- Badge showcase grid below
- NO personal info displayed (hide phone, transport fields entirely)

---

## Responsive Behavior

**Mobile (base to md):**
- Stack all grids to single column
- Fixed bottom navigation with 4 icons (Home, Events, Profile, Menu)
- Collapsible sidebar converts to slide-out drawer
- Schedule grid becomes horizontal scroll table

**Tablet (md to lg):**
- 2-column grids for most content
- Persistent left sidebar (280px) for navigation

**Desktop (lg+):**
- 3-4 column grids where appropriate
- Dual sidebar layout: Left nav + Right activity panel
- Sticky headers for feed scrolling

---

## Images

**Hero Image:** No traditional hero section. This is a functional dashboard/feed-first application.

**Profile Images:**
- User avatars throughout (teachers, students, admins)
- Placeholders: Abstract gradient circles with user initials

**Event Images:**
- Event cards should include thumbnail images (16:9 aspect ratio)
- Fallback: Category-based gradient backgrounds with icon overlay

**Teacher Profile Photos:**
- Professional headshot style, rounded-xl with subtle border
- Consistent sizing across grid (w-full aspect-square object-cover)

**Post Media:**
- Image posts: Constrained max height (max-h-96) with rounded-lg borders
- Gallery posts: Grid layout for multiple images

---

## Accessibility

- All interactive elements have min touch target 44px
- Form inputs include visible labels and placeholder text
- Focus states: 2px ring offset with brand color
- Screen reader labels for icon-only buttons
- Consistent tab order following visual hierarchy
- Credibility/reputation indicators include text labels, not just colors

---

## Theme Toggle

- Sun/Moon icon toggle in header (Heroicons)
- Dark mode: Invert backgrounds, maintain contrast ratios
- Admin gold accent remains consistent across themes
- Smooth transition on theme change (transition-colors duration-200)