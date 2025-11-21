import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, real, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["student", "teacher", "admin", "alumni"]);
export const accountStatusEnum = pgEnum("account_status", ["active", "threatened", "suspended"]);
export const scopeTypeEnum = pgEnum("scope_type", ["global", "stage", "section"]);
export const eventTypeEnum = pgEnum("event_type", ["curricular", "extracurricular"]);

// Users table with reputation and credibility
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("student"),
  
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
});

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
  certificates: text("certificates").array(),
  
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
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  credibilityScore: true,
  reputationScore: true,
  accountStatus: true,
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

export const insertTeacherReviewSchema = createInsertSchema(teacherReviews).omit({
  id: true,
  createdAt: true,
  isModerated: true,
  moderatedById: true,
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
