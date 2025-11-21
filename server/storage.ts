import {
  users,
  scopes,
  digitalKeys,
  adminSuccessions,
  adminStudentIds,
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
  type AdminStudentId,
  type InsertAdminStudentId,
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
  getUserByUsername(username: string): Promise<User | undefined>;
  getStudentsByClass(grade: number, className: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCredibility(userId: string, newScore: number): Promise<User | undefined>;
  updateUserReputation(userId: string, newScore: number): Promise<User | undefined>;
  
  // Student ID Management (Admin only)
  createStudentId(username: string, grade: number, className: string, adminId: string): Promise<AdminStudentId>;
  getStudentIdRecord(studentId: string): Promise<AdminStudentId | undefined>;
  getStudentIdByUsername(username: string): Promise<AdminStudentId | undefined>;
  getAllStudentIds(): Promise<AdminStudentId[]>;
  deleteStudentId(id: string): Promise<boolean>;
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
  getEvents(scopeId?: string, userId?: string): Promise<any[]>;
  rsvpToEvent(eventId: string, userId: string): Promise<EventRsvp | null>;
  getEventRsvps(eventId: string): Promise<EventRsvp[]>;
  getEventAttendees(eventId: string): Promise<User[]>;
  
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Case-insensitive lookup using SQL lower() function
    const [user] = await db.select().from(users).where(sql`LOWER(${users.username}) = LOWER(${username})`);
    return user || undefined;
  }

  async getStudentsByClass(grade: number, className: string): Promise<User[]> {
    const students = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.grade, grade),
          eq(users.className, className),
          eq(users.role, "student")
        )
      )
      .orderBy(users.name);
    return students;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    // Students MUST have a valid student ID generated by admin
    if (!insertUser.studentId) {
      throw new Error("Student ID is required for registration");
    }
    
    // Derive the full name from username (replace periods/hyphens/commas with spaces, capitalize each word)
    const name = insertUser.username
      .replace(/[.,-]/g, ' ')
      .split(' ')
      .filter(word => word.length > 0) // Remove empty strings from double punctuation
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    // Use transaction to ensure atomicity and prevent race conditions
    return await db.transaction(async (tx) => {
      // Fetch and verify the student ID record inside the transaction
      const [studentIdRecord] = await tx
        .select()
        .from(adminStudentIds)
        .where(eq(adminStudentIds.studentId, insertUser.studentId))
        .for('update'); // Lock the row to prevent concurrent access
      
      if (!studentIdRecord) {
        throw new Error("Invalid student ID. This ID was not generated by an administrator.");
      }
      
      // Validate the student ID record
      if (studentIdRecord.isAssigned) {
        throw new Error("This student ID has already been used");
      }
      
      // Verify the username matches (case-insensitive)
      if (studentIdRecord.username.toLowerCase() !== insertUser.username.toLowerCase()) {
        throw new Error("Username does not match the assigned student ID");
      }
      
      // Insert user with original username casing preserved
      const [user] = await tx
        .insert(users)
        .values({
          ...insertUser,
          password: hashedPassword,
          name,
          role: "student",
          grade: studentIdRecord.grade,
          className: studentIdRecord.className,
        })
        .returning();
      
      // Mark the student ID as assigned with a guard against concurrent updates
      const updateResult = await tx
        .update(adminStudentIds)
        .set({
          isAssigned: true,
          assignedToUserId: user.id,
          assignedAt: new Date(),
        })
        .where(
          and(
            eq(adminStudentIds.studentId, insertUser.studentId),
            eq(adminStudentIds.isAssigned, false) // Guard against race conditions
          )
        )
        .returning();
      
      if (!updateResult || updateResult.length === 0) {
        throw new Error("Failed to assign student ID - it may have been used concurrently");
      }
      
      return user;
    });
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

  // ==================== STUDENT ID MANAGEMENT ====================
  
  /**
   * Create a new student ID that can be assigned during registration
   * Auto-generates a random 8-character alphanumeric ID
   */
  async createStudentId(username: string, grade: number, className: string, adminId: string): Promise<AdminStudentId> {
    // Check if username already exists (case-insensitive check)
    const existingUsername = await this.getStudentIdByUsername(username);
    if (existingUsername) {
      throw new Error("A student ID has already been created for this username");
    }
    
    // Generate a random 8-character alphanumeric ID
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let studentId = '';
    for (let i = 0; i < 8; i++) {
      studentId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Check if ID already exists (very unlikely but possible)
    const existing = await this.getStudentIdRecord(studentId);
    if (existing) {
      // Recursively try again with a new random ID
      return this.createStudentId(username, grade, className, adminId);
    }
    
    const [record] = await db
      .insert(adminStudentIds)
      .values({
        username, // Preserve original casing
        studentId,
        grade,
        className,
        createdByAdminId: adminId,
      })
      .returning();
    return record;
  }

  /**
   * Get student ID record by the ID string
   */
  async getStudentIdRecord(studentId: string): Promise<AdminStudentId | undefined> {
    const [record] = await db
      .select()
      .from(adminStudentIds)
      .where(eq(adminStudentIds.studentId, studentId));
    return record || undefined;
  }

  /**
   * Get student ID record by username
   */
  async getStudentIdByUsername(username: string): Promise<AdminStudentId | undefined> {
    // Case-insensitive lookup using SQL lower() function
    const [record] = await db
      .select()
      .from(adminStudentIds)
      .where(sql`LOWER(${adminStudentIds.username}) = LOWER(${username})`);
    return record || undefined;
  }

  /**
   * Get all student IDs (for admin management interface)
   */
  async getAllStudentIds(): Promise<AdminStudentId[]> {
    return await db
      .select()
      .from(adminStudentIds)
      .orderBy(desc(adminStudentIds.createdAt));
  }

  /**
   * Delete a student ID (only if not assigned)
   */
  async deleteStudentId(id: string): Promise<boolean> {
    const result = await db
      .delete(adminStudentIds)
      .where(and(
        eq(adminStudentIds.id, id),
        eq(adminStudentIds.isAssigned, false) // Can only delete unassigned IDs
      ));
    return result.rowCount !== null && result.rowCount > 0;
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
        // Downgrade current admin to student
        await tx
          .update(users)
          .set({ 
            role: "student",
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
        message: `Admin privileges successfully transferred to ${successor.name}. You are now a student.`,
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
          likesCount: posts.likesCount,
          commentsCount: posts.commentsCount,
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

  async getEvents(scopeId?: string, userId?: string): Promise<any[]> {
    const baseQuery = db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        eventType: events.eventType,
        scopeId: events.scopeId,
        startTime: events.startTime,
        endTime: events.endTime,
        location: events.location,
        imageUrl: events.imageUrl,
        createdById: events.createdById,
        createdAt: events.createdAt,
        createdByName: users.name,
        createdByRole: users.role,
        createdByAvatarUrl: users.avatarUrl,
      })
      .from(events)
      .leftJoin(users, eq(events.createdById, users.id));

    if (scopeId) {
      const results = await baseQuery
        .where(eq(events.scopeId, scopeId))
        .orderBy(desc(events.startTime));
      
      // Add RSVP count and user's RSVP status for each event
      const eventsWithRsvps = await Promise.all(
        results.map(async (event) => {
          const rsvps = await this.getEventRsvps(event.id);
          const userHasRsvpd = userId ? rsvps.some(r => r.userId === userId) : false;
          return { ...event, rsvpCount: rsvps.length, userHasRsvpd };
        })
      );
      return eventsWithRsvps;
    }
    
    const results = await baseQuery.orderBy(desc(events.startTime));
    
    // Add RSVP count and user's RSVP status for each event
    const eventsWithRsvps = await Promise.all(
      results.map(async (event) => {
        const rsvps = await this.getEventRsvps(event.id);
        const userHasRsvpd = userId ? rsvps.some(r => r.userId === userId) : false;
        return { ...event, rsvpCount: rsvps.length, userHasRsvpd };
      })
    );
    return eventsWithRsvps;
  }

  async rsvpToEvent(eventId: string, userId: string): Promise<EventRsvp | null> {
    // Check if user already RSVP'd
    const existingRsvp = await db
      .select()
      .from(eventRsvps)
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)))
      .limit(1);
    
    if (existingRsvp.length > 0) {
      // User already RSVP'd - remove the RSVP (toggle off)
      await db
        .delete(eventRsvps)
        .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)));
      
      // Recalculate user's reputation after un-RSVP
      await this.calculateUserReputation(userId);
      
      return null; // Return null to indicate RSVP was removed
    } else {
      // User hasn't RSVP'd - add the RSVP (toggle on)
      const [rsvp] = await db.insert(eventRsvps).values({ eventId, userId }).returning();
      
      // Recalculate user's reputation after RSVP
      await this.calculateUserReputation(userId);
      
      return rsvp;
    }
  }

  async getEventRsvps(eventId: string): Promise<EventRsvp[]> {
    return await db.select().from(eventRsvps).where(eq(eventRsvps.eventId, eventId));
  }

  async getEventAttendees(eventId: string): Promise<User[]> {
    const attendees = await db
      .select({
        id: users.id,
        username: users.username,
        studentId: users.studentId,
        email: users.email,
        phone: users.phone,
        password: users.password,
        name: users.name,
        role: users.role,
        isSpecialAdmin: users.isSpecialAdmin,
        grade: users.grade,
        className: users.className,
        credibilityScore: users.credibilityScore,
        reputationScore: users.reputationScore,
        accountStatus: users.accountStatus,
        transportDetails: users.transportDetails,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(eventRsvps)
      .innerJoin(users, eq(eventRsvps.userId, users.id))
      .where(eq(eventRsvps.eventId, eventId))
      .orderBy(users.name);
    
    return attendees;
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
