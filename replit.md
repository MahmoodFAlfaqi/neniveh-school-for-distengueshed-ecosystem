# School Community Ecosystem

## Overview

This project is a social platform designed for students, teachers, and administrators within a school environment. Its primary purpose is to create a gamified community experience, leveraging a reputation-based access control system. Key capabilities include news feeds, event management with RSVP, class schedules, teacher profiles with review functionality, and a comprehensive gamification system featuring credibility scores and reputation rankings. The platform aims to foster engagement, streamline school communications, and enhance community interaction through a structured and rewarding digital environment with a strong business vision for enhancing educational community interaction and potential market growth.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions

The platform features a modern and premium design, incorporating a vibrant color palette (rich purple, vibrant teal, warm coral), Inter and Outfit typography, and consistent design elements like 0.875rem border radii. It utilizes an elevation system with colored shadows, glassmorphism effects, and smooth 300ms animations. Key design principles include clear hierarchy, generous whitespace, consistency, dark/light mode harmony, micro-interactions, and accessibility. The home page features a hero section, 4-column stat card grid, quick action cards, a mini calendar, and a featured news section. Responsive design is implemented with breakpoints for mobile, tablet, and desktop, using a defined spacing scale and container strategy.

### Technical Implementations

The frontend is built with React, TypeScript, and Vite, utilizing Shadcn UI (based on Radix UI) with Tailwind CSS for styling. State management is handled by TanStack Query for server state and React hooks for local state, with Wouter for client-side routing. The backend uses Node.js and Express, providing a RESTful API. Drizzle ORM with a PostgreSQL dialect manages database interactions. The project is structured as a monorepo (`/client`, `/server`, `/shared`) for full-stack type safety.

### Feature Specifications

-   **Navigation**: Sticky header with backdrop blur, gradient accent sidebar, distinguished admin items.
-   **Cards & Containers**: Rounded corners, colored shadows, hover elevation, gradient fills on stat cards.
-   **Buttons & Interactive Elements**: Gradient backgrounds, smooth hover effects, badge styling, accessible focus rings.
-   **Forms & Inputs**: Clean design, rounded corners, proper label hierarchy, validation states.
-   **Authentication System**: Three-tier system for Admins, Students, and Visitors.
    -   **Admin Auth**: Requires one-time invitation code, unique credentials, auto-generated student IDs, separate UI flow, 7-day persistent login.
    -   **Student Auth**: Standard username/password, 7-day persistent login, full account creation.
    -   **Visitor Access**: Session-only, read-only, single-click access.
    -   **Security**: Failed login tracking (3 attempts, 15-min lockout), `remember-me` tokens with sliding expiration, HttpOnly cookies, PostgreSQL-backed sessions.
    -   **Password Recovery**: Includes `password_reset_tokens` table, backend endpoints for forgot/reset password, token validation, and a frontend page.
-   **Admin Account Seeding**: Automatic creation of 2 admin accounts on server startup, configured via environment variables.

### System Design Choices

-   **Access Code Pattern**: "Secret Access Codes" and "Digital Keys" manage content creation and access within school scopes (global, grade, class).
-   **Credibility & Reputation Engine**: Dual-score system (credibility for content, reputation for contribution) with automatic account status adjustments.
-   **Admin Succession Protocol**: One-click handover mechanism for admin privileges.
-   **Session-Based Authentication**: Utilizes `express-session` with HttpOnly cookies and a 7-day expiration.
-   **Peer Rating System**: Students can rate peers on 15 performance metrics, aggregated on user profiles. Self-rating is prevented.
-   **Profile Social Features**: Profile comments for peer feedback, clickable avatars/names.
-   **Server-Authoritative Social Interactions**: Post likes tracked server-side, `isLikedByCurrentUser` included in queries, safeguards for counter updates.
-   **Support System**: Configurable donation URL system for external fundraising.

### Database Schema

Includes tables for `Users` (roles, gamification scores, peer-ratable metrics), `Scopes`, `DigitalKeys`, `Posts`, `Events`, `Schedules`, `Teachers` (with review system), `PeerRatings`, `ProfileComments`, `PostReactions`, `Settings`, `failed_login_attempts`, and `remember_me_tokens`.

## External Dependencies

-   **Database**: Neon Serverless PostgreSQL (with WebSocket support and connection pooling).
-   **UI Library**: Radix UI primitives and Shadcn UI.
-   **Form Handling**: React Hook Form with Zod.
-   **Styling**: Tailwind CSS, PostCSS, `class-variance-authority`, `clsx`, `tailwind-merge`.
-   **Development Tools**: TypeScript, Drizzle Kit, ESBuild, Vite plugins.
-   **Fonts**: Google Fonts (Inter, Outfit) via CDN.
-   **Session Storage**: `express-session` with `connect-pg-simple`.