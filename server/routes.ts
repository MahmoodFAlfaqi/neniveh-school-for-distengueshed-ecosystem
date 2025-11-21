import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { promises as fs } from "fs";
import path from "path";
import { storage } from "./storage";
import { 
  insertUserSchema,
  insertPostSchema,
  insertEventSchema,
  insertEventRsvpSchema,
  insertScheduleSchema,
  insertTeacherSchema,
  insertTeacherReviewSchema,
  insertScopeSchema,
  insertProfileCommentSchema,
  insertAdminStudentIdSchema,
} from "@shared/schema";
import bcrypt from "bcrypt";
import { z } from "zod";
import { requireModeration } from "./moderation";
import { upload, getMediaType } from "./upload";

// Authentication middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Admin role middleware
async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Admin privileges required" });
  }
  
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ==================== AUTHENTICATION ====================
  
  // Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      console.log("[REGISTER] Registration attempt for:", userData.username, "with studentId:", userData.studentId);
      
      // Check if username already exists
      const existingByUsername = await storage.getUserByUsername(userData.username);
      if (existingByUsername) {
        console.log("[REGISTER] Username already taken:", userData.username);
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Check if email already exists
      const existingByEmail = await storage.getUserByEmail(userData.email);
      if (existingByEmail) {
        console.log("[REGISTER] Email already registered:", userData.email);
        return res.status(400).json({ message: "Email already registered" });
      }
      
      console.log("[REGISTER] Creating user...");
      // Create user (will validate student ID and assign it automatically)
      const user = await storage.createUser(userData);
      console.log("[REGISTER] User created successfully:", user.id);
      
      // Set session
      req.session.userId = user.id;
      
      // Don't send password back
      const { password, ...userWithoutPassword } = user;
      
      res.json({ 
        message: "Registration successful",
        user: userWithoutPassword 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("[REGISTER] Validation error:", error.errors);
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      
      // Handle student ID validation errors (return 400, not 500)
      if (error instanceof Error) {
        const message = error.message;
        console.log("[REGISTER] Registration error:", message);
        
        // These are validation errors, not server errors
        if (message.includes("Student ID") || message.includes("Username does not match")) {
          return res.status(400).json({ message });
        }
      }
      
      // Only use 500 for unexpected errors
      console.error("[REGISTER] Unexpected error:", error);
      console.error("[REGISTER] Error stack:", error instanceof Error ? error.stack : "No stack");
      res.status(500).json({ 
        message: "Registration failed. Please try again.",
      });
    }
  });
  
  // Login (username + password)
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("[AUTH] Login attempt:", { username: req.body.username, hasPassword: !!req.body.password });
      const { username, password } = req.body;
      
      if (!username || !password) {
        console.log("[AUTH] Missing credentials");
        return res.status(400).json({ message: "Username and password required" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log("[AUTH] User not found:", username);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      console.log("[AUTH] User found:", { id: user.id, username: user.username });
      const passwordMatch = await bcrypt.compare(password, user.password);
      console.log("[AUTH] Password match:", passwordMatch);
      
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set session
      req.session.userId = user.id;
      console.log("[AUTH] Session set:", req.session.userId);
      
      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({ 
        message: "Login successful",
        user: userWithoutPassword 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user (from session)
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ==================== ADMIN STUDENT ID MANAGEMENT ====================
  
  // Generate new student ID (admin only)
  // Admin provides username, grade, className → system generates random studentId
  app.post("/api/admin/student-ids", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertAdminStudentIdSchema.parse({
        username: req.body.username,
        grade: req.body.grade,
        className: req.body.className,
        createdByAdminId: req.session.userId!,
      });
      
      const record = await storage.createStudentId(
        validatedData.username,
        validatedData.grade,
        validatedData.className,
        req.session.userId!
      );
      
      res.json({ 
        message: "Student ID created successfully",
        studentId: record 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Failed to create student ID:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create student ID" });
    }
  });

  // Get all student IDs (admin only)
  app.get("/api/admin/student-ids", requireAdmin, async (req, res) => {
    try {
      const studentIds = await storage.getAllStudentIds();
      res.json(studentIds);
    } catch (error) {
      console.error("Failed to fetch student IDs:", error);
      res.status(500).json({ message: "Failed to fetch student IDs" });
    }
  });

  // Delete student ID (admin only, only unassigned IDs)
  app.delete("/api/admin/student-ids/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const success = await storage.deleteStudentId(id);
      
      if (!success) {
        return res.status(400).json({ 
          message: "Cannot delete student ID. It may be already assigned or not found." 
        });
      }
      
      res.json({ message: "Student ID deleted successfully" });
    } catch (error) {
      console.error("Failed to delete student ID:", error);
      res.status(500).json({ message: "Failed to delete student ID" });
    }
  });

  // ==================== ACCESS CODE / DIGITAL KEY SYSTEM ====================
  
  // Verify and unlock scope (uses authenticated user from session)
  app.post("/api/keys/unlock", requireAuth, async (req, res) => {
    try {
      const { scopeId, accessCode } = req.body;
      const userId = req.session.userId!; // From authenticated session
      
      if (!scopeId || !accessCode) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const result = await storage.verifyAndUnlockScope(userId, scopeId, accessCode);
      
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to verify access code" });
    }
  });
  
  // Get user's digital keys (authenticated user only)
  app.get("/api/keys", requireAuth, async (req, res) => {
    try {
      const keys = await storage.getUserDigitalKeys(req.session.userId!);
      res.json(keys);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch digital keys" });
    }
  });
  
  // Check if authenticated user has access to scope
  app.get("/api/keys/check/:scopeId", requireAuth, async (req, res) => {
    try {
      const hasAccess = await storage.hasAccessToScope(req.session.userId!, req.params.scopeId);
      res.json({ hasAccess });
    } catch (error) {
      res.status(500).json({ message: "Failed to check access" });
    }
  });

  // ==================== ADMIN HANDOVER PROTOCOL ====================
  
  // Transfer admin privileges (requires current user to be admin)
  app.post("/api/admin/handover", requireAdmin, async (req, res) => {
    try {
      const { successorId, notes } = req.body;
      const currentAdminId = req.session.userId!; // Authenticated admin
      
      if (!successorId) {
        return res.status(400).json({ message: "Successor ID required" });
      }
      
      const result = await storage.transferAdminPrivileges(currentAdminId, successorId, notes);
      
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to transfer admin privileges" });
    }
  });
  
  // Get succession history (admin only)
  app.get("/api/admin/succession-history", requireAdmin, async (req, res) => {
    try {
      const history = await storage.getAdminSuccessionHistory();
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch succession history" });
    }
  });

  // ==================== CREDIBILITY & REPUTATION ENGINE ====================
  
  // Calculate authenticated user's reputation
  app.post("/api/reputation/calculate", requireAuth, async (req, res) => {
    try {
      const reputation = await storage.calculateUserReputation(req.session.userId!);
      res.json({ reputation });
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate reputation" });
    }
  });
  
  // Update user credibility (admin only)
  app.patch("/api/users/:userId/credibility", requireAdmin, async (req, res) => {
    try {
      const { credibilityScore } = req.body;
      
      if (typeof credibilityScore !== "number") {
        return res.status(400).json({ message: "Invalid credibility score" });
      }
      
      const user = await storage.updateUserCredibility(req.params.userId, credibilityScore);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update credibility" });
    }
  });
  
  // Get user stats (public - for profile cards)
  app.get("/api/users/:userId/stats", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return only public stats (hide private info like phone, transport)
      res.json({
        name: user.name,
        role: user.role,
        credibilityScore: user.credibilityScore,
        reputationScore: user.reputationScore,
        accountStatus: user.accountStatus,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Search user by email (for admin handover)
  app.get("/api/users/search", requireAuth, async (req, res) => {
    try {
      const { email } = req.query;
      
      if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "Email query parameter required" });
      }
      
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return limited info
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to search user" });
    }
  });

  // Get students by class
  app.get("/api/classes/:grade/:className/students", requireAuth, async (req, res) => {
    try {
      const { grade, className } = req.params;
      const gradeNum = parseInt(grade);
      
      if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 6) {
        return res.status(400).json({ message: "Invalid grade (must be 1-6)" });
      }
      
      if (!className || className.length !== 1 || !/[A-E]/i.test(className)) {
        return res.status(400).json({ message: "Invalid class name (must be A-E)" });
      }
      
      const students = await storage.getStudentsByClass(gradeNum, className.toUpperCase());
      
      // Return students without sensitive info
      const studentsPublicInfo = students.map(({ password, phone, transportDetails, email, ...student }) => student);
      
      res.json(studentsPublicInfo);
    } catch (error) {
      console.error("Failed to fetch students by class:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  // ==================== SCOPES ====================
  
  // Get all scopes
  app.get("/api/scopes", requireAuth, async (req, res) => {
    try {
      const scopes = await storage.getAllScopes();
      res.json(scopes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scopes" });
    }
  });
  
  // Get single scope
  app.get("/api/scopes/:id", requireAuth, async (req, res) => {
    try {
      const scope = await storage.getScope(req.params.id);
      if (!scope) {
        return res.status(404).json({ message: "Scope not found" });
      }
      res.json(scope);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scope" });
    }
  });
  
  // Create scope (admin only)
  app.post("/api/scopes", requireAdmin, async (req, res) => {
    try {
      const scopeData = insertScopeSchema.parse(req.body);
      const scope = await storage.createScope(scopeData);
      res.json(scope);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create scope" });
    }
  });

  // ==================== POSTS ====================
  
  // Create post (uses authenticated user) with optional file upload
  app.post("/api/posts", requireAuth, upload.single('media'), async (req, res) => {
    try {
      // Moderate content before saving (only if content is provided)
      if (req.body.content?.trim()) {
        await requireModeration(req.body.content);
      }
      
      // Prepare post data with media if uploaded
      const postData = insertPostSchema.parse({
        ...req.body,
        authorId: req.session.userId!, // Use authenticated user
        mediaUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
        mediaType: req.file ? getMediaType(req.file.mimetype) : undefined,
      });
      
      // If posting to a restricted scope, verify user has access
      if (postData.scopeId) {
        const hasAccess = await storage.hasAccessToScope(req.session.userId!, postData.scopeId);
        if (!hasAccess) {
          return res.status(403).json({ message: "You don't have access to post in this scope. Please enter the access code first." });
        }
      }
      
      const post = await storage.createPost(postData);
      res.json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      if (error instanceof Error) {
        // Handle moderation errors
        if (error.message.includes("community guidelines")) {
          return res.status(400).json({ message: error.message });
        }
      }
      res.status(500).json({ message: "Failed to create post" });
    }
  });
  
  // Get posts (by scope or public square)
  app.get("/api/posts", requireAuth, async (req, res) => {
    try {
      const scopeId = req.query.scopeId as string | undefined;
      const posts = await storage.getPosts(scopeId === "null" ? null : scopeId);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });
  
  // Update post credibility (admin only)
  app.patch("/api/posts/:id/credibility", requireAdmin, async (req, res) => {
    try {
      const { credibilityRating } = req.body;
      
      if (typeof credibilityRating !== "number") {
        return res.status(400).json({ message: "Invalid credibility rating" });
      }
      
      const post = await storage.updatePostCredibility(req.params.id, credibilityRating);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to update post credibility" });
    }
  });

  // ==================== EVENTS ====================
  
  // Create event
  app.post("/api/events", requireAuth, async (req, res) => {
    try {
      // Moderate event description before saving (only if description is provided)
      if (req.body.description?.trim()) {
        await requireModeration(req.body.description);
      }
      
      // Parse dates from ISO strings to Date objects
      const eventPayload = {
        ...req.body,
        createdById: req.session.userId!,
        startTime: new Date(req.body.startTime),
        endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
      };
      
      const eventData = insertEventSchema.parse(eventPayload);
      
      // If creating event in a restricted scope, verify user has access
      if (eventData.scopeId) {
        const hasAccess = await storage.hasAccessToScope(req.session.userId!, eventData.scopeId);
        if (!hasAccess) {
          return res.status(403).json({ message: "You don't have access to create events in this scope. Please enter the access code first." });
        }
      }
      
      const event = await storage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("community guidelines")) {
        return res.status(400).json({ message: error.message });
      }
      console.error("Failed to create event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });
  
  // Get events
  app.get("/api/events", requireAuth, async (req, res) => {
    try {
      const scopeId = req.query.scopeId as string | undefined;
      const userId = req.session.userId;
      const events = await storage.getEvents(scopeId, userId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });
  
  // RSVP to event
  app.post("/api/events/:id/rsvp", requireAuth, async (req, res) => {
    try {
      const rsvp = await storage.rsvpToEvent(req.params.id, req.session.userId!);
      res.json(rsvp);
    } catch (error) {
      res.status(500).json({ message: "Failed to RSVP to event" });
    }
  });
  
  // Get event RSVPs
  app.get("/api/events/:id/rsvps", requireAuth, async (req, res) => {
    try {
      const rsvps = await storage.getEventRsvps(req.params.id);
      res.json(rsvps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch RSVPs" });
    }
  });

  // Get current user's RSVPs
  app.get("/api/rsvps", requireAuth, async (req, res) => {
    try {
      const rsvps = await storage.getUserRsvps(req.session.userId!);
      res.json(rsvps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user RSVPs" });
    }
  });

  app.get("/api/events/:id/attendees", requireAuth, async (req, res) => {
    try {
      const attendees = await storage.getEventAttendees(req.params.id);
      res.json(attendees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event attendees" });
    }
  });

  // ==================== SCHEDULES ====================
  
  // Create schedule entry (requires section key)
  app.post("/api/schedules", requireAuth, async (req, res) => {
    try {
      const scheduleData = insertScheduleSchema.parse(req.body);
      
      // Verify user has access to the section
      const hasAccess = await storage.hasAccessToScope(req.session.userId!, scheduleData.scopeId);
      if (!hasAccess) {
        return res.status(403).json({ message: "You need the section key to create/edit schedules" });
      }
      
      const schedule = await storage.createSchedule(scheduleData);
      res.json(schedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create schedule" });
    }
  });
  
  // Get schedules for a scope
  app.get("/api/schedules/:scopeId", requireAuth, async (req, res) => {
    try {
      const schedules = await storage.getSchedules(req.params.scopeId);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch schedules" });
    }
  });
  
  // Update schedule entry (requires section key)
  app.patch("/api/schedules/:id", requireAuth, async (req, res) => {
    try {
      const { teacherName, subject, scopeId } = req.body;
      
      if (!teacherName || !subject || !scopeId) {
        return res.status(400).json({ message: "Teacher name, subject, and scope ID required" });
      }
      
      // Verify user has access to the section
      const hasAccess = await storage.hasAccessToScope(req.session.userId!, scopeId);
      if (!hasAccess) {
        return res.status(403).json({ message: "You need the section key to edit schedules" });
      }
      
      const schedule = await storage.updateSchedule(req.params.id, teacherName, subject);
      
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ message: "Failed to update schedule" });
    }
  });

  // Bulk update schedules for a scope (requires section key or admin)
  app.patch("/api/schedules/:scopeId/bulk", requireAuth, async (req, res) => {
    try {
      const { scopeId } = req.params;
      const { updates } = req.body;

      if (!Array.isArray(updates)) {
        return res.status(400).json({ message: "Updates must be an array" });
      }

      // Verify user has access to the section or is admin
      const user = await storage.getUser(req.session.userId!);
      const hasAccess = user?.role === "admin" || await storage.hasAccessToScope(req.session.userId!, scopeId);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "You need the section key or admin privileges to edit schedules" });
      }

      await storage.bulkUpdateSchedules(scopeId, updates);
      res.json({ message: "Schedules updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update schedules" });
    }
  });

  // ==================== TEACHERS ====================
  
  // Create teacher profile (admin only)
  app.post("/api/teachers", requireAdmin, async (req, res) => {
    try {
      const teacherData = insertTeacherSchema.parse(req.body);
      const teacher = await storage.createTeacher(teacherData);
      res.json(teacher);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create teacher" });
    }
  });
  
  // Get all teachers
  app.get("/api/teachers", requireAuth, async (req, res) => {
    try {
      const teachers = await storage.getTeachers();
      res.json(teachers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teachers" });
    }
  });
  
  // Get single teacher with reviews and average rating
  app.get("/api/teachers/:id", requireAuth, async (req, res) => {
    try {
      const result = await storage.getTeacherWithReviews(req.params.id);
      if (!result) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teacher" });
    }
  });

  // Update teacher (admin only)
  app.patch("/api/teachers/:id", requireAdmin, async (req, res) => {
    try {
      const updates = req.body;
      const teacher = await storage.updateTeacher(req.params.id, updates);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      res.json(teacher);
    } catch (error) {
      res.status(500).json({ message: "Failed to update teacher" });
    }
  });

  // Delete teacher (admin only)
  app.delete("/api/teachers/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteTeacher(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      res.json({ message: "Teacher deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete teacher" });
    }
  });
  
  // Create teacher review
  app.post("/api/teachers/:id/reviews", requireAuth, async (req, res) => {
    try {
      // Moderate review comment before saving (only if comment is provided)
      if (req.body.comment?.trim()) {
        await requireModeration(req.body.comment);
      }
      
      const reviewData = insertTeacherReviewSchema.parse({
        ...req.body,
        teacherId: req.params.id,
        studentId: req.session.userId!,
      });
      const review = await storage.createTeacherReview(reviewData);
      res.json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("community guidelines")) {
        return res.status(400).json({ message: error.message });
      }
      // Handle unique constraint violation for duplicate reviews
      if (error instanceof Error && (error.message.includes("unique") || error.message.includes("duplicate"))) {
        return res.status(409).json({ message: "You have already submitted a review for this teacher" });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });
  
  // Get teacher reviews
  app.get("/api/teachers/:id/reviews", requireAuth, async (req, res) => {
    try {
      const reviews = await storage.getTeacherReviews(req.params.id);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // ==================== PROFILE COMMENTS ====================
  
  // Create profile comment
  app.post("/api/users/:userId/comments", requireAuth, async (req, res) => {
    try {
      // Moderate content before saving (only if comment is provided)
      if (req.body.comment?.trim()) {
        await requireModeration(req.body.comment);
      }
      
      const commentData = insertProfileCommentSchema.parse({
        ...req.body,
        profileUserId: req.params.userId,
        authorId: req.session.userId!,
      });
      
      const comment = await storage.createProfileComment(commentData);
      res.json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("community guidelines")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });
  
  // Get profile comments
  app.get("/api/users/:userId/comments", requireAuth, async (req, res) => {
    try {
      const comments = await storage.getProfileComments(req.params.userId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // ==================== FILE UPLOADS ====================
  
  // Ensure uploads directory exists and serve uploaded files
  const UPLOAD_DIR = path.join(process.cwd(), "uploads");
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create uploads directory:", error);
    // Continue anyway - static serving will fail gracefully
  }
  app.use('/uploads', express.static(UPLOAD_DIR));

  const httpServer = createServer(app);

  return httpServer;
}
