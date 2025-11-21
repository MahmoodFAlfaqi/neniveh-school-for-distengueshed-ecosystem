import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, real, pgEnum, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["student", "admin"]);
export const accountStatusEnum = pgEnum("account_status", ["active", "threatened", "suspended"]);
export const scopeTypeEnum = pgEnum("scope_type", ["global", "stage", "section"]);
export const eventTypeEnum = pgEnum("event_type", ["curricular", "extracurricular"]);

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
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Scopes define the three-tier access system
export const scopes = pgTable("scopes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: scopeTypeEnum("type").notNull(),
  stageLevel: integer("stage_level"), // 1-6 for stages, null for global/section
  sectionName: text("section_name"), // e.g., "10-A" for sections, null for global/stage
  accessCode: text("access_code").notNull(), // The secret code users must enter
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
  
  // Dynamic data
  classroomRules: text("classroom_rules").array(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  scope: one(scopes, {
    fields: [posts.scopeId],
    references: [scopes.id],
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
        /^[A-Za-z.,-]+(\s+[A-Za-z.,-]+){1,4}$/,
        "Username must contain 2-5 names with only letters, periods, hyphens, commas, and spaces"
      ),
    grade: z.number().int().min(1).max(6),
    className: z.string().trim().min(1, "Class name is required"),
  });

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  credibilityRating: true,
  likesCount: true,
  commentsCount: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
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

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

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

export type InsertProfileComment = z.infer<typeof insertProfileCommentSchema>;
export type ProfileComment = typeof profileComments.$inferSelect;
