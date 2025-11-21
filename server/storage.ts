import {
  users,
  scopes,
  digitalKeys,
  adminSuccessions,
  posts,
  events,
  eventRsvps,
  schedules,
  teachers,
  teacherReviews,
  profileComments,
  type User,
  type InsertUser,
  type Scope,
  type InsertScope,
  type DigitalKey,
  type InsertDigitalKey,
  type AdminSuccession,
  type InsertAdminSuccession,
  type Post,
  type InsertPost,
  type Event,
  type InsertEvent,
  type EventRsvp,
  type InsertEventRsvp,
  type Schedule,
  type InsertSchedule,
  type Teacher,
  type InsertTeacher,
  type TeacherReview,
  type InsertTeacherReview,
  type ProfileComment,
  type InsertProfileComment,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

const CREDIBILITY_THRESHOLD_FOR_THREAT = 25.0; // Below this, account becomes "threatened"

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCredibility(userId: string, newScore: number): Promise<User | undefined>;
  updateUserReputation(userId: string, newScore: number): Promise<User | undefined>;
  
  // Access Code / Digital Key System
  verifyAndUnlockScope(userId: string, scopeId: string, accessCode: string): Promise<{ success: boolean; message: string; key?: DigitalKey }>;
  getUserDigitalKeys(userId: string): Promise<DigitalKey[]>;
  hasAccessToScope(userId: string, scopeId: string): Promise<boolean>;
  
  // Admin Handover Protocol
  transferAdminPrivileges(currentAdminId: string, successorId: string, notes?: string): Promise<{ success: boolean; message: string; succession?: AdminSuccession }>;
  getAdminSuccessionHistory(): Promise<AdminSuccession[]>;
  
  // Credibility & Reputation Engine
  calculateUserReputation(userId: string): Promise<number>;
  checkAndUpdateAccountStatus(userId: string): Promise<void>;
  
  // Scopes
  getScope(id: string): Promise<Scope | undefined>;
  getAllScopes(): Promise<Scope[]>;
  createScope(scope: InsertScope): Promise<Scope>;
  
  // Posts
  createPost(post: InsertPost): Promise<Post>;
  getPosts(scopeId?: string | null): Promise<Post[]>;
  getPost(id: string): Promise<Post | undefined>;
  updatePostCredibility(postId: string, rating: number): Promise<Post | undefined>;
  
  // Events
  createEvent(event: InsertEvent): Promise<Event>;
  getEvents(scopeId?: string): Promise<Event[]>;
  rsvpToEvent(eventId: string, userId: string): Promise<EventRsvp>;
  getEventRsvps(eventId: string): Promise<EventRsvp[]>;
  
  // Schedules
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  getSchedules(scopeId: string): Promise<Schedule[]>;
  updateSchedule(id: string, teacherName: string, subject: string): Promise<Schedule | undefined>;
  
  // Teachers
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  getTeachers(): Promise<Teacher[]>;
  getTeacher(id: string): Promise<Teacher | undefined>;
  createTeacherReview(review: InsertTeacherReview): Promise<TeacherReview>;
  getTeacherReviews(teacherId: string): Promise<TeacherReview[]>;
  
  // Profile Comments
  createProfileComment(comment: InsertProfileComment): Promise<ProfileComment>;
  getProfileComments(profileUserId: string): Promise<ProfileComment[]>;
}

export class DatabaseStorage implements IStorage {
  // ==================== USER MANAGEMENT ====================
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async updateUserCredibility(userId: string, newScore: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        credibilityScore: newScore,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    // Check if account status needs to be updated
    if (user) {
      await this.checkAndUpdateAccountStatus(userId);
    }
    
    return user || undefined;
  }

  async updateUserReputation(userId: string, newScore: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        reputationScore: newScore,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  // ==================== ACCESS CODE / DIGITAL KEY SYSTEM ====================
  
  /**
   * Core logic: Verifies access code and creates a "Digital Key" if correct.
   * Once a user enters the code correctly, they never need to enter it again.
   */
  async verifyAndUnlockScope(
    userId: string, 
    scopeId: string, 
    accessCode: string
  ): Promise<{ success: boolean; message: string; key?: DigitalKey }> {
    // Get the scope
    const scope = await this.getScope(scopeId);
    if (!scope) {
      return { success: false, message: "Scope not found" };
    }

    // Check if user already has this key
    const existingKey = await db
      .select()
      .from(digitalKeys)
      .where(and(
        eq(digitalKeys.userId, userId),
        eq(digitalKeys.scopeId, scopeId)
      ));
    
    if (existingKey.length > 0) {
      return { 
        success: true, 
        message: "You already have access to this scope",
        key: existingKey[0]
      };
    }

    // Verify the access code
    if (scope.accessCode !== accessCode) {
      return { success: false, message: "Incorrect access code" };
    }

    // Create the digital key (persistent access)
    const [newKey] = await db
      .insert(digitalKeys)
      .values({
        userId,
        scopeId,
      })
      .returning();

    return { 
      success: true, 
      message: "Access granted! Digital key saved to your profile.",
      key: newKey
    };
  }

  async getUserDigitalKeys(userId: string): Promise<DigitalKey[]> {
    return await db
      .select()
      .from(digitalKeys)
      .where(eq(digitalKeys.userId, userId));
  }

  async hasAccessToScope(userId: string, scopeId: string): Promise<boolean> {
    // Global scope is always accessible for reading
    const scope = await this.getScope(scopeId);
    if (scope?.type === "global") {
      return true;
    }

    // Check if user has the digital key
    const keys = await db
      .select()
      .from(digitalKeys)
      .where(and(
        eq(digitalKeys.userId, userId),
        eq(digitalKeys.scopeId, scopeId)
      ));
    
    return keys.length > 0;
  }

  // ==================== ADMIN HANDOVER PROTOCOL ====================
  
  /**
   * Core logic: Atomic transfer of admin privileges with succession tracking.
   * The current admin appoints a successor and downgrades to "alumni" status.
   */
  async transferAdminPrivileges(
    currentAdminId: string, 
    successorId: string, 
    notes?: string
  ): Promise<{ success: boolean; message: string; succession?: AdminSuccession }> {
    // Verify current user is admin
    const currentAdmin = await this.getUser(currentAdminId);
    if (!currentAdmin || currentAdmin.role !== "admin") {
      return { success: false, message: "Only admins can transfer privileges" };
    }

    // Verify successor exists
    const successor = await this.getUser(successorId);
    if (!successor) {
      return { success: false, message: "Successor not found" };
    }

    // Prevent self-succession
    if (currentAdminId === successorId) {
      return { success: false, message: "Cannot transfer privileges to yourself" };
    }

    try {
      // Perform atomic transaction
      const result = await db.transaction(async (tx) => {
        // Downgrade current admin to alumni
        await tx
          .update(users)
          .set({ 
            role: "alumni",
            updatedAt: new Date(),
          })
          .where(eq(users.id, currentAdminId));

        // Upgrade successor to admin
        await tx
          .update(users)
          .set({ 
            role: "admin",
            updatedAt: new Date(),
          })
          .where(eq(users.id, successorId));

        // Record succession
        const [succession] = await tx
          .insert(adminSuccessions)
          .values({
            previousAdminId: currentAdminId,
            newAdminId: successorId,
            notes: notes || `Admin privileges transferred from ${currentAdmin.name} to ${successor.name}`,
          })
          .returning();

        return succession;
      });

      return { 
        success: true, 
        message: `Admin privileges successfully transferred to ${successor.name}. You are now Alumni.`,
        succession: result
      };
    } catch (error) {
      return { success: false, message: "Failed to transfer privileges. Please try again." };
    }
  }

  async getAdminSuccessionHistory(): Promise<AdminSuccession[]> {
    return await db
      .select()
      .from(adminSuccessions)
      .orderBy(desc(adminSuccessions.handoverDate));
  }

  // ==================== CREDIBILITY & REPUTATION ENGINE ====================
  
  /**
   * Core logic: Calculates reputation based on activity, credibility, and participation.
   * Formula: (activity_weight × posts) + (credibility_weight × avg_credibility) + (participation_weight × events)
   */
  async calculateUserReputation(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) return 0;

    // Get user's posts count
    const userPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.authorId, userId));
    
    const postsCount = userPosts.length;
    const avgPostCredibility = postsCount > 0 
      ? userPosts.reduce((sum, post) => sum + post.credibilityRating, 0) / postsCount
      : user.credibilityScore;

    // Get user's event participation
    const userRsvps = await db
      .select()
      .from(eventRsvps)
      .where(eq(eventRsvps.userId, userId));
    
    const eventsAttended = userRsvps.length;

    // Weights for reputation calculation
    const activityWeight = 2.0;
    const credibilityWeight = 1.5;
    const participationWeight = 3.0;

    // Calculate reputation score
    const reputation = 
      (activityWeight * postsCount) +
      (credibilityWeight * avgPostCredibility) +
      (participationWeight * eventsAttended);

    // Update user's reputation
    await this.updateUserReputation(userId, reputation);

    return reputation;
  }

  /**
   * Core logic: Automatically flags account as "threatened" if credibility drops too low.
   * This is the self-moderation system to prevent spam/bullying.
   */
  async checkAndUpdateAccountStatus(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    let newStatus = user.accountStatus;

    if (user.credibilityScore < CREDIBILITY_THRESHOLD_FOR_THREAT) {
      newStatus = "threatened";
    } else if (user.accountStatus === "threatened" && user.credibilityScore >= CREDIBILITY_THRESHOLD_FOR_THREAT) {
      newStatus = "active";
    }

    if (newStatus !== user.accountStatus) {
      await db
        .update(users)
        .set({ 
          accountStatus: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }
  }

  // ==================== SCOPES ====================
  async getScope(id: string): Promise<Scope | undefined> {
    const [scope] = await db.select().from(scopes).where(eq(scopes.id, id));
    return scope || undefined;
  }

  async getAllScopes(): Promise<Scope[]> {
    return await db.select().from(scopes);
  }

  async createScope(insertScope: InsertScope): Promise<Scope> {
    const [scope] = await db.insert(scopes).values(insertScope).returning();
    return scope;
  }

  // ==================== POSTS ====================
  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db.insert(posts).values(insertPost).returning();
    
    // Recalculate author's reputation after posting
    await this.calculateUserReputation(insertPost.authorId);
    
    return post;
  }

  async getPosts(scopeId?: string | null): Promise<any[]> {
    if (scopeId === null || scopeId === undefined) {
      // Get public square posts (no scope) with author info
      const results = await db
        .select({
          id: posts.id,
          content: posts.content,
          authorId: posts.authorId,
          scopeId: posts.scopeId,
          credibilityRating: posts.credibilityRating,
          mediaUrl: posts.mediaUrl,
          mediaType: posts.mediaType,
          createdAt: posts.createdAt,
          authorName: users.name,
          authorRole: users.role,
          authorAvatarUrl: users.avatarUrl,
        })
        .from(posts)
        .leftJoin(users, eq(posts.authorId, users.id))
        .where(sql`${posts.scopeId} IS NULL`)
        .orderBy(desc(posts.createdAt));
      
      // Transform to ensure author always exists
      return results.map(post => ({
        ...post,
        author: {
          name: post.authorName || "Unknown User",
          role: post.authorRole || "student",
          avatarUrl: post.authorAvatarUrl,
        },
      }));
    }
    
    const results = await db
      .select({
        id: posts.id,
        content: posts.content,
        authorId: posts.authorId,
        scopeId: posts.scopeId,
        credibilityRating: posts.credibilityRating,
        mediaUrl: posts.mediaUrl,
        mediaType: posts.mediaType,
        createdAt: posts.createdAt,
        authorName: users.name,
        authorRole: users.role,
        authorAvatarUrl: users.avatarUrl,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.scopeId, scopeId))
      .orderBy(desc(posts.createdAt));
    
    // Transform to ensure author always exists
    return results.map(post => ({
      ...post,
      author: {
        name: post.authorName || "Unknown User",
        role: post.authorRole || "student",
        avatarUrl: post.authorAvatarUrl,
      },
    }));
  }

  async getPost(id: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post || undefined;
  }

  async updatePostCredibility(postId: string, rating: number): Promise<Post | undefined> {
    const [post] = await db
      .update(posts)
      .set({ 
        credibilityRating: rating,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId))
      .returning();
    
    // Update author's overall credibility
    if (post) {
      const authorPosts = await db
        .select()
        .from(posts)
        .where(eq(posts.authorId, post.authorId));
      
      const avgCredibility = authorPosts.reduce((sum, p) => sum + p.credibilityRating, 0) / authorPosts.length;
      await this.updateUserCredibility(post.authorId, avgCredibility);
    }
    
    return post || undefined;
  }

  // ==================== EVENTS ====================
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(insertEvent).returning();
    return event;
  }

  async getEvents(scopeId?: string): Promise<Event[]> {
    if (scopeId) {
      return await db
        .select()
        .from(events)
        .where(eq(events.scopeId, scopeId))
        .orderBy(desc(events.startTime));
    }
    return await db.select().from(events).orderBy(desc(events.startTime));
  }

  async rsvpToEvent(eventId: string, userId: string): Promise<EventRsvp> {
    const [rsvp] = await db.insert(eventRsvps).values({ eventId, userId }).returning();
    
    // Recalculate user's reputation after RSVP
    await this.calculateUserReputation(userId);
    
    return rsvp;
  }

  async getEventRsvps(eventId: string): Promise<EventRsvp[]> {
    return await db.select().from(eventRsvps).where(eq(eventRsvps.eventId, eventId));
  }

  // ==================== SCHEDULES ====================
  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const [schedule] = await db.insert(schedules).values(insertSchedule).returning();
    return schedule;
  }

  async getSchedules(scopeId: string): Promise<Schedule[]> {
    return await db
      .select()
      .from(schedules)
      .where(eq(schedules.scopeId, scopeId))
      .orderBy(schedules.dayOfWeek, schedules.periodNumber);
  }

  async updateSchedule(id: string, teacherName: string, subject: string): Promise<Schedule | undefined> {
    const [schedule] = await db
      .update(schedules)
      .set({ 
        teacherName,
        subject,
        updatedAt: new Date(),
      })
      .where(eq(schedules.id, id))
      .returning();
    return schedule || undefined;
  }

  // ==================== TEACHERS ====================
  async createTeacher(insertTeacher: InsertTeacher): Promise<Teacher> {
    const [teacher] = await db.insert(teachers).values(insertTeacher).returning();
    return teacher;
  }

  async getTeachers(): Promise<Teacher[]> {
    return await db.select().from(teachers);
  }

  async getTeacher(id: string): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.id, id));
    return teacher || undefined;
  }

  async createTeacherReview(insertReview: InsertTeacherReview): Promise<TeacherReview> {
    const [review] = await db.insert(teacherReviews).values(insertReview).returning();
    return review;
  }

  async getTeacherReviews(teacherId: string): Promise<TeacherReview[]> {
    return await db
      .select()
      .from(teacherReviews)
      .where(eq(teacherReviews.teacherId, teacherId))
      .orderBy(desc(teacherReviews.createdAt));
  }

  // ==================== PROFILE COMMENTS ====================
  async createProfileComment(insertComment: InsertProfileComment): Promise<ProfileComment> {
    const [comment] = await db.insert(profileComments).values(insertComment).returning();
    return comment;
  }

  async getProfileComments(profileUserId: string): Promise<ProfileComment[]> {
    return await db
      .select()
      .from(profileComments)
      .where(eq(profileComments.profileUserId, profileUserId))
      .orderBy(desc(profileComments.createdAt));
  }
}

export const storage = new DatabaseStorage();
