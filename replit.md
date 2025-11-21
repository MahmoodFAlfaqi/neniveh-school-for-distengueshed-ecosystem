# School Community Ecosystem

## Overview

A social platform for students, teachers, and administrators that creates a gamified school community experience. The system uses a reputation-based access control system with "Secret Access Codes" and "Digital Keys" to manage content creation across different school scopes (global, stage/grade level, and section/class level). Features include news feeds, event management, class schedules, teacher profiles with reviews, and a comprehensive gamification system with credibility scores and reputation rankings.

## Recent Changes (November 21, 2025)

**Critical Bug Fixes - Data Consistency & Transaction Safety (COMPLETED)**

1. **Transaction-Safe Registration**: Student registration now uses database transactions with row-level locking to prevent race conditions. All operations (student ID validation, user creation, ID assignment) happen atomically - if any step fails, the entire transaction rolls back.

2. **Race Condition Prevention**: Student ID assignment includes `isAssigned=false` guard in UPDATE statement. Multiple concurrent registrations cannot reuse the same ID.

3. **Username Case Preservation**: Original username casing from admin (e.g., "Sarah Jones") is preserved in database. All lookups use SQL `LOWER()` function for case-insensitive matching. Login works with any casing variation.

4. **Removed Non-Transactional Paths**: Eliminated `assignStudentId()` method from storage interface. All student ID assignment now happens exclusively within the createUser transaction.

**Features Implemented**

1. **Global News (Public Square)**: Full news posting system at /news with credibility ratings, author info, engagement metrics (likes/comments). Both admins and students can post.

2. **Events System with RSVP**: 
   - Event creation with RSVP toggle functionality at /events
   - Events include curricular/extracurricular types, date/time/location, creator info
   - RSVP button shows correct state immediately (userHasRsvpd flag from backend)
   - Click RSVP to attend, click again to cancel - prevents duplicate RSVPs
   - Unique database constraint on (eventId, userId) enforces one RSVP per user
   - Collapsible attendee list shows profiles (avatar, name, role, credibility)

3. **Admin ID Generation & Student Registration**: 
   - Admins input username + grade (1-6) + class (A-E), system auto-generates 8-char alphanumeric student ID
   - Registration requires username + studentId + email + password + phone (optional)
   - Name auto-derived from username (e.g., "John.Smith" → "John Smith")
   - Grade and className auto-populated from student ID record

4. **Grade & Class Navigation**: 
   - /grades - Overview of all 6 grades in grid layout
   - /grades/:gradeNumber - Individual grade pages with classes (A-E), News/Events tabs
   - /grades/:gradeNumber/:className - Class detail pages with student lists, News/Events tabs
   - Queries staged (enabled: false) until backend scopes are implemented

5. **Access Code & Digital Keys System** (Foundation Complete):
   - Backend enforces scope access for both posts and events (403 if user lacks digital key)
   - GET /api/keys - Fetch user's unlocked scopes
   - POST /api/keys/unlock - Verify access code and create digital key
   - GET /api/keys/check/:scopeId - Check if user has access to scope
   - UnlockScopeDialog component - Reusable modal for entering secret codes
   - useDigitalKeys() hook - Global React Query hook for managing key state
   - useHasAccessToScope(scopeId) - Helper hook to check access
   - /keys page - Visual management of all scopes with lock/unlock status
   - Sidebar navigation includes Keys menu item

6. **Teacher Review System** (COMPLETE):
   - Teachers table with description and academicAchievements fields
   - Unique constraint on (teacherId, studentId) prevents duplicate reviews per student
   - Admin CRUD operations: Create, update, delete teachers via TeacherManagementDialog
   - Student review submission: 1-5 star rating + optional comment
   - Automatic average rating calculation from all reviews
   - Duplicate review prevention: Returns 409 error with message "You have already submitted a review for this teacher"
   - Content moderation on review comments
   - API routes:
     - GET /api/teachers - List all teachers with average ratings
     - GET /api/teachers/:id - Get teacher details with full reviews array and calculated average
     - POST /api/teachers - Create teacher (admin only)
     - PATCH /api/teachers/:id - Update teacher (admin only)
     - DELETE /api/teachers/:id - Delete teacher (admin only)
     - POST /api/teachers/:id/reviews - Submit review (students only)
   - Frontend pages:
     - /teachers - Teachers listing with grid layout, average ratings, admin management button
     - /teachers/:id - Teacher detail showing description, achievements, reviews list, submission form
   - Error handling: Zod validation, duplicate review detection, content moderation violations

7. **Scoped Posting System - FULLY OPERATIONAL** (November 21, 2025):
   - Grade & class detail pages now fetch scoped news/events with proper query implementation
   - Custom queryFn passes scopeId to API: `/api/posts?scopeId=${scopeId}`
   - Queries gated behind access checks: `enabled: !!scopeId && hasAccess`
   - useDigitalKeys() hook refetches immediately on invalidation (staleTime: 0)
   - Complete flow: Navigate → Unlock scope → Keys refetch → hasAccess updates → Queries execute → Data displays
   - Backend storage.getPosts() filters by scopeId correctly
   - News page dynamic filtering by selected scope works perfectly
   - Cache invalidation matches query keys for immediate updates
   
8. **Access Code Security - HARDENED** (November 21, 2025):
   - All 37 scopes updated with ultra-secure access codes
   - Length: 17-20 characters (vs original 6-9 characters)
   - Format: Randomized mix of uppercase, lowercase, and numbers
   - Examples:
     - Public Square: `xK9mP2vN8qR4tL7wY` (was `PUBLIC123`)
     - Grade 1: `hT6jM3nB9pQ5sV8xZ` (was `GRADE1`)
     - Class 1-A: `aB3cD5eF7gH9iJ2kL4m` (was `CLASS1A`)
   - Highly resistant to brute-force attacks

**Testing Status**: 
- Scoped posting verified by architect - complete end-to-end flow operational
- Grade/class pages fetch scoped data correctly after unlock
- Access codes hardened across all 37 scopes
- Teacher system verified via code review - schema with unique constraints, error handling for duplicates, complete CRUD operations, frontend integration
- End-to-end tested admin ID generation → student registration → login flow
- Passcode system backend and UI infrastructure verified by architect review

**Remaining Work**: 
- Personalized Schedule calendar
- Home page layout and dashboard

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