# School Community Ecosystem

## Overview

This project is a social platform designed for students, teachers, and administrators within a school environment. Its primary purpose is to create a gamified community experience, leveraging a reputation-based access control system. Key capabilities include news feeds, event management with RSVP, class schedules, teacher profiles with review functionality, and a comprehensive gamification system featuring credibility scores and reputation rankings. The platform aims to foster engagement, streamline school communications, and enhance community interaction through a structured and rewarding digital environment.

## User Preferences

Preferred communication style: Simple, everyday language.

## Design System - Modern & Premium Overhaul (November 2025)

### Visual Identity

**Color Palette (Updated - Modern & Vibrant):**
- **Primary**: Rich purple (270° 73% 56%) with bright accent variants for dark mode
- **Secondary**: Vibrant teal (199° 89% 48%) - energetic and fresh
- **Accent**: Warm coral (14° 100% 57%) - highlights and calls-to-action
- **Backgrounds**: Soft, subtle gradients in light mode; sophisticated deep tones in dark mode
- **Shadows**: Colored shadows using primary color for cohesive elevation effects

**Typography:**
- **Primary Font**: Inter (400-700 weights) for clean, modern readability
- **Accent Font**: Outfit for headlines and badges for premium feel
- **Hierarchy**: Clear 5-level text hierarchy (H1-5, body, captions)
- **Letter Spacing**: Generous tracking on labels for professional appearance

**Design Elements:**
- **Border Radius**: Consistent 0.875rem (14px) for modern, rounded aesthetic
- **Elevation System**: Multi-layer shadows with color tints for depth perception
- **Glassmorphism**: Backdrop blur effects on cards, modals, and headers for premium feel
- **Gradients**: Applied to backgrounds, buttons, badges, and accent elements
- **Animation**: Smooth 300ms transitions for hover/active states

### Component Library

**Navigation:**
- Sticky header with backdrop blur and semi-transparent background
- Gradient accent sidebar with logo branding
- Active state highlighted with gradient background
- Admin items distinguished with amber/gold gradient

**Cards & Containers:**
- Rounded corners with subtle colored shadows
- Hover elevation with smooth transform (translateY)
- Gradient fills on stat cards for visual impact
- Accessible spacing and padding (p-6 to p-8)

**Buttons & Interactive Elements:**
- Gradient backgrounds for primary actions
- Smooth hover elevation and scale effects
- Badge styling with semi-transparent backgrounds
- Focus rings with high contrast for accessibility

**Forms & Inputs:**
- Clean input design with subtle backgrounds
- Rounded corners matching system radius
- Proper label hierarchy and spacing
- Validation states with clear visual feedback

### Modern Design Principles Applied

1. **Hierarchy & Clarity**: Content organized by importance with clear visual separation
2. **Whitespace & Breathing Room**: Generous spacing prevents visual clutter
3. **Consistency**: Unified design language across all pages
4. **Dark/Light Harmony**: Both modes carefully crafted with proper contrast and color mapping
5. **Micro-interactions**: Subtle animations provide feedback without distraction
6. **Accessibility First**: All components meet WCAG standards with proper touch targets

### Home Page Redesign Features

- Hero section with gradient accent bar
- 4-column stat card grid showcasing user metrics
- Modern card design with gradient backgrounds
- Quick action cards for fast navigation
- Mini calendar with event indicators
- Featured news section with improved card styling
- Comprehensive visual hierarchy

### Layout & Spacing

**Responsive Breakpoints:**
- Mobile: Full-width single-column layouts
- Tablet (md): 2-column grids emerge
- Desktop (lg+): Multi-column dashboards with full UI utilization

**Spacing Scale:**
- Small: 0.5rem gaps
- Medium: 1rem gaps  
- Large: 1.5rem gaps
- X-Large: 2-3rem gaps for section separation

**Container Strategy:**
- Max-width: 7xl (80rem) for main content
- Generous padding: px-6 lg:px-8
- Page sections: py-8 lg:py-12

## System Architecture

### Frontend Architecture

The frontend is built with React and TypeScript, using Vite for fast development and bundling. It utilizes Shadcn UI, based on Radix UI primitives, for a component-driven design with Tailwind CSS for styling. **The design has undergone a comprehensive modern overhaul featuring vibrant colors, sophisticated elevation systems, glassmorphic effects, and smooth animations while preserving full dark/light mode functionality.** State management is handled by TanStack Query for server state and React hooks for local component state, with Wouter providing lightweight client-side routing.

### Backend Architecture

The backend is developed with Node.js and Express, featuring a RESTful API design categorized by domain (e.g., `/api/auth`, `/api/posts`, `/api/events`). Authentication uses session-based `express-session` with bcrypt for password hashing and role-based access control. A storage abstraction layer separates business logic from database implementation.

### Database Architecture

Drizzle ORM with a PostgreSQL dialect is used for database interactions. The schema includes tables for `Users` (with roles, gamification scores, account status, and 15 peer-ratable performance metrics), `Scopes` (defining access boundaries for global, stage, and section levels), `DigitalKeys` (persisting unlocked scopes per user), `Posts`, `Events`, `Schedules`, `Teachers` (with a review system), `PeerRatings` (storing student-to-student performance evaluations), `ProfileComments` (enabling peer feedback on profiles), `PostReactions` (tracking post likes), and `Settings` (for app configuration like donation URLs). Relationships between entities support the platform's features, such as user-generated content, event participation, teacher evaluations, peer assessments, and social interactions.

### Key Architectural Decisions

-   **Access Code Pattern**: A system of "Secret Access Codes" and "Digital Keys" manages content creation and access within different school scopes (global, grade, class), providing a user-friendly and scalable access control mechanism.
-   **Credibility & Reputation Engine**: A dual-score system (credibility for content quality, reputation for overall contribution) incentivizes positive participation and prevents misuse, with automatic account status adjustments.
-   **Admin Succession Protocol**: A one-click handover mechanism for admin privileges ensures continuity and prevents accumulation of high-level access.
-   **Session-Based Authentication**: Chosen for its simplicity and security benefits, utilizing HttpOnly cookies and a 7-day expiration.
-   **Monorepo Structure**: The project is organized as a monorepo (`/client`, `/server`, `/shared`) to enable type safety across the full stack and maintain a single source of truth for shared code.
-   **Peer Rating System**: Students can rate each other on 15 performance metrics (1-5 stars), with ratings aggregated and displayed on user profiles. Self-rating is prevented at both UI and API levels.
-   **Profile Social Features**: Profile comments allow peer feedback, and user avatars/names are clickable links throughout the app for easy profile navigation.
-   **Server-Authoritative Social Interactions**: Post likes are tracked server-side with `isLikedByCurrentUser` included in posts queries, ensuring the backend is the single source of truth. The frontend reflects this state without local drift. Counter updates use safeguards (`GREATEST`) to prevent negative values.
-   **Support System**: Configurable donation URL system allows admins to set external fundraising/support links without storing sensitive payment information on the platform.
-   **Modern Design System**: Comprehensive UI/UX overhaul with vibrant color palette, glassmorphic effects, smooth animations, and premium spacing while maintaining accessibility standards.

## External Dependencies

-   **Database**: Neon Serverless PostgreSQL is used for data storage, including WebSocket support and connection pooling.
-   **UI Library**: Radix UI primitives and Shadcn UI for accessible and customizable UI components.
-   **Form Handling**: React Hook Form combined with Zod for robust form management and schema validation.
-   **Styling**: Tailwind CSS, PostCSS, `class-variance-authority`, and `clsx`/`tailwind-merge` for efficient and maintainable styling with modern design tokens.
-   **Development Tools**: TypeScript, Drizzle Kit for migrations, ESBuild for server bundling, and Vite plugins for development enhancements.
-   **Fonts**: Google Fonts (Inter, Outfit) via CDN for modern typography.
-   **Session Storage**: `express-session` with `connect-pg-simple` for PostgreSQL-backed persistent session storage.

## Recent Changes (November 22, 2025)

1. **Color System Overhaul**: Updated index.css with modern vibrant colors (purple, teal, coral) for both light and dark modes
2. **Home Page Redesign**: Completely redesigned with 4-stat card grid, hero section, quick actions, modern calendar preview, and featured news section
3. **Sidebar Enhancement**: Added gradient branding, modern navigation styling, admin distinction with golden accents
4. **Header Styling**: Sticky header with backdrop blur, gradient backgrounds, modern typography
5. **Design System**: Implemented glassmorphism, colored shadows, smooth transitions, and premium spacing throughout
6. **Dark/Light Mode**: All changes preserve and enhance both theme modes with proper color mapping and contrast
