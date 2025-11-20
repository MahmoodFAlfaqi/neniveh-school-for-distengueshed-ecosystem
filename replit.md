# School Community Ecosystem

## Overview

A social platform for students, teachers, and administrators that creates a gamified school community experience. The system uses a reputation-based access control system with "Secret Access Codes" and "Digital Keys" to manage content creation across different school scopes (global, stage/grade level, and section/class level). Features include news feeds, event management, class schedules, teacher profiles with reviews, and a comprehensive gamification system with credibility scores and reputation rankings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component System**: Shadcn UI (New York style) built on Radix UI primitives
- Component-driven architecture with reusable UI elements
- Tailwind CSS for styling with custom design tokens
- Dark/light mode support through CSS variables
- Design inspired by Instagram (social feeds), Discord (community sections), Duolingo (gamification), and Linear (clean hierarchy)

**State Management**: 
- TanStack Query (React Query) for server state management
- Session-based authentication state
- Local component state with React hooks

**Routing**: Wouter for client-side routing (lightweight alternative to React Router)

**Design System**:
- Typography: Inter (primary), Space Grotesk (accents/badges)
- Spacing: Tailwind's 2, 4, 6, 8, 12, 16, 20, 24 unit scale
- Layout: Max-width containers (7xl for main content, 3xl for news feeds)
- Grid patterns for different content types (stats, events, teacher profiles)

### Backend Architecture

**Runtime**: Node.js with Express server

**API Design**: RESTful endpoints organized by domain:
- `/api/auth/*` - Authentication (register, login, logout, session management)
- `/api/scopes/*` - Access scope management
- `/api/posts/*` - News feed and content
- `/api/events/*` - Event creation and RSVP management
- `/api/schedules/*` - Class schedule management
- `/api/teachers/*` - Teacher profiles and reviews
- `/api/users/*` - User profiles and stats

**Authentication & Authorization**:
- Session-based authentication using express-session
- Password hashing with bcrypt
- Role-based access control (student, teacher, admin, alumni)
- Middleware for route protection (requireAuth, requireAdmin)

**Data Access Layer**: 
- Storage abstraction pattern (server/storage.ts) providing clean interface to database operations
- Separates business logic from database implementation details

### Database Architecture

**ORM**: Drizzle ORM with PostgreSQL dialect

**Database Schema Design**:

**User Management**:
- Users table with role-based differentiation (student, teacher, admin, alumni)
- Gamification fields: credibilityScore (0-100), reputationScore, accountStatus
- Account status enum: active, threatened (low credibility), suspended
- Profile data: avatarUrl, bio, optional transportDetails (private)

**Access Control System (Three-Tier)**:
- Scopes table defining access boundaries:
  - Global scope (everyone can read, code required to write)
  - Stage scopes (6 grade levels)
  - Section scopes (individual classes like "10-A")
- Digital Keys table: Persists unlocked scopes per user (enter code once, never again)
- Each scope has a secret accessCode

**Content & Social Features**:
- Posts table with scopeId, credibilityRating, and media support
- Events table with curricular/extracurricular types and RSVP tracking
- EventRsvps junction table for attendance management
- Schedules table with flexible period configuration (teacher, subject, timeSlot)

**Teacher System**:
- Teachers table with static (name, photo, certificates) and dynamic (classroomRules) data
- TeacherReviews with admin moderation capability

**Admin Succession System**:
- AdminSuccessions table for ownership transfer
- Tracks predecessor, successor, handover status, and timestamp

**Relationships**:
- Users → Posts (one-to-many)
- Users → DigitalKeys (one-to-many, tracks unlocked scopes)
- Scopes → Posts/Events/Schedules (one-to-many)
- Events → EventRsvps (one-to-many)
- Teachers → TeacherReviews (one-to-many)

### Key Architectural Decisions

**Access Code Pattern**:
- Problem: Need controlled write access without complex permission systems
- Solution: Secret codes per scope + persistent "Digital Keys" after first unlock
- Rationale: User-friendly (enter code once), self-managing (students can share codes), scalable across scope hierarchy

**Credibility & Reputation Engine**:
- Problem: Prevent spam/bullying while encouraging quality participation
- Solution: Dual-score system (credibility for content quality, reputation for overall contribution)
- Automatic account status degradation when credibility drops below threshold (25.0)
- Every post AND user bio has credibility rating

**Admin Succession Protocol**:
- Problem: Admins graduate, need seamless privilege transfer
- Solution: One-click handover mechanism that transfers ownership and downgrades predecessor
- Prevents admin privilege accumulation and ensures continuity

**Session-Based Auth Over JWT**:
- Chosen for simpler implementation with express-session
- 7-day cookie expiration for persistent login
- HttpOnly cookies for security

**Monorepo Structure**:
- `/client` - Frontend React application
- `/server` - Backend Express API
- `/shared` - Shared TypeScript types and Drizzle schema
- Enables type safety across full stack with single source of truth

### External Dependencies

**Database**: 
- Neon Serverless PostgreSQL (@neondatabase/serverless)
- WebSocket support for real-time capabilities
- Connection pooling for performance

**UI Library**:
- Radix UI primitives for accessible components
- Shadcn UI component collection (customizable, copy-paste approach)

**Form Handling**:
- React Hook Form with Zod resolvers (@hookform/resolvers)
- Zod for schema validation (drizzle-zod integration)

**Styling**:
- Tailwind CSS with PostCSS
- class-variance-authority for variant-based component APIs
- clsx + tailwind-merge for className management

**Development Tools**:
- TypeScript for type safety
- Drizzle Kit for database migrations
- ESBuild for server bundling
- Vite plugins: runtime error overlay, Replit integrations (cartographer, dev banner)

**Fonts**: Google Fonts CDN (Inter, Space Grotesk)

**Session Storage**: 
- express-session with connect-pg-simple for PostgreSQL session store
- Enables persistent sessions across server restarts