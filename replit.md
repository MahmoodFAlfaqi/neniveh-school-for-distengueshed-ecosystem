# School Community Ecosystem

## Overview

This project is a social platform designed for students, teachers, and administrators within a school environment. Its primary purpose is to create a gamified community experience, leveraging a reputation-based access control system. Key capabilities include news feeds, event management with RSVP, class schedules, teacher profiles with review functionality, and a comprehensive gamification system featuring credibility scores and reputation rankings. The platform aims to foster engagement, streamline school communications, and enhance community interaction through a structured and rewarding digital environment.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React and TypeScript, using Vite for fast development and bundling. It utilizes Shadcn UI, based on Radix UI primitives, for a component-driven design with Tailwind CSS for styling. The design draws inspiration from popular social and productivity applications like Instagram, Discord, Duolingo, and Linear, ensuring a modern and intuitive user experience with dark/light mode support. State management is handled by TanStack Query for server state and React hooks for local component state, with Wouter providing lightweight client-side routing.

### Backend Architecture

The backend is developed with Node.js and Express, featuring a RESTful API design categorized by domain (e.g., `/api/auth`, `/api/posts`, `/api/events`). Authentication uses session-based `express-session` with bcrypt for password hashing and role-based access control. A storage abstraction layer separates business logic from database implementation.

### Database Architecture

Drizzle ORM with a PostgreSQL dialect is used for database interactions. The schema includes tables for `Users` (with roles, gamification scores, and account status), `Scopes` (defining access boundaries for global, stage, and section levels), `DigitalKeys` (persisting unlocked scopes per user), `Posts`, `Events`, `Schedules`, and `Teachers` (with a review system). Relationships between entities support the platform's features, such as user-generated content, event participation, and teacher evaluations.

### Key Architectural Decisions

-   **Access Code Pattern**: A system of "Secret Access Codes" and "Digital Keys" manages content creation and access within different school scopes (global, grade, class), providing a user-friendly and scalable access control mechanism.
-   **Credibility & Reputation Engine**: A dual-score system (credibility for content quality, reputation for overall contribution) incentivizes positive participation and prevents misuse, with automatic account status adjustments.
-   **Admin Succession Protocol**: A one-click handover mechanism for admin privileges ensures continuity and prevents accumulation of high-level access.
-   **Session-Based Authentication**: Chosen for its simplicity and security benefits, utilizing HttpOnly cookies and a 7-day expiration.
-   **Monorepo Structure**: The project is organized as a monorepo (`/client`, `/server`, `/shared`) to enable type safety across the full stack and maintain a single source of truth for shared code.

## External Dependencies

-   **Database**: Neon Serverless PostgreSQL is used for data storage, including WebSocket support and connection pooling.
-   **UI Library**: Radix UI primitives and Shadcn UI for accessible and customizable UI components.
-   **Form Handling**: React Hook Form combined with Zod for robust form management and schema validation.
-   **Styling**: Tailwind CSS, PostCSS, `class-variance-authority`, and `clsx`/`tailwind-merge` for efficient and maintainable styling.
-   **Development Tools**: TypeScript, Drizzle Kit for migrations, ESBuild for server bundling, and Vite plugins for development enhancements.
-   **Fonts**: Google Fonts (Inter, Space Grotesk) via CDN.
-   **Session Storage**: `express-session` with `connect-pg-simple` for PostgreSQL-backed persistent session storage.