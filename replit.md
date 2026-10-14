# School Community Ecosystem

## Overview

This project is a social platform designed for students, teachers, and administrators within a school environment. Its primary purpose is to create a gamified community experience, leveraging a reputation-based access control system. Key capabilities include news feeds, event management with RSVP, class schedules, teacher profiles with review functionality, and a comprehensive gamification system featuring credibility scores and reputation rankings. The platform aims to foster engagement, streamline school communications, and enhance community interaction through a structured and rewarding digital environment with a strong business vision for enhancing educational community interaction and potential market growth.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions

The platform features a modern and premium design, incorporating a vibrant color palette (rich purple, vibrant teal, warm coral), Inter and Outfit typography, and consistent design elements like 0.875rem border radii. It utilizes an elevation system with colored shadows, glassmorphism effects, and smooth 300ms animations. Key design principles include clear hierarchy, generous whitespace, consistency, dark/light mode harmony, micro-interactions, and accessibility. The home page features a hero section, 4-column stat card grid, quick action cards, a mini calendar, and a featured news section. Responsive design is implemented with breakpoints for mobile, tablet, and desktop, using a defined spacing scale and container strategy.

**Navigation Controls:** A menu button in the header opens the sidebar (on phones it opens as a drawer that closes after navigating). Ctrl/Cmd+B toggles it on desktop. The Tab key is left for normal keyboard navigation.

### Technical Implementations

The frontend is built with React, TypeScript, and Vite, utilizing Shadcn UI (based on Radix UI) with Tailwind CSS for styling. State management is handled by TanStack Query for server state and React hooks for local state, with Wouter for client-side routing. The backend uses Node.js and Express, providing a RESTful API. Drizzle ORM with a PostgreSQL dialect manages database interactions. The project is structured as a monorepo (`/client`, `/server`, `/shared`) for full-stack type safety.

### Feature Specifications

-   **Navigation**: Sticky header with backdrop blur, gradient accent sidebar, distinguished admin items.
-   **Cards & Containers**: Rounded corners, colored shadows, hover elevation, gradient fills on stat cards.
-   **Buttons & Interactive Elements**: Gradient backgrounds, smooth hover effects, badge styling, accessible focus rings.
-   **Forms & Inputs**: Clean design, rounded corners, proper label hierarchy, validation states.
-   **News & Posts**: Public square posts visible to all users on news page; scope-specific posts only visible to users with access to that scope. Scope selector allows filtering by public square, grade scopes, or class section scopes. Public square is the default scope on news page.
-   **Teacher Management**: Teachers can be assigned to multiple subjects and sections. Only admins assign subjects and sections (also after a teacher claims the profile); teachers edit their own personal fields. Teacher registration codes and admin notes are only visible to admins.
-   **Schedule Auto-Population**: In the schedule page (Sunday-Thursday school week), when a subject is selected, the teacher dropdown auto-populates with only teachers who teach that subject in the user's class section. Teacher is automatically cleared when subject changes.
-   **Authentication System**: Three-tier system for Admins, Students, and Visitors.
    -   **Admin Auth**: Requires the admin sign-up code (starts as the original code; the owner can change it on the Admin page), unique credentials, separate UI flow, 7-day persistent login.
    -   **Owner**: The first admin to sign in becomes the owner. Only the owner can promote/demote/delete admins, change other admins' classes, hand over the admin role (ownership moves with it), and change the admin sign-up code. Stored in the `settings` table (`ownerUserId`).
    -   **Passwords**: Any signed-in user can change their password in Settings (signs out other remembered devices).
    -   **Admin Access & Classes**: Admins can open every grade and class scope without access codes. Admins can assign a grade/class to any admin (including themselves) and move students between classes from the Admin page. Students cannot change their own class.
    -   **Student Auth**: Standard username/password, 7-day persistent login, full account creation.
    -   **Visitor Access**: Session-only, read-only, single-click access with restricted UI.
        -   **Hidden from Visitors**: Profile card, Schedule/Calendar card, Community Highlights section on home page; Profile and Schedule links in sidebar.
        -   **Visible to Visitors**: Activity Status card, Quick Access card, all other navigation (Home, News, Grades, Events, Teachers, Settings, Support).
    -   **Security**: Failed login tracking on all login forms (3 attempts, 15-min lockout), minimum password length 8 everywhere, session id regenerated on login, suspended accounts are read-only until the ban expires, `remember-me` tokens with sliding expiration, HttpOnly cookies, PostgreSQL-backed sessions (30-day expiration, persists across server restarts).
    -   **Password Recovery**: Gmail-based email recovery system using nodemailer with SMTP. Three-step flow: request email → email sent confirmation → reset password. Token sent via email link, never exposed to frontend. Requires GMAIL_USER and GMAIL_APP_PASSWORD environment secrets. Token expiration: 1 hour.
-   **Admin Account Seeding**: Automatic creation of 2 admin accounts on server startup, configured via environment variables. Passwords are set only during initial creation and are NOT reset on subsequent server restarts (preserving admin password changes).

### System Design Choices

-   **Access Code Pattern**: "Secret Access Codes" and "Digital Keys" manage content creation and access within school scopes (global, grade, class).
-   **Credibility & Reputation Engine**: Dual-score system (credibility for content, reputation for contribution) with automatic account status adjustments.
-   **Admin Succession Protocol**: Handover card on the Admin page passes the admin role to a student (the current admin becomes a student).
-   **Session-Based Authentication**: Utilizes `express-session` with HttpOnly cookies and a 7-day expiration.
-   **Peer Rating System**: Students can rate peers on 15 performance metrics, aggregated on user profiles. Self-rating is prevented.
-   **Profile Social Features**: Profile comments for peer feedback, clickable avatars/names.
-   **Server-Authoritative Social Interactions**: Post likes tracked server-side, `isLikedByCurrentUser` included in queries, safeguards for counter updates.
-   **Support System**: Configurable donation URL system for external fundraising.
-   **Languages**: English and Arabic (right-to-left). Navigation, header and Settings are translated; strings live in `client/src/lib/i18n.tsx`. Other pages are still English.
-   **News Feed**: Loads 20 posts at a time, sorted on the server (`/api/posts?limit=&offset=&sort=`). Public-square posts stored with a NULL scope or the public scope id show in the same feed.

### Database Schema

Includes tables for `Users` (roles, gamification scores, peer-ratable metrics), `Scopes`, `DigitalKeys`, `Posts`, `Events`, `Schedules`, `Teachers` (with review system), `PeerRatings`, `ProfileComments`, `PostReactions`, `Settings`, `failed_login_attempts`, and `remember_me_tokens`.

**Scopes System:** Three-tier hierarchy with public square scope (always accessible), grade scopes (grades 1-6), and class section scopes (format: grade-section, e.g., "1-A"). Each non-public scope has a unique access code. Admin UI provides full CRUD capabilities with comprehensive validation:
- Public square: Always accessible scope with no access code required
- Grade scopes: 6 grades with unique access codes (e.g., gaDrIE5Lo0, SolELo74F)
- Class scopes: 30 sections across 6 grades (5 sections per grade: A-E) with unique codes (e.g., jtKJdrDS9K, HJdr3cVj90p)
- Referential integrity: Cannot delete grade scopes while child sections exist; cannot delete scopes with users, posts, events, or schedules
- Parent-child validation: Section scopes require parent grade scope to exist before creation
- Automatic seeding on server boot with safe duplicate-check logic (1 public + 6 grades + 30 sections = 37 total scopes)

## External Dependencies

-   **Database**: Neon Serverless PostgreSQL (with WebSocket support and connection pooling).
-   **UI Library**: Radix UI primitives and Shadcn UI.
-   **Form Handling**: React Hook Form with Zod.
-   **Styling**: Tailwind CSS, PostCSS, `class-variance-authority`, `clsx`, `tailwind-merge`.
-   **Development Tools**: TypeScript, Drizzle Kit, ESBuild, Vite plugins.
-   **Fonts**: Google Fonts (Inter, Outfit) via CDN.
-   **Session Storage**: `express-session` with `connect-pg-simple`.
-   **Email Service**: nodemailer with Gmail SMTP for password recovery emails.