import {
  users,
  scopes,
  digitalKeys,
  adminSuccessions,
  adminStudentIds,
  posts,
  postReactions,
  postAccuracyRatings,
  postComments,
  events,
  eventRsvps,
  eventComments,
  schedules,
  teachers,
  teacherReviews,
  teacherFeedback,
  profileComments,
  settings,
  passwordResetTokens,
  failedLoginAttempts,
  rememberMeTokens,
  friendships,
  chatMessages,
  contentViolations,
  userPunishments,
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
  type PostReaction,
  type InsertPostReaction,
  type PostAccuracyRating,
  type InsertPostAccuracyRating,
  type PostComment,
  type InsertPostComment,
  type Event,
  type InsertEvent,
  type EventRsvp,
  type InsertEventRsvp,
  type EventComment,
  type InsertEventComment,
  type Schedule,
  type InsertSchedule,
  type Teacher,
  type InsertTeacher,
  type TeacherReview,
  type InsertTeacherReview,
  type TeacherFeedback,
  type InsertTeacherFeedback,
  type ProfileComment,
  type InsertProfileComment,
  type Setting,
  type InsertSetting,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type FailedLoginAttempt,
  type InsertFailedLoginAttempt,
  type RememberMeToken,
  type InsertRememberMeToken,
  type Friendship,
  type InsertFriendship,
  type ChatMessage,
  type InsertChatMessage,
  type ContentViolation,
  type InsertContentViolation,
  type UserPunishment,
  type InsertUserPunishment,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import bcrypt from "bcrypt";

const CREDIBILITY_THRESHOLD_FOR_THREAT = 25.0; // Below this, account becomes "threatened"

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAdminUser(): Promise<User | undefined>;
  getVisitorUser(): Promise<User | undefined>;
  createVisitorUser(userData: InsertUser): Promise<User>;
  getStudentsByClass(grade: number, className: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(userId: string, updates: { bio?: string; avatarUrl?: string; grade?: number; className?: string; empathy?: number; angerManagement?: number; cooperation?: number; selfConfidence?: number; acceptingCriticism?: number; listening?: number; problemSolving?: number; creativity?: number; memoryFocus?: number; planningOrganization?: number; communicationExpression?: number; leadershipInitiative?: number; artisticCreative?: number; athleticPhysical?: number; technicalTech?: number; linguisticReading?: number; socialHumanitarian?: number; naturalEnvironmental?: number; hobbies?: string[] }): Promise<User | undefined>;
  updateUserCredibility(userId: string, newScore: number): Promise<User | undefined>;
  updateUserReputation(userId: string, newScore: number): Promise<User | undefined>;
  deleteUser(userId: string): Promise<boolean>;
  deleteStudentAccount(userId: string): Promise<boolean>;
  deleteTeacherAccount(teacherId: string): Promise<boolean>;
  
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
  
  // Admin Promotion (without demotion)
  promoteUserToAdmin(currentAdminId: string, userId: string): Promise<{ success: boolean; message: string }>;
  
  // Credibility & Reputation Engine
  calculateUserReputation(userId: string): Promise<number>;
  checkAndUpdateAccountStatus(userId: string): Promise<void>;
  
  // Scopes
  getScope(id: string): Promise<Scope | undefined>;
  getAllScopes(): Promise<Scope[]>;
  createScope(scope: InsertScope): Promise<Scope>;
  deleteScope(id: string): Promise<boolean>;
  
  // Posts
  createPost(post: InsertPost): Promise<Post>;
  getPosts(scopeId?: string | null, userId?: string): Promise<any[]>;
  getPost(id: string): Promise<Post | undefined>;
  updatePost(postId: string, content: string): Promise<Post | undefined>;
  updatePostCredibility(postId: string, rating: number): Promise<Post | undefined>;
  deletePost(postId: string): Promise<boolean>;
  ratePostAccuracy(postId: string, userId: string, rating: number): Promise<PostAccuracyRating>;
  getUserPostAccuracyRating(postId: string, userId: string): Promise<PostAccuracyRating | undefined>;
  
  // Events
  createEvent(event: InsertEvent): Promise<Event>;
  getEvents(scopeId?: string, userId?: string): Promise<any[]>;
  rsvpToEvent(eventId: string, userId: string): Promise<EventRsvp | null>;
  getEventRsvps(eventId: string): Promise<EventRsvp[]>;
  getUserRsvps(userId: string): Promise<EventRsvp[]>;
  getEventAttendees(eventId: string): Promise<User[]>;
  
  // Schedules
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  getSchedules(scopeId: string): Promise<Schedule[]>;
  updateSchedule(id: string, teacherName: string, subject: string): Promise<Schedule | undefined>;
  bulkUpdateSchedules(scopeId: string, updates: Array<{ dayOfWeek: number; periodNumber: number; subject: string | null; teacherName: string | null }>): Promise<void>;
  
  // Teachers
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  getTeachers(): Promise<Teacher[]>;
  getTeacher(id: string): Promise<Teacher | undefined>;
  updateTeacher(id: string, updates: Partial<InsertTeacher>): Promise<Teacher | undefined>;
  deleteTeacher(id: string): Promise<boolean>;
  getTeacherWithReviews(id: string): Promise<{ teacher: Teacher; reviews: TeacherReview[]; averageRating: number } | undefined>;
  
  // Teacher Reviews
  createTeacherReview(review: InsertTeacherReview): Promise<TeacherReview>;
  getTeacherReviews(teacherId: string): Promise<TeacherReview[]>;
  
  // Teacher Feedback
  createTeacherFeedback(feedback: InsertTeacherFeedback): Promise<TeacherFeedback>;
  getTeacherFeedback(teacherId: string): Promise<TeacherFeedback[]>;
  getTeacherFeedbackStats(teacherId: string): Promise<{ averages: Record<string, number>; count: number }>;
  
  // Post Comments
  createPostComment(comment: InsertPostComment): Promise<PostComment>;
  getPostComments(postId: string): Promise<PostComment[]>;

  // Event Comments
  createEventComment(comment: InsertEventComment): Promise<EventComment>;
  getEventComments(eventId: string): Promise<EventComment[]>;

  // Profile Comments
  createProfileComment(comment: InsertProfileComment): Promise<ProfileComment>;
  getProfileComments(profileUserId: string): Promise<ProfileComment[]>;
  
  // Settings
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(key: string, value: string): Promise<Setting>;

  // Password Recovery
  createPasswordResetToken(userId: string): Promise<string>;
  validatePasswordResetToken(token: string): Promise<User | undefined>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;
  
  // Friends
  sendFriendRequest(user1Id: string, user2Id: string): Promise<Friendship>;
  acceptFriendRequest(friendshipId: string): Promise<Friendship | undefined>;
  rejectFriendRequest(friendshipId: string): Promise<Friendship | undefined>;
  getFriends(userId: string): Promise<User[]>;
  getPendingFriendRequests(userId: string): Promise<Array<Friendship & { initiator: User }>>;
  unfriend(user1Id: string, user2Id: string): Promise<boolean>;
  getFriendship(user1Id: string, user2Id: string): Promise<Friendship | undefined>;
  
  // Chat
  sendChatMessage(senderId: string, receiverId: string, content: string): Promise<ChatMessage>;
  getChatMessages(user1Id: string, user2Id: string): Promise<ChatMessage[]>;
  markMessageAsRead(messageId: string): Promise<ChatMessage | undefined>;
  getUnreadMessageCount(userId: string): Promise<number>;
  
  // Content Moderation
  createViolation(violation: InsertContentViolation): Promise<ContentViolation>;
  getUserViolations(userId: string): Promise<ContentViolation[]>;
  getUserViolationCount(userId: string): Promise<number>;
  
  // Punishments
  createPunishment(punishment: InsertUserPunishment): Promise<UserPunishment>;
  getUserPunishments(userId: string): Promise<UserPunishment[]>;
  applyPunishment(userId: string, credibilityPenalty: number, banUntil?: Date): Promise<User | undefined>;
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

  async getAdminUser(): Promise<User | undefined> {
    const [admin] = await db.select().from(users).where(eq(users.role, "admin"));
    return admin || undefined;
  }

  async getVisitorUser(): Promise<User | undefined> {
    const [visitor] = await db.select().from(users).where(eq(users.role, "visitor"));
    return visitor || undefined;
  }

  async createVisitorUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
        role: "visitor",
      })
      .returning();
    
    return user;
  }

  // ==================== FAILED LOGIN TRACKING ====================
  
  async getFailedLoginAttempts(username: string) {
    const [attempt] = await db
      .select()
      .from(failedLoginAttempts)
      .where(eq(failedLoginAttempts.username, sql`LOWER(${username})`));
    return attempt;
  }

  async recordFailedLogin(username: string): Promise<void> {
    const existing = await this.getFailedLoginAttempts(username);
    
    if (existing) {
      const newCount = existing.attemptCount + 1;
      const isLocked = newCount >= 3;
      const lockDuration = 15 * 60 * 1000; // 15 minutes in ms
      
      await db
        .update(failedLoginAttempts)
        .set({
          attemptCount: newCount,
          lastAttemptAt: new Date(),
          lockedUntil: isLocked ? new Date(Date.now() + lockDuration) : null,
        })
        .where(eq(failedLoginAttempts.id, existing.id));
    } else {
      await db.insert(failedLoginAttempts).values({
        username: username.toLowerCase(),
        attemptCount: 1,
        lastAttemptAt: new Date(),
      });
    }
  }

  async clearFailedLoginAttempts(username: string): Promise<void> {
    await db
      .delete(failedLoginAttempts)
      .where(eq(failedLoginAttempts.username, sql`LOWER(${username})`));
  }

  async isAccountLocked(username: string): Promise<boolean> {
    const attempt = await this.getFailedLoginAttempts(username);
    
    if (!attempt || !attempt.lockedUntil) {
      return false;
    }
    
    // Check if lock has expired
    if (new Date() > attempt.lockedUntil) {
      // Lock expired, clear the record
      await this.clearFailedLoginAttempts(username);
      return false;
    }
    
    return true;
  }

  // ==================== REMEMBER ME TOKENS ====================
  
  async createRememberMeToken(
    userId: string, 
    token: string, 
    deviceFingerprint?: string
  ): Promise<void> {
    const sevenDays = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    
    await db.insert(rememberMeTokens).values({
      userId,
      token,
      deviceFingerprint,
      expiresAt: new Date(Date.now() + sevenDays),
    });
  }

  async getRememberMeToken(token: string) {
    const [tokenRecord] = await db
      .select()
      .from(rememberMeTokens)
      .where(eq(rememberMeTokens.token, token));
    return tokenRecord;
  }

  async updateRememberMeTokenActivity(tokenId: string): Promise<void> {
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    
    await db
      .update(rememberMeTokens)
      .set({
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + sevenDays), // Extend expiry on each use
      })
      .where(eq(rememberMeTokens.id, tokenId));
  }

  async deleteRememberMeToken(token: string): Promise<void> {
    await db
      .delete(rememberMeTokens)
      .where(eq(rememberMeTokens.token, token));
  }

  async cleanupExpiredRememberMeTokens(): Promise<void> {
    await db
      .delete(rememberMeTokens)
      .where(sql`${rememberMeTokens.expiresAt} < ${new Date()}`);
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

  async updateUserProfile(userId: string, updates: { bio?: string; avatarUrl?: string; grade?: number; className?: string; empathy?: number; angerManagement?: number; cooperation?: number; selfConfidence?: number; acceptingCriticism?: number; listening?: number; problemSolving?: number; creativity?: number; memoryFocus?: number; planningOrganization?: number; communicationExpression?: number; leadershipInitiative?: number; artisticCreative?: number; athleticPhysical?: number; technicalTech?: number; linguisticReading?: number; socialHumanitarian?: number; naturalEnvironmental?: number; hobbies?: string[] }): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        bio: updates.bio,
        avatarUrl: updates.avatarUrl,
        grade: updates.grade,
        className: updates.className,
        empathy: updates.empathy,
        angerManagement: updates.angerManagement,
        cooperation: updates.cooperation,
        selfConfidence: updates.selfConfidence,
        acceptingCriticism: updates.acceptingCriticism,
        listening: updates.listening,
        problemSolving: updates.problemSolving,
        creativity: updates.creativity,
        memoryFocus: updates.memoryFocus,
        planningOrganization: updates.planningOrganization,
        communicationExpression: updates.communicationExpression,
        leadershipInitiative: updates.leadershipInitiative,
        artisticCreative: updates.artisticCreative,
        athleticPhysical: updates.athleticPhysical,
        technicalTech: updates.technicalTech,
        linguisticReading: updates.linguisticReading,
        socialHumanitarian: updates.socialHumanitarian,
        naturalEnvironmental: updates.naturalEnvironmental,
        hobbies: updates.hobbies,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
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

  async deleteUser(userId: string): Promise<boolean> {
    try {
      const result = await db.delete(users).where(eq(users.id, userId));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Failed to delete user:", error);
      return false;
    }
  }

  async deleteStudentAccount(userId: string): Promise<boolean> {
    try {
      return await db.transaction(async (tx) => {
        // Delete all posts by the user
        await tx.delete(posts).where(eq(posts.authorId, userId));
        
        // Delete all post comments by the user
        await tx.delete(postComments).where(eq(postComments.authorId, userId));
        
        // Delete all post reactions by the user
        await tx.delete(postReactions).where(eq(postReactions.userId, userId));
        
        // Delete all post accuracy ratings by the user
        await tx.delete(postAccuracyRatings).where(eq(postAccuracyRatings.userId, userId));
        
        // Delete all profile comments by the user
        await tx.delete(profileComments).where(eq(profileComments.authorId, userId));
        
        // Delete all profile comments on the user's profile
        await tx.delete(profileComments).where(eq(profileComments.profileUserId, userId));
        
        // Delete all event RSVPs by the user
        await tx.delete(eventRsvps).where(eq(eventRsvps.userId, userId));
        
        // Delete all event comments by the user
        await tx.delete(eventComments).where(eq(eventComments.authorId, userId));
        
        // Delete all teacher reviews by the user
        await tx.delete(teacherReviews).where(eq(teacherReviews.studentId, userId));
        
        // Delete all digital keys (unlocked scopes)
        await tx.delete(digitalKeys).where(eq(digitalKeys.userId, userId));
        
        // Delete admin student IDs assigned to this user
        await tx.delete(adminStudentIds).where(eq(adminStudentIds.assignedToUserId, userId));
        
        // Finally, delete the user record
        const result = await tx.delete(users).where(eq(users.id, userId));
        
        return result.rowCount ? result.rowCount > 0 : false;
      });
    } catch (error) {
      console.error("Failed to delete student account:", error);
      return false;
    }
  }

  async deleteTeacherAccount(teacherId: string): Promise<boolean> {
    try {
      return await db.transaction(async (tx) => {
        // Get the teacher record first to find the associated userId
        const [teacher] = await tx
          .select()
          .from(teachers)
          .where(eq(teachers.id, teacherId));
        
        if (!teacher) {
          throw new Error("Teacher not found");
        }

        const userId = teacher.userId;

        // Delete all teacher reviews for this teacher
        await tx.delete(teacherReviews).where(eq(teacherReviews.teacherId, teacherId));
        
        // Delete the teacher record itself
        await tx.delete(teachers).where(eq(teachers.id, teacherId));
        
        // If teacher has an associated user account, delete all their data
        if (userId) {
          // Delete all posts by the teacher
          await tx.delete(posts).where(eq(posts.authorId, userId));
          
          // Delete all post comments by the teacher
          await tx.delete(postComments).where(eq(postComments.authorId, userId));
          
          // Delete all post reactions by the teacher
          await tx.delete(postReactions).where(eq(postReactions.userId, userId));
          
          // Delete all post accuracy ratings by the teacher
          await tx.delete(postAccuracyRatings).where(eq(postAccuracyRatings.userId, userId));
          
          // Delete all profile comments by the teacher
          await tx.delete(profileComments).where(eq(profileComments.authorId, userId));
          
          // Delete all profile comments on the teacher's profile
          await tx.delete(profileComments).where(eq(profileComments.profileUserId, userId));
          
          // Delete all event RSVPs by the teacher
          await tx.delete(eventRsvps).where(eq(eventRsvps.userId, userId));
          
          // Delete all event comments by the teacher
          await tx.delete(eventComments).where(eq(eventComments.authorId, userId));
          
          // Delete all schedules associated with this teacher (if any stored that way)
          // Note: schedules are typically just text fields, so cascading should handle it
          
          // Delete all digital keys (unlocked scopes)
          await tx.delete(digitalKeys).where(eq(digitalKeys.userId, userId));
          
          // Finally, delete the user record
          await tx.delete(users).where(eq(users.id, userId));
        }
        
        return true;
      });
    } catch (error) {
      console.error("Failed to delete teacher account:", error);
      return false;
    }
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
   * Get all assigned students (students with assigned user IDs) for admin management
   */
  async getAssignedStudents(): Promise<(User & { assignedDate: string | null })[]> {
    const result = await db
      .select({
        ...users,
        assignedDate: adminStudentIds.assignedAt,
      })
      .from(users)
      .leftJoin(adminStudentIds, eq(adminStudentIds.assignedToUserId, users.id))
      .where(eq(users.role, "student"))
      .orderBy(desc(users.createdAt));
    
    return result as any;
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

  /**
   * Admin Promotion: Allow an admin to promote another user to admin role
   * WITHOUT demoting themselves (different from handover)
   */
  async promoteUserToAdmin(
    currentAdminId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    const currentAdmin = await this.getUser(currentAdminId);
    if (!currentAdmin || currentAdmin.role !== "admin") {
      return { success: false, message: "Only admins can promote users" };
    }

    const targetUser = await this.getUser(userId);
    if (!targetUser) {
      return { success: false, message: "User not found" };
    }

    if (targetUser.role === "admin") {
      return { success: false, message: "User is already an admin" };
    }

    if (currentAdminId === userId) {
      return { success: false, message: "You are already an admin" };
    }

    try {
      await db
        .update(users)
        .set({ 
          role: "admin",
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return { 
        success: true, 
        message: `Successfully promoted ${targetUser.name} to admin` 
      };
    } catch (error) {
      console.error("Error promoting user to admin:", error);
      return { success: false, message: "Failed to promote user to admin" };
    }
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
    // For public scopes, ensure accessCode is null
    const scopeData = insertScope.type === "public" 
      ? { ...insertScope, accessCode: null }
      : insertScope;
    const [scope] = await db.insert(scopes).values(scopeData).returning();
    return scope;
  }

  async deleteScope(id: string): Promise<boolean> {
    // Get the scope to check its type
    const scope = await this.getScope(id);
    if (!scope) {
      throw new Error("Scope not found");
    }

    // If it's a grade scope, check for dependent section scopes
    if (scope.type === "grade" && scope.gradeNumber) {
      const dependentSections = await db
        .select()
        .from(scopes)
        .where(
          and(
            eq(scopes.type, "section"),
            sql`${scopes.sectionName} LIKE ${scope.gradeNumber + '-%'}`
          )
        );
      
      if (dependentSections.length > 0) {
        throw new Error(`Cannot delete grade scope: ${dependentSections.length} class section(s) belong to this grade. Delete the class sections first.`);
      }
    }

    // Check if scope has digital keys (users with access)
    const keysCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(digitalKeys)
      .where(eq(digitalKeys.scopeId, id));
    
    if (keysCount[0]?.count > 0) {
      throw new Error(`Cannot delete scope: ${keysCount[0].count} user(s) have access to this scope`);
    }

    // Check if scope has posts
    const postsCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(posts)
      .where(eq(posts.scopeId, id));
    
    if (postsCount[0]?.count > 0) {
      throw new Error(`Cannot delete scope: ${postsCount[0].count} post(s) exist in this scope`);
    }

    // Check if scope has events
    const eventsCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(events)
      .where(eq(events.scopeId, id));
    
    if (eventsCount[0]?.count > 0) {
      throw new Error(`Cannot delete scope: ${eventsCount[0].count} event(s) exist in this scope`);
    }

    // Check if scope has schedules
    const schedulesCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schedules)
      .where(eq(schedules.scopeId, id));
    
    if (schedulesCount[0]?.count > 0) {
      throw new Error(`Cannot delete scope: ${schedulesCount[0].count} schedule(s) exist in this scope`);
    }

    // All checks passed, safe to delete
    const result = await db.delete(scopes).where(eq(scopes.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // ==================== POSTS ====================
  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db.insert(posts).values(insertPost).returning();
    
    // Recalculate author's reputation after posting
    await this.calculateUserReputation(insertPost.authorId);
    
    return post;
  }

  async getPosts(scopeId?: string | null, userId?: string): Promise<any[]> {
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
          authorCredibilityScore: users.credibilityScore,
        })
        .from(posts)
        .leftJoin(users, eq(posts.authorId, users.id))
        .where(sql`${posts.scopeId} IS NULL`)
        .orderBy(desc(posts.createdAt));
      
      // Get user's liked posts if userId provided
      const likedPostIds = userId ? (await db
        .select({ postId: postReactions.postId })
        .from(postReactions)
        .where(eq(postReactions.userId, userId)))
        .map(r => r.postId) : [];
      
      // Get user's accuracy ratings if userId provided (gracefully handle if table doesn't exist yet)
      let accuracyRatings: Record<string, number> = {};
      try {
        if (userId) {
          const ratings = await db
            .select({ postId: postAccuracyRatings.postId, rating: postAccuracyRatings.rating })
            .from(postAccuracyRatings)
            .where(eq(postAccuracyRatings.userId, userId));
          accuracyRatings = ratings.reduce((map, r) => ({ ...map, [r.postId]: r.rating }), {});
        }
      } catch (error) {
        // Table might not exist yet, continue without accuracy ratings
      }
      
      // Transform to ensure author always exists and include liked status
      return results.map(post => {
        return {
          ...post,
          isLikedByCurrentUser: likedPostIds.includes(post.id),
          currentUserAccuracyRating: accuracyRatings[post.id] || null,
          author: {
            name: post.authorName || "Unknown User",
            role: post.authorRole || "student",
            avatarUrl: post.authorAvatarUrl,
          },
        };
      });
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
        likesCount: posts.likesCount,
        commentsCount: posts.commentsCount,
        createdAt: posts.createdAt,
        authorName: users.name,
        authorRole: users.role,
        authorAvatarUrl: users.avatarUrl,
        authorCredibilityScore: users.credibilityScore,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.scopeId, scopeId))
      .orderBy(desc(posts.createdAt));
    
    // Get user's liked posts if userId provided
    const likedPostIds = userId ? (await db
      .select({ postId: postReactions.postId })
      .from(postReactions)
      .where(eq(postReactions.userId, userId)))
      .map(r => r.postId) : [];
    
    // Get user's accuracy ratings if userId provided (gracefully handle if table doesn't exist yet)
    let accuracyRatings2: Record<string, number> = {};
    try {
      if (userId) {
        const ratings = await db
          .select({ postId: postAccuracyRatings.postId, rating: postAccuracyRatings.rating })
          .from(postAccuracyRatings)
          .where(eq(postAccuracyRatings.userId, userId));
        accuracyRatings2 = ratings.reduce((map, r) => ({ ...map, [r.postId]: r.rating }), {});
      }
    } catch (error) {
      // Table might not exist yet, continue without accuracy ratings
    }
    
    // Transform to ensure author always exists and include liked status
    return results.map(post => {
      return {
        ...post,
        isLikedByCurrentUser: likedPostIds.includes(post.id),
        currentUserAccuracyRating: accuracyRatings2[post.id] || null,
        author: {
          name: post.authorName || "Unknown User",
          role: post.authorRole || "student",
          avatarUrl: post.authorAvatarUrl,
        },
      };
    });
  }

  async getPost(id: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post || undefined;
  }

  async updatePost(postId: string, content: string): Promise<Post | undefined> {
    const [post] = await db
      .update(posts)
      .set({ 
        content,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId))
      .returning();
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

  async deletePost(postId: string): Promise<boolean> {
    try {
      const result = await db.delete(posts).where(eq(posts.id, postId));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Failed to delete post:", error);
      return false;
    }
  }

  async ratePostAccuracy(postId: string, userId: string, rating: number): Promise<PostAccuracyRating> {
    try {
      // Check if rating already exists
      const existing = await db
        .select()
        .from(postAccuracyRatings)
        .where(and(
          eq(postAccuracyRatings.postId, postId),
          eq(postAccuracyRatings.userId, userId)
        ));

      let result;
      if (existing.length > 0) {
        // Update existing rating
        const [updated] = await db
          .update(postAccuracyRatings)
          .set({ 
            rating,
            updatedAt: new Date(),
          })
          .where(and(
            eq(postAccuracyRatings.postId, postId),
            eq(postAccuracyRatings.userId, userId)
          ))
          .returning();
        result = updated;
      } else {
        // Create new rating
        const [created] = await db
          .insert(postAccuracyRatings)
          .values({ postId, userId, rating })
          .returning();
        result = created;
      }

      // Recalculate post author's credibility based on ALL accuracy ratings across ALL their posts
      const post = await this.getPost(postId);
      if (post) {
        try {
          // Get all posts by the author
          const authorPosts = await db
            .select({ id: posts.id })
            .from(posts)
            .where(eq(posts.authorId, post.authorId));
          
          const postIds = authorPosts.map(p => p.id);
          
          // Get all accuracy ratings for all author's posts
          let allAccuracyRatings: any[] = [];
          if (postIds.length > 0) {
            allAccuracyRatings = await db
              .select()
              .from(postAccuracyRatings)
              .where(inArray(postAccuracyRatings.postId, postIds));
          }
          
          // Calculate average credibility: average of all ratings * 20
          let avgCredibility = 50;
          if (allAccuracyRatings.length > 0) {
            const sumRatings = allAccuracyRatings.reduce((sum, r) => sum + r.rating, 0);
            avgCredibility = (sumRatings / allAccuracyRatings.length) * 20;
          }
          
          // Update user credibility
          await this.updateUserCredibility(post.authorId, avgCredibility);
        } catch (e) {
          // Ignore errors in recalculating credibility
        }
      }

      return result;
    } catch (error) {
      // If table doesn't exist or other error, throw it so the API can handle it
      throw error;
    }
  }

  async getUserPostAccuracyRating(postId: string, userId: string): Promise<PostAccuracyRating | undefined> {
    const [rating] = await db
      .select()
      .from(postAccuracyRatings)
      .where(and(
        eq(postAccuracyRatings.postId, postId),
        eq(postAccuracyRatings.userId, userId)
      ));
    return rating || undefined;
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
          
          return { 
            ...event, 
            rsvpCount: rsvps.length, 
            userHasRsvpd,
            createdBy: {
              name: event.createdByName || "Unknown User",
              role: event.createdByRole || "student",
              avatarUrl: event.createdByAvatarUrl,
            }
          };
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
        
        return { 
          ...event, 
          rsvpCount: rsvps.length, 
          userHasRsvpd,
          createdBy: {
            name: event.createdByName || "Unknown User",
            role: event.createdByRole || "student",
            avatarUrl: event.createdByAvatarUrl,
          }
        };
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

  async getUserRsvps(userId: string): Promise<EventRsvp[]> {
    return await db.select().from(eventRsvps).where(eq(eventRsvps.userId, userId));
  }

  async getEventAttendees(eventId: string): Promise<User[]> {
    const attendees = await db
      .select()
      .from(eventRsvps)
      .innerJoin(users, eq(eventRsvps.userId, users.id))
      .where(eq(eventRsvps.eventId, eventId))
      .orderBy(users.name);
    
    return attendees.map(row => row.users);
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

  async bulkUpdateSchedules(scopeId: string, updates: Array<{ dayOfWeek: number; periodNumber: number; subject: string | null; teacherName: string | null }>): Promise<void> {
    for (const update of updates) {
      // Check if schedule exists for this slot
      const [existing] = await db
        .select()
        .from(schedules)
        .where(
          and(
            eq(schedules.scopeId, scopeId),
            eq(schedules.dayOfWeek, update.dayOfWeek),
            eq(schedules.periodNumber, update.periodNumber)
          )
        );

      if (existing) {
        // Update existing schedule
        await db
          .update(schedules)
          .set({
            subject: update.subject,
            teacherName: update.teacherName,
            updatedAt: new Date(),
          })
          .where(eq(schedules.id, existing.id));
      } else if (update.subject || update.teacherName) {
        // Create new schedule entry only if there's actual data
        await db.insert(schedules).values({
          scopeId,
          dayOfWeek: update.dayOfWeek,
          periodNumber: update.periodNumber,
          subject: update.subject,
          teacherName: update.teacherName,
        });
      }
    }
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

  async updateTeacher(id: string, updates: Partial<InsertTeacher>): Promise<Teacher | undefined> {
    const [updated] = await db
      .update(teachers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(teachers.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTeacher(id: string): Promise<boolean> {
    const result = await db.delete(teachers).where(eq(teachers.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getTeacherWithReviews(id: string): Promise<{ teacher: Teacher; reviews: TeacherReview[]; averageRating: number } | undefined> {
    const teacher = await this.getTeacher(id);
    if (!teacher) return undefined;

    const reviews = await this.getTeacherReviews(id);
    
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    return { teacher, reviews, averageRating };
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

  async createTeacherFeedback(insertFeedback: InsertTeacherFeedback): Promise<TeacherFeedback> {
    const [feedback] = await db.insert(teacherFeedback).values(insertFeedback).returning();
    return feedback;
  }

  async getTeacherFeedbackByStudent(teacherId: string, studentId: string): Promise<TeacherFeedback | undefined> {
    const [feedback] = await db
      .select()
      .from(teacherFeedback)
      .where(
        and(
          eq(teacherFeedback.teacherId, teacherId),
          eq(teacherFeedback.studentId, studentId)
        )
      );
    return feedback || undefined;
  }

  async updateTeacherFeedback(teacherId: string, studentId: string, updates: Partial<InsertTeacherFeedback>): Promise<TeacherFeedback | undefined> {
    const [feedback] = await db
      .update(teacherFeedback)
      .set(updates)
      .where(
        and(
          eq(teacherFeedback.teacherId, teacherId),
          eq(teacherFeedback.studentId, studentId)
        )
      )
      .returning();
    return feedback || undefined;
  }

  async getTeacherFeedback(teacherId: string): Promise<TeacherFeedback[]> {
    return await db
      .select()
      .from(teacherFeedback)
      .where(eq(teacherFeedback.teacherId, teacherId))
      .orderBy(desc(teacherFeedback.createdAt));
  }

  async getTeacherFeedbackStats(teacherId: string): Promise<{ averages: Record<string, number>; count: number }> {
    const feedbacks = await this.getTeacherFeedback(teacherId);
    
    if (feedbacks.length === 0) {
      return {
        averages: {
          clarity: 0,
          instruction: 0,
          communication: 0,
          patience: 0,
          motivation: 0,
          improvement: 0,
        },
        count: 0,
      };
    }

    const totals = feedbacks.reduce(
      (acc, f) => ({
        clarity: acc.clarity + f.clarity,
        instruction: acc.instruction + f.instruction,
        communication: acc.communication + f.communication,
        patience: acc.patience + f.patience,
        motivation: acc.motivation + f.motivation,
        improvement: acc.improvement + f.improvement,
      }),
      { clarity: 0, instruction: 0, communication: 0, patience: 0, motivation: 0, improvement: 0 }
    );

    const count = feedbacks.length;

    return {
      averages: {
        clarity: totals.clarity / count,
        instruction: totals.instruction / count,
        communication: totals.communication / count,
        patience: totals.patience / count,
        motivation: totals.motivation / count,
        improvement: totals.improvement / count,
      },
      count,
    };
  }

  // ==================== POST COMMENTS ====================
  async createPostComment(insertComment: InsertPostComment): Promise<PostComment> {
    const [comment] = await db.insert(postComments).values(insertComment).returning();
    await db
      .update(posts)
      .set({ commentsCount: sql`${posts.commentsCount} + 1` })
      .where(eq(posts.id, insertComment.postId));
    return comment;
  }

  async getPostComments(postId: string): Promise<Array<PostComment & { authorName?: string; authorRole?: string; authorAvatarUrl?: string | null }>> {
    const results = await db
      .select({
        id: postComments.id,
        postId: postComments.postId,
        content: postComments.content,
        createdAt: postComments.createdAt,
        authorId: postComments.authorId,
        authorName: users.name,
        authorRole: users.role,
        authorAvatarUrl: users.avatarUrl,
      })
      .from(postComments)
      .leftJoin(users, eq(postComments.authorId, users.id))
      .where(eq(postComments.postId, postId))
      .orderBy(desc(postComments.createdAt));
    
    return results as Array<PostComment & { authorName?: string; authorRole?: string; authorAvatarUrl?: string | null }>;
  }

  // ==================== EVENT COMMENTS ====================
  async createEventComment(insertComment: InsertEventComment): Promise<EventComment> {
    const [comment] = await db.insert(eventComments).values(insertComment).returning();
    return comment;
  }

  async getEventComments(eventId: string): Promise<Array<EventComment & { authorName?: string; authorRole?: string; authorAvatarUrl?: string | null }>> {
    const results = await db
      .select({
        id: eventComments.id,
        eventId: eventComments.eventId,
        content: eventComments.content,
        createdAt: eventComments.createdAt,
        authorId: eventComments.authorId,
        authorName: users.name,
        authorRole: users.role,
        authorAvatarUrl: users.avatarUrl,
      })
      .from(eventComments)
      .leftJoin(users, eq(eventComments.authorId, users.id))
      .where(eq(eventComments.eventId, eventId))
      .orderBy(desc(eventComments.createdAt));
    
    return results as Array<EventComment & { authorName?: string; authorRole?: string; authorAvatarUrl?: string | null }>;
  }

  // ==================== PROFILE COMMENTS ====================
  async createProfileComment(insertComment: InsertProfileComment): Promise<ProfileComment> {
    const [comment] = await db.insert(profileComments).values(insertComment).returning();
    return comment;
  }

  async getProfileComments(profileUserId: string): Promise<Array<ProfileComment & { authorName?: string; authorRole?: string; authorAvatarUrl?: string | null }>> {
    const results = await db
      .select({
        id: profileComments.id,
        profileUserId: profileComments.profileUserId,
        content: profileComments.content,
        rating: profileComments.rating,
        createdAt: profileComments.createdAt,
        authorId: profileComments.authorId,
        authorName: users.name,
        authorRole: users.role,
        authorAvatarUrl: users.avatarUrl,
      })
      .from(profileComments)
      .leftJoin(users, eq(profileComments.authorId, users.id))
      .where(eq(profileComments.profileUserId, profileUserId))
      .orderBy(desc(profileComments.createdAt));
    
    return results as Array<ProfileComment & { authorName?: string; authorRole?: string; authorAvatarUrl?: string | null }>;
  }

  // ==================== POST REACTIONS ====================
  async createPostReaction(postId: string, userId: string): Promise<PostReaction> {
    const [reaction] = await db
      .insert(postReactions)
      .values({ postId, userId })
      .returning();
    
    // Increment likes count
    await db
      .update(posts)
      .set({ likesCount: sql`${posts.likesCount} + 1` })
      .where(eq(posts.id, postId));
    
    return reaction;
  }

  async deletePostReaction(postId: string, userId: string): Promise<void> {
    const result = await db
      .delete(postReactions)
      .where(
        and(
          eq(postReactions.postId, postId),
          eq(postReactions.userId, userId)
        )
      )
      .returning();
    
    // Only decrement likes count if a reaction was actually deleted
    if (result.length > 0) {
      await db
        .update(posts)
        .set({ likesCount: sql`GREATEST(${posts.likesCount} - 1, 0)` })
        .where(eq(posts.id, postId));
    }
  }

  async getUserPostReaction(postId: string, userId: string): Promise<PostReaction | undefined> {
    const [reaction] = await db
      .select()
      .from(postReactions)
      .where(
        and(
          eq(postReactions.postId, postId),
          eq(postReactions.userId, userId)
        )
      );
    
    return reaction;
  }


  // ==================== SETTINGS ====================
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));
    return setting || undefined;
  }

  async setSetting(key: string, value: string): Promise<Setting> {
    const existingSetting = await this.getSetting(key);

    if (existingSetting) {
      // Update existing setting
      const [updated] = await db
        .update(settings)
        .set({
          value,
          updatedAt: new Date(),
        })
        .where(eq(settings.key, key))
        .returning();
      return updated;
    } else {
      // Insert new setting
      const [inserted] = await db
        .insert(settings)
        .values({
          key,
          value,
        })
        .returning();
      return inserted;
    }
  }

  // ==================== PASSWORD RESET ====================
  async createPasswordResetToken(userId: string): Promise<string> {
    // Generate a random token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Delete any existing tokens for this user
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
    
    // Create new token (expires in 1 hour)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
    });
    
    return token;
  }

  async validatePasswordResetToken(token: string): Promise<User | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));

    if (!resetToken || resetToken.expiresAt < new Date()) {
      return undefined;
    }

    const user = await this.getUser(resetToken.userId);
    return user;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      return await db.transaction(async (tx) => {
        const [resetToken] = await tx
          .select()
          .from(passwordResetTokens)
          .where(eq(passwordResetTokens.token, token));

        if (!resetToken || resetToken.expiresAt < new Date()) {
          return false;
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await tx
          .update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, resetToken.userId));

        await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));

        return true;
      });
    } catch (error) {
      console.error("Failed to reset password:", error);
      return false;
    }
  }

  // ==================== FRIENDS ====================
  async sendFriendRequest(user1Id: string, user2Id: string): Promise<Friendship> {
    const [lowerId, higherId] = [user1Id, user2Id].sort();
    
    const [friendship] = await db
      .insert(friendships)
      .values({
        user1Id: lowerId,
        user2Id: higherId,
        initiatorId: user1Id,
        status: "pending",
      })
      .returning();
    
    return friendship;
  }

  async acceptFriendRequest(friendshipId: string): Promise<Friendship | undefined> {
    const [friendship] = await db
      .update(friendships)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(friendships.id, friendshipId))
      .returning();
    
    return friendship || undefined;
  }

  async rejectFriendRequest(friendshipId: string): Promise<Friendship | undefined> {
    const [friendship] = await db
      .update(friendships)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(friendships.id, friendshipId))
      .returning();
    
    return friendship || undefined;
  }

  async getFriends(userId: string): Promise<User[]> {
    const friendshipsData = await db
      .select()
      .from(friendships)
      .where(
        and(
          sql`(${friendships.user1Id} = ${userId} OR ${friendships.user2Id} = ${userId})`,
          eq(friendships.status, "accepted")
        )
      );
    
    const friendIds = friendshipsData.map((f) =>
      f.user1Id === userId ? f.user2Id : f.user1Id
    );
    
    if (friendIds.length === 0) return [];
    
    const friends = await db
      .select()
      .from(users)
      .where(inArray(users.id, friendIds));
    
    return friends;
  }

  async getPendingFriendRequests(userId: string): Promise<Array<Friendship & { initiator: User }>> {
    const requests = await db
      .select({
        friendship: friendships,
        initiator: users,
      })
      .from(friendships)
      .innerJoin(users, eq(friendships.initiatorId, users.id))
      .where(
        and(
          sql`(${friendships.user1Id} = ${userId} OR ${friendships.user2Id} = ${userId})`,
          eq(friendships.status, "pending"),
          sql`${friendships.initiatorId} != ${userId}`
        )
      );
    
    return requests.map((r) => ({ ...r.friendship, initiator: r.initiator }));
  }

  async unfriend(user1Id: string, user2Id: string): Promise<boolean> {
    const [lowerId, higherId] = [user1Id, user2Id].sort();
    
    const result = await db
      .delete(friendships)
      .where(
        and(
          eq(friendships.user1Id, lowerId),
          eq(friendships.user2Id, higherId)
        )
      );
    
    return true;
  }

  async getFriendship(user1Id: string, user2Id: string): Promise<Friendship | undefined> {
    const [lowerId, higherId] = [user1Id, user2Id].sort();
    
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.user1Id, lowerId),
          eq(friendships.user2Id, higherId)
        )
      );
    
    return friendship || undefined;
  }

  // ==================== CHAT ====================
  async sendChatMessage(senderId: string, receiverId: string, content: string): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values({
        senderId,
        receiverId,
        content,
        isRead: false,
      })
      .returning();
    
    return message;
  }

  async getChatMessages(user1Id: string, user2Id: string): Promise<ChatMessage[]> {
    const messages = await db
      .select()
      .from(chatMessages)
      .where(
        sql`(${chatMessages.senderId} = ${user1Id} AND ${chatMessages.receiverId} = ${user2Id}) OR (${chatMessages.senderId} = ${user2Id} AND ${chatMessages.receiverId} = ${user1Id})`
      )
      .orderBy(chatMessages.createdAt);
    
    return messages;
  }

  async markMessageAsRead(messageId: string): Promise<ChatMessage | undefined> {
    const [message] = await db
      .update(chatMessages)
      .set({ isRead: true })
      .where(eq(chatMessages.id, messageId))
      .returning();
    
    return message || undefined;
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.receiverId, userId),
          eq(chatMessages.isRead, false)
        )
      );
    
    return Number(result[0]?.count || 0);
  }

  // ==================== CONTENT MODERATION ====================
  async createViolation(violation: InsertContentViolation): Promise<ContentViolation> {
    const [created] = await db
      .insert(contentViolations)
      .values(violation)
      .returning();
    
    return created;
  }

  async getUserViolations(userId: string): Promise<ContentViolation[]> {
    const violations = await db
      .select()
      .from(contentViolations)
      .where(eq(contentViolations.authorId, userId))
      .orderBy(desc(contentViolations.createdAt));
    
    return violations;
  }

  async getUserViolationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(contentViolations)
      .where(eq(contentViolations.authorId, userId));
    
    return Number(result[0]?.count || 0);
  }

  // ==================== PUNISHMENTS ====================
  async createPunishment(punishment: InsertUserPunishment): Promise<UserPunishment> {
    const [created] = await db
      .insert(userPunishments)
      .values(punishment)
      .returning();
    
    return created;
  }

  async getUserPunishments(userId: string): Promise<UserPunishment[]> {
    const punishments = await db
      .select()
      .from(userPunishments)
      .where(eq(userPunishments.userId, userId))
      .orderBy(desc(userPunishments.createdAt));
    
    return punishments;
  }

  async applyPunishment(userId: string, credibilityPenalty: number, banUntil?: Date): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const newCredibility = Math.max(0, user.credibilityScore - credibilityPenalty);
    
    const updates: any = {
      credibilityScore: newCredibility,
      updatedAt: new Date(),
    };
    
    if (banUntil) {
      updates.accountStatus = "suspended";
    } else if (newCredibility < CREDIBILITY_THRESHOLD_FOR_THREAT) {
      updates.accountStatus = "threatened";
    }
    
    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    
    return updated || undefined;
  }
}

export const storage = new DatabaseStorage();
