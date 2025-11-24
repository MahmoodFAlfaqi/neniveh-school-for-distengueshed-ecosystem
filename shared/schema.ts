import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, real, pgEnum, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["student", "admin", "visitor"]);
export const accountStatusEnum = pgEnum("account_status", ["active", "threatened", "suspended"]);
export const scopeTypeEnum = pgEnum("scope_type", ["grade", "section", "public"]);
export const eventTypeEnum = pgEnum("event_type", ["curricular", "extracurricular"]);
export const friendStatusEnum = pgEnum("friend_status", ["pending", "accepted", "rejected"]);
export const violationTypeEnum = pgEnum("violation_type", ["spam", "offensive", "hate_speech", "harassment", "inappropriate"]);
export const violationSeverityEnum = pgEnum("violation_severity", ["low", "medium", "high", "critical"]);
export const detectionSourceEnum = pgEnum("detection_source", ["ai", "user_report", "admin"]);
export const punishmentTypeEnum = pgEnum("punishment_type", ["warning", "credibility_reduction", "temp_ban", "permanent_ban"]);

// Users table with reputation and credibility
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Authentication fields
  username: text("username").notNull().unique(), // 2-5 names, letters/periods/hyphens/commas only
  studentId: text("student_id").notNull().unique(), // Admin-assigned ID required for registration
  email: text("email").notNull().unique(),
  phone: text("phone"),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("student"),
  isSpecialAdmin: boolean("is_special_admin").notNull().default(false), // For initial admin accounts
  
  // Grade and Class assignment (for students)
  grade: integer("grade"), // 1-6 for grades 1-6, null for admins
  className: text("class_name"), // e.g., "A", "B", "C", "D", null for admins
  
  // Gamification fields
  credibilityScore: real("credibility_score").notNull().default(50.0), // 0-100 scale
  reputationScore: real("reputation_score").notNull().default(0.0),
  accountStatus: accountStatusEnum("account_status").notNull().default("active"),
  
  // Optional user details (private)
  transportDetails: text("transport_details"),
  
  // Avatar & bio
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  
  // Hobbies (max 5)
  hobbies: text("hobbies").array(),
  
  // Hexagon Tendency Charts - 3 hexagons with 6 metrics each
  // Total points per hexagon: 24, each metric max: 10
  
  // Social Personality Hexagon (6 metrics)
  empathy: integer("empathy").default(4),
  angerManagement: integer("anger_management").default(4),
  cooperation: integer("cooperation").default(4),
  selfConfidence: integer("self_confidence").default(4),
  acceptingCriticism: integer("accepting_criticism").default(4),
  listening: integer("listening").default(4),
  
  // Skills & Abilities Hexagon (6 metrics)
  problemSolving: integer("problem_solving").default(4),
  creativity: integer("creativity").default(4),
  memoryFocus: integer("memory_focus").default(4),
  planningOrganization: integer("planning_organization").default(4),
  communicationExpression: integer("communication_expression").default(4),
  leadershipInitiative: integer("leadership_initiative").default(4),
  
  // Interests Hexagon (6 metrics)
  artisticCreative: integer("artistic_creative").default(4),
  athleticPhysical: integer("athletic_physical").default(4),
  technicalTech: integer("technical_tech").default(4),
  linguisticReading: integer("linguistic_reading").default(4),
  socialHumanitarian: integer("social_humanitarian").default(4),
  naturalEnvironmental: integer("natural_environmental").default(4),
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Scopes define the three-tier access system: public (square), grade, and section (class)
export const scopes = pgTable("scopes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: scopeTypeEnum("type").notNull(),
  gradeNumber: integer("grade_number"), // 1-6 for grade scopes, null for section/public
  sectionName: text("section_name"), // e.g., "1-A" for class sections, null for grades/public
  accessCode: text("access_code"), // null for public scope, otherwise required and unique
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Digital Keys - stores unlocked scopes per user (key persistence)
export const digitalKeys = pgTable("digital_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  scopeId: varchar("scope_id").notNull().references(() => scopes.id, { onDelete: "cascade" }),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
});

// Admin Succession history
export const adminSuccessions = pgTable("admin_successions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  previousAdminId: varchar("previous_admin_id").notNull().references(() => users.id),
  newAdminId: varchar("new_admin_id").notNull().references(() => users.id),
  handoverDate: timestamp("handover_date").notNull().defaultNow(),
  notes: text("notes"),
});

// Admin Student IDs - Username + ID pairs that can be assigned to new students
export const adminStudentIds = pgTable("admin_student_ids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(), // The pre-assigned username (e.g., "John.Smith"), must be unique
  studentId: text("student_id").notNull().unique(), // The auto-generated random ID
  grade: integer("grade").notNull(), // 1-6 for grades
  className: text("class_name").notNull(), // e.g., "A", "B", "C", "D"
  isAssigned: boolean("is_assigned").notNull().default(false), // Whether this ID has been used
  assignedToUserId: varchar("assigned_to_user_id").references(() => users.id), // Which user claimed this ID
  createdByAdminId: varchar("created_by_admin_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  assignedAt: timestamp("assigned_at"),
});

// Posts with credibility and scope
export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  scopeId: varchar("scope_id").references(() => scopes.id), // null for public square
  
  // Content
  content: text("content").notNull(),
  mediaUrl: text("media_url"), // for images, audio, etc.
  mediaType: text("media_type"), // 'image', 'audio', 'gif', etc.
  
  // Credibility
  credibilityRating: real("credibility_rating").notNull().default(50.0), // 0-100 scale
  
  // Engagement
  likesCount: integer("likes_count").notNull().default(0),
  commentsCount: integer("comments_count").notNull().default(0),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Post Reactions (likes)
export const postReactions = pgTable("post_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  uniquePostUser: unique().on(table.postId, table.userId),
}));

// Events with RSVP tracking
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  eventType: eventTypeEnum("event_type").notNull(),
  scopeId: varchar("scope_id").references(() => scopes.id),
  
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  location: text("location"),
  
  imageUrl: text("image_url"),
  
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Event RSVPs
export const eventRsvps = pgTable("event_rsvps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rsvpedAt: timestamp("rsvped_at").notNull().defaultNow(),
}, (table) => ({
  uniqueEventUser: unique().on(table.eventId, table.userId),
}));

// Schedules (class timetables)
export const schedules = pgTable("schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scopeId: varchar("scope_id").notNull().references(() => scopes.id), // Must be section level
  
  dayOfWeek: integer("day_of_week").notNull(), // 1-7 (Monday-Sunday)
  periodNumber: integer("period_number").notNull(), // 1-7
  
  teacherName: text("teacher_name"),
  subject: text("subject"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Teachers
export const teachers = pgTable("teachers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  
  name: text("name").notNull(),
  photoUrl: text("photo_url"),
  description: text("description"), // Admin-written description of the teacher
  academicAchievements: text("academic_achievements").array(), // Degrees, certifications, awards
  
  // Subject and section management
  subjects: text("subjects").array(), // e.g., ["Math", "Physics"]
  sections: text("sections").array(), // e.g., ["1-A", "1-B", "2-A"]
  
  // Dynamic data
  classroomRules: text("classroom_rules").array(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Settings - for application-wide configuration
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(), // e.g., "donationUrl"
  value: text("value"), // The actual value (e.g., URL to donation page)
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Password Reset Tokens for password recovery
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(), // Random secure token
  expiresAt: timestamp("expires_at").notNull(), // Token expires after 1 hour
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Failed Login Attempts - Track login failures for rate limiting (3 attempts max)
export const failedLoginAttempts = pgTable("failed_login_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(), // Track by username (not userId since user might not exist)
  attemptCount: integer("attempt_count").notNull().default(1),
  lastAttemptAt: timestamp("last_attempt_at").notNull().defaultNow(),
  lockedUntil: timestamp("locked_until"), // Account locked until this time (null if not locked)
});

// Remember Me Tokens - Device tracking for "remember me" functionality
export const rememberMeTokens = pgTable("remember_me_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(), // Secure random token stored in cookie
  deviceFingerprint: text("device_fingerprint"), // Optional device identifier
  lastUsedAt: timestamp("last_used_at").notNull().defaultNow(), // Track last activity
  expiresAt: timestamp("expires_at").notNull(), // Token expires after 7 days of inactivity
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Teacher Reviews
export const teacherReviews = pgTable("teacher_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => teachers.id, { onDelete: "cascade" }),
  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  
  isModerated: boolean("is_moderated").notNull().default(false),
  moderatedById: varchar("moderated_by_id").references(() => users.id),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  uniqueTeacherStudent: unique().on(table.teacherId, table.studentId),
}));

// Post Accuracy Ratings - users rate post accuracy (1-5 stars)
export const postAccuracyRatings = pgTable("post_accuracy_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  rating: integer("rating").notNull(), // 1-5 stars, default 3
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  uniqueUserPost: unique().on(table.postId, table.userId),
}));

// Post Comments
export const postComments = pgTable("post_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Event Comments
export const eventComments = pgTable("event_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Profile Comments - user-to-user comments/reviews
export const profileComments = pgTable("profile_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileUserId: varchar("profile_user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Whose profile
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Who wrote it
  
  content: text("content").notNull(),
  rating: integer("rating"), // Optional 1-5 stars
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Friendships - user-to-user friend connections
export const friendships = pgTable("friendships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user1Id: varchar("user1_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Lower ID always goes here
  user2Id: varchar("user2_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Higher ID always goes here
  initiatorId: varchar("initiator_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Who sent the request
  status: friendStatusEnum("status").notNull().default("pending"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  uniqueFriendship: unique().on(table.user1Id, table.user2Id),
}));

// Chat Messages - direct messages between friends
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: varchar("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Content Violations - AI-detected or user-reported violations
export const contentViolations = pgTable("content_violations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentType: text("content_type").notNull(), // 'post', 'chat_message', 'profile_comment', etc.
  contentId: varchar("content_id").notNull(), // ID of the violating content
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Who created the violating content
  
  violationType: violationTypeEnum("violation_type").notNull(),
  severity: violationSeverityEnum("severity").notNull(),
  detectedBy: detectionSourceEnum("detected_by").notNull(),
  aiConfidence: real("ai_confidence"), // 0-1 scale, null if not AI-detected
  aiReasoning: text("ai_reasoning"), // AI explanation of why it's a violation
  
  reportedById: varchar("reported_by_id").references(() => users.id), // If user-reported
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User Punishments - automatic punishments based on violations
export const userPunishments = pgTable("user_punishments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  violationId: varchar("violation_id").references(() => contentViolations.id, { onDelete: "set null" }),
  
  punishmentType: punishmentTypeEnum("punishment_type").notNull(),
  credibilityPenalty: real("credibility_penalty").notNull().default(0), // Amount credibility reduced
  banUntil: timestamp("ban_until"), // Null if not a ban, otherwise when ban expires
  notes: text("notes"), // Admin notes or automated reasoning
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  digitalKeys: many(digitalKeys),
  events: many(events),
  eventRsvps: many(eventRsvps),
  teacherReviews: many(teacherReviews),
  profileComments: many(profileComments, { relationName: "profileComments" }),
  authoredComments: many(profileComments, { relationName: "authoredComments" }),
}));

export const scopesRelations = relations(scopes, ({ many }) => ({
  digitalKeys: many(digitalKeys),
  posts: many(posts),
  events: many(events),
  schedules: many(schedules),
}));

export const digitalKeysRelations = relations(digitalKeys, ({ one }) => ({
  user: one(users, {
    fields: [digitalKeys.userId],
    references: [users.id],
  }),
  scope: one(scopes, {
    fields: [digitalKeys.scopeId],
    references: [scopes.id],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  scope: one(scopes, {
    fields: [posts.scopeId],
    references: [scopes.id],
  }),
  reactions: many(postReactions),
}));

export const postReactionsRelations = relations(postReactions, ({ one }) => ({
  post: one(posts, {
    fields: [postReactions.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postReactions.userId],
    references: [users.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [events.createdById],
    references: [users.id],
  }),
  scope: one(scopes, {
    fields: [events.scopeId],
    references: [scopes.id],
  }),
  rsvps: many(eventRsvps),
}));

export const eventRsvpsRelations = relations(eventRsvps, ({ one }) => ({
  event: one(events, {
    fields: [eventRsvps.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventRsvps.userId],
    references: [users.id],
  }),
}));

export const schedulesRelations = relations(schedules, ({ one }) => ({
  scope: one(scopes, {
    fields: [schedules.scopeId],
    references: [scopes.id],
  }),
}));

export const teachersRelations = relations(teachers, ({ one, many }) => ({
  user: one(users, {
    fields: [teachers.userId],
    references: [users.id],
  }),
  reviews: many(teacherReviews),
}));

export const teacherReviewsRelations = relations(teacherReviews, ({ one }) => ({
  teacher: one(teachers, {
    fields: [teacherReviews.teacherId],
    references: [teachers.id],
  }),
  student: one(users, {
    fields: [teacherReviews.studentId],
    references: [users.id],
  }),
  moderatedBy: one(users, {
    fields: [teacherReviews.moderatedById],
    references: [users.id],
  }),
}));

export const profileCommentsRelations = relations(profileComments, ({ one }) => ({
  profileUser: one(users, {
    fields: [profileComments.profileUserId],
    references: [users.id],
    relationName: "profileComments",
  }),
  author: one(users, {
    fields: [profileComments.authorId],
    references: [users.id],
    relationName: "authoredComments",
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    credibilityScore: true,
    reputationScore: true,
    accountStatus: true,
    isSpecialAdmin: true, // Only set programmatically for special admins
    name: true, // Derived from username, not provided by user
    role: true, // Auto-set to student
    grade: true, // Set from adminStudentId lookup
    className: true, // Set from adminStudentId lookup
  })
  .extend({
    username: z.string().trim().min(1, "Username is required"),
    studentId: z.string().trim().min(1, "Student ID is required"),
    email: z.string().trim().email("Valid email is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    phone: z.string().trim().optional(),
  });

export const insertScopeSchema = createInsertSchema(scopes).omit({
  id: true,
  createdAt: true,
}).extend({
  accessCode: z.string().optional().nullable(), // Optional for public scopes
});

export const insertDigitalKeySchema = createInsertSchema(digitalKeys).omit({
  id: true,
  unlockedAt: true,
});

export const insertAdminSuccessionSchema = createInsertSchema(adminSuccessions).omit({
  id: true,
  handoverDate: true,
});

export const insertAdminStudentIdSchema = createInsertSchema(adminStudentIds)
  .omit({
    id: true,
    createdAt: true,
    isAssigned: true,
    assignedToUserId: true,
    assignedAt: true,
    studentId: true, // Auto-generated, not provided by admin
  })
  .extend({
    username: z.string()
      .trim()
      .min(1, "Username is required")
      .regex(
        /^[A-Za-z.,-]+(\s[A-Za-z.,-]+){0,4}$/,
        "Username must contain 1-5 names with only letters, periods, hyphens, commas, and single spaces between names"
      ),
    grade: z.number().int().min(1).max(6),
    className: z.string().trim().min(1, "Class name is required"),
  });

export const insertPostSchema = createInsertSchema(posts)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    credibilityRating: true,
    likesCount: true,
    commentsCount: true,
  })
  .extend({
    content: z.string().trim().min(1, "Content is required").max(4000, "Content must not exceed 4000 characters"),
  });

export const insertEventSchema = createInsertSchema(events)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    description: z.string().trim().min(1, "Description is required").max(4000, "Description must not exceed 4000 characters"),
  });

export const insertEventRsvpSchema = createInsertSchema(eventRsvps).omit({
  id: true,
  rsvpedAt: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeacherSchema = createInsertSchema(teachers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeacherReviewSchema = createInsertSchema(teacherReviews)
  .omit({
    id: true,
    createdAt: true,
    isModerated: true,
    moderatedById: true,
  })
  .extend({
    rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
    comment: z.string().trim().optional(),
  });

export const insertPostCommentSchema = createInsertSchema(postComments).omit({
  id: true,
  createdAt: true,
}).extend({
  content: z.string().trim().min(1, "Comment is required").max(1000, "Comment must not exceed 1000 characters"),
});

export const insertEventCommentSchema = createInsertSchema(eventComments).omit({
  id: true,
  createdAt: true,
}).extend({
  content: z.string().trim().min(1, "Comment is required").max(1000, "Comment must not exceed 1000 characters"),
});

export const insertProfileCommentSchema = createInsertSchema(profileComments).omit({
  id: true,
  createdAt: true,
});


// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertScope = z.infer<typeof insertScopeSchema>;
export type Scope = typeof scopes.$inferSelect;

export type InsertDigitalKey = z.infer<typeof insertDigitalKeySchema>;
export type DigitalKey = typeof digitalKeys.$inferSelect;

export type InsertAdminSuccession = z.infer<typeof insertAdminSuccessionSchema>;
export type AdminSuccession = typeof adminSuccessions.$inferSelect;

export type InsertAdminStudentId = z.infer<typeof insertAdminStudentIdSchema>;
export type AdminStudentId = typeof adminStudentIds.$inferSelect;

export const insertPostReactionSchema = createInsertSchema(postReactions).omit({
  id: true,
  createdAt: true,
});

export const insertPostAccuracyRatingSchema = createInsertSchema(postAccuracyRatings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  rating: z.number().int().min(1).max(5).default(3),
});

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

export type InsertPostReaction = z.infer<typeof insertPostReactionSchema>;
export type PostReaction = typeof postReactions.$inferSelect;

export type InsertPostAccuracyRating = z.infer<typeof insertPostAccuracyRatingSchema>;
export type PostAccuracyRating = typeof postAccuracyRatings.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export type InsertEventRsvp = z.infer<typeof insertEventRsvpSchema>;
export type EventRsvp = typeof eventRsvps.$inferSelect;

export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Schedule = typeof schedules.$inferSelect;

export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Teacher = typeof teachers.$inferSelect;

export type InsertTeacherReview = z.infer<typeof insertTeacherReviewSchema>;
export type TeacherReview = typeof teacherReviews.$inferSelect;

export type InsertPostComment = z.infer<typeof insertPostCommentSchema>;
export type PostComment = typeof postComments.$inferSelect;

export type InsertEventComment = z.infer<typeof insertEventCommentSchema>;
export type EventComment = typeof eventComments.$inferSelect;

export type InsertProfileComment = z.infer<typeof insertProfileCommentSchema>;
export type ProfileComment = typeof profileComments.$inferSelect;

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

export const insertFailedLoginAttemptSchema = createInsertSchema(failedLoginAttempts).omit({
  id: true,
  lastAttemptAt: true,
});

export type InsertFailedLoginAttempt = z.infer<typeof insertFailedLoginAttemptSchema>;
export type FailedLoginAttempt = typeof failedLoginAttempts.$inferSelect;

export const insertRememberMeTokenSchema = createInsertSchema(rememberMeTokens).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
});

export type InsertRememberMeToken = z.infer<typeof insertRememberMeTokenSchema>;
export type RememberMeToken = typeof rememberMeTokens.$inferSelect;

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Friendship = typeof friendships.$inferSelect;

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
  isRead: true,
}).extend({
  content: z.string().trim().min(1, "Message cannot be empty").max(2000, "Message must not exceed 2000 characters"),
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export const insertContentViolationSchema = createInsertSchema(contentViolations).omit({
  id: true,
  createdAt: true,
});

export type InsertContentViolation = z.infer<typeof insertContentViolationSchema>;
export type ContentViolation = typeof contentViolations.$inferSelect;

export const insertUserPunishmentSchema = createInsertSchema(userPunishments).omit({
  id: true,
  createdAt: true,
});

export type InsertUserPunishment = z.infer<typeof insertUserPunishmentSchema>;
export type UserPunishment = typeof userPunishments.$inferSelect;
