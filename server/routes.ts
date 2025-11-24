import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { storage } from "./storage";
import { db } from "./db";
import { 
  users,
  insertUserSchema,
  insertPostSchema,
  insertEventSchema,
  insertEventRsvpSchema,
  insertScheduleSchema,
  insertTeacherSchema,
  insertTeacherReviewSchema,
  insertScopeSchema,
  insertPostCommentSchema,
  insertEventCommentSchema,
  insertAdminStudentIdSchema,
  insertPostAccuracyRatingSchema,
} from "@shared/schema";
import bcrypt from "bcrypt";
import { z } from "zod";
import { requireModeration } from "./moderation";
import { upload, getMediaType } from "./upload";

// Authentication middleware (allows both logged-in users and visitors)
function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Allow visitors with session-only access
  if (req.session.isVisitor) {
    return next();
  }
  
  // Require userId for regular users
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

// Non-visitor middleware (prevent read-only visitors from making changes)
async function requireNonVisitor(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }
  
  if (user.role === "visitor") {
    return res.status(403).json({ message: "Visitors cannot perform this action. Please login as a student or admin." });
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
      const { username, password, rememberMe } = req.body;
      
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
      
      // Handle remember me for students (same as admins)
      if (rememberMe) {
        const token = crypto.randomBytes(32).toString('hex');
        await storage.createRememberMeToken(user.id, token);
        
        // Set remember-me cookie (7 days)
        res.cookie('remember_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          sameSite: 'lax'
        });
      }
      
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

  // Admin Register (requires scientific question answer)
  app.post("/api/auth/admin/register", async (req, res) => {
    try {
      const { scientificAnswer, username, password, name, email } = req.body;
      
      if (!scientificAnswer || !username || !password || !name || !email) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      // Verify administration code
      const ADMIN_CODE = process.env.ADMIN_DEFAULT_PASSWORD || "NOTHINg27$";
      
      if (scientificAnswer !== ADMIN_CODE) {
        return res.status(401).json({ message: "Incorrect administration code" });
      }
      
      // Check if username already exists
      const existingByUsername = await storage.getUserByUsername(username);
      if (existingByUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Check if email already exists
      const existingByEmail = await storage.getUserByEmail(email);
      if (existingByEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Create admin account
      const hashedPassword = await bcrypt.hash(password, 10);
      const [admin] = await db.insert(users).values({
        username,
        password: hashedPassword,
        name,
        email,
        studentId: `ADMIN_${Date.now()}`, // Unique admin student ID
        role: "admin",
        credibilityScore: 100,
        reputationScore: 0,
        accountStatus: "active",
        initiativeScore: 0,
        communicationScore: 0,
        cooperationScore: 0,
        kindnessScore: 0,
        perseveranceScore: 0,
        fitnessScore: 0,
        playingSkillsScore: 0,
        inClassMisconductScore: 0,
        outClassMisconductScore: 0,
        literaryScienceScore: 0,
        naturalScienceScore: 0,
        electronicScienceScore: 0,
        confidenceScore: 0,
        temperScore: 0,
        cheerfulnessScore: 0,
      }).returning();
      
      // Set session
      req.session.userId = admin.id;
      
      const { password: _, ...adminWithoutPassword } = admin;
      
      res.json({ 
        message: "Admin account created successfully",
        user: adminWithoutPassword 
      });
    } catch (error) {
      console.error("Admin registration error:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      const errorType = error instanceof Error ? error.constructor.name : "Unknown";
      console.error(`Error type: ${errorType}`);
      console.error(`Error message: ${errorMsg}`);
      if (error instanceof Error && error.stack) {
        console.error("Stack trace:", error.stack);
      }
      
      // Provide more specific error messages
      let userMessage = "Admin registration failed";
      if (errorMsg.includes("unique") || errorMsg.includes("already exists")) {
        userMessage = "Username or email already registered";
      } else if (errorMsg.includes("database") || errorMsg.includes("connection")) {
        userMessage = "Database connection error - please try again";
      }
      
      res.status(500).json({ 
        message: userMessage, 
        error: errorMsg,
        debug: {
          type: errorType,
          details: errorMsg
        }
      });
    }
  });

  // Admin Login (username + password + optional remember-me)
  app.post("/api/auth/admin/login", async (req, res) => {
    try {
      const { username, password, rememberMe } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      // Check if account is locked
      const isLocked = await storage.isAccountLocked(username);
      if (isLocked) {
        return res.status(429).json({ 
          message: "Account locked due to too many failed attempts. Please try again in 15 minutes." 
        });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.role !== "admin") {
        await storage.recordFailedLogin(username);
        return res.status(401).json({ message: "Invalid admin credentials" });
      }
      
      const passwordMatch = await bcrypt.compare(password, user.password);
      
      if (!passwordMatch) {
        await storage.recordFailedLogin(username);
        const attempts = await storage.getFailedLoginAttempts(username);
        const remaining = attempts ? Math.max(0, 3 - attempts.attemptCount) : 3;
        return res.status(401).json({ 
          message: `Invalid credentials. ${remaining} attempt(s) remaining.` 
        });
      }
      
      // Successful login - clear failed attempts
      await storage.clearFailedLoginAttempts(username);
      
      // Set session
      req.session.userId = user.id;

      // Handle remember-me functionality
      if (rememberMe) {
        const token = crypto.randomBytes(32).toString('hex');
        await storage.createRememberMeToken(user.id, token);
        
        // Set remember-me cookie (7 days)
        res.cookie('remember_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          sameSite: 'lax'
        });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({ 
        message: "Login successful",
        user: userWithoutPassword 
      });
    } catch (error) {
      console.error("Admin login error:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      const errorType = error instanceof Error ? error.constructor.name : "Unknown";
      console.error(`Error type: ${errorType}, Message: ${errorMsg}`);
      if (error instanceof Error && error.stack) {
        console.error("Stack trace:", error.stack);
      }
      res.status(500).json({ 
        message: "Admin login failed", 
        error: errorMsg,
        debug: {
          type: errorType,
          details: errorMsg
        }
      });
    }
  });

  // Visitor guest access (session-only, no database user)
  app.post("/api/auth/visitor", async (req, res) => {
    try {
      // Create temporary visitor session data (no database user)
      req.session.isVisitor = true;
      req.session.visitorData = {
        username: "Guest Visitor",
        name: "Guest Visitor",
        role: "visitor",
      };
      
      res.json({ 
        message: "Visitor access granted",
        user: {
          username: "Guest Visitor",
          name: "Guest Visitor",
          role: "visitor",
        }
      });
    } catch (error) {
      console.error("Visitor access error:", error);
      res.status(500).json({ message: "Visitor access failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", async (req, res) => {
    try {
      // Delete remember-me token if it exists
      const rememberToken = req.cookies?.remember_token;
      if (rememberToken) {
        await storage.deleteRememberMeToken(rememberToken);
        res.clearCookie('remember_token');
      }

      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Logout failed" });
        }
        res.json({ message: "Logged out successfully" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Request password reset (by email or phone)
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email, phone } = req.body;

      if (!email && !phone) {
        return res.status(400).json({ message: "Email or phone number required" });
      }

      let user: any;
      if (email) {
        user = await storage.getUserByEmail(email);
      } else if (phone) {
        // For phone, we would search through users but for now just handle email
        return res.json({ message: "Phone-based recovery coming soon. Please use email." });
      }

      if (!user) {
        // Don't reveal whether email/phone exists (security best practice)
        return res.json({ message: "If an account exists, a password reset link will be sent" });
      }

      const token = await storage.createPasswordResetToken(user.id);
      
      res.json({ 
        message: "Password reset token created",
        token: token // In production, send this via email/SMS instead
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Validate password reset token
  app.post("/api/auth/validate-reset-token", async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: "Token required" });
      }

      const user = await storage.validatePasswordResetToken(token);
      
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      res.json({ 
        message: "Token valid",
        userId: user.id,
        username: user.username
      });
    } catch (error) {
      console.error("Validate token error:", error);
      res.status(500).json({ message: "Failed to validate token" });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const success = await storage.resetPassword(token, newPassword);
      
      if (!success) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Get current user (from session)
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      // Return visitor session data if visitor
      if (req.session.isVisitor && req.session.visitorData) {
        return res.json(req.session.visitorData);
      }

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

  // Get user by ID (public profile)
  app.get("/api/users/:userId", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only expose safe public fields
      const publicProfile = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        grade: user.grade,
        className: user.className,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        credibilityScore: user.credibilityScore,
        reputationScore: user.reputationScore,
        accountStatus: user.accountStatus,
        createdAt: user.createdAt,
        // Hexagon tendency charts
        empathy: user.empathy,
        angerManagement: user.angerManagement,
        cooperation: user.cooperation,
        selfConfidence: user.selfConfidence,
        acceptingCriticism: user.acceptingCriticism,
        listening: user.listening,
        problemSolving: user.problemSolving,
        creativity: user.creativity,
        memoryFocus: user.memoryFocus,
        planningOrganization: user.planningOrganization,
        communicationExpression: user.communicationExpression,
        leadershipInitiative: user.leadershipInitiative,
        artisticCreative: user.artisticCreative,
        athleticPhysical: user.athleticPhysical,
        technicalTech: user.technicalTech,
        linguisticReading: user.linguisticReading,
        socialHumanitarian: user.socialHumanitarian,
        naturalEnvironmental: user.naturalEnvironmental,
        hobbies: user.hobbies,
      };
      
      res.json(publicProfile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Update user profile (own profile only)
  app.patch("/api/users/:userId/profile", requireAuth, requireNonVisitor, async (req, res) => {
    try {
      const userId = req.params.userId;
      const currentUserId = req.session.userId!;
      
      if (userId !== currentUserId) {
        return res.status(403).json({ message: "You can only edit your own profile" });
      }
      
      const { bio, avatarUrl, grade, className } = req.body;
      
      // Moderate bio before updating
      if (bio && typeof bio === "string" && bio.trim()) {
        await requireModeration(bio);
      }
      
      const updated = await storage.updateUserProfile(userId, { bio, avatarUrl, grade, className });
      
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof Error && error.message.includes("community guidelines")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Update hexagon tendency charts (own profile only)
  app.patch("/api/users/:userId/hexagon", requireAuth, requireNonVisitor, async (req, res) => {
    try {
      const userId = req.params.userId;
      const currentUserId = req.session.userId!;
      
      if (userId !== currentUserId) {
        return res.status(403).json({ message: "You can only edit your own tendency charts" });
      }
      
      // Sanitize payload to prevent prototype pollution attacks
      // Create a clean object with only own properties (no inherited keys like __proto__)
      const sanitized = Object.create(null);
      for (const [key, value] of Object.entries(req.body)) {
        // Only copy own enumerable properties
        if (Object.prototype.hasOwnProperty.call(req.body, key)) {
          sanitized[key] = value;
        }
      }
      
      // Validate sanitized body using Zod schema to ensure integers 0-10
      const hexagonUpdateSchema = z.record(z.string(), z.number().int().min(0).max(10));
      const parseResult = hexagonUpdateSchema.safeParse(sanitized);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid payload format. All values must be integers between 0 and 10.",
          errors: parseResult.error.errors
        });
      }
      
      const hexagonData = parseResult.data;
      
      // Define hexagon field groups
      const hexagonGroups = {
        social: new Set(["empathy", "angerManagement", "cooperation", "selfConfidence", "acceptingCriticism", "listening"]),
        skills: new Set(["problemSolving", "creativity", "memoryFocus", "planningOrganization", "communicationExpression", "leadershipInitiative"]),
        interests: new Set(["artisticCreative", "athleticPhysical", "technicalTech", "linguisticReading", "socialHumanitarian", "naturalEnvironmental"]),
      };
      
      const keys = Object.keys(hexagonData);
      
      // Validate that exactly 6 keys are present
      if (keys.length !== 6) {
        return res.status(400).json({ 
          message: `Invalid payload. Must update exactly 6 metrics for one hexagon. Received ${keys.length} keys.`
        });
      }
      
      // Determine which hexagon group these keys belong to
      // SECURITY: This prevents cross-hexagon contamination by ensuring all 6 keys
      // belong to the SAME hexagon group (not a mix from multiple groups)
      let detectedGroup: string | null = null;
      let canonicalKeys: Set<string> | null = null;
      for (const [groupName, groupKeys] of Object.entries(hexagonGroups)) {
        if (keys.every(k => groupKeys.has(k))) {
          detectedGroup = groupName;
          canonicalKeys = groupKeys;
          break;
        }
      }
      
      if (!detectedGroup || !canonicalKeys) {
        return res.status(400).json({ 
          message: "Invalid payload. All 6 metrics must belong to the same hexagon (social, skills, or interests)."
        });
      }
      
      // EXTRA SECURITY: Verify the 6 keys received are EXACTLY the 6 canonical keys
      // for this hexagon group (no missing keys, no extra keys)
      const receivedKeysSet = new Set(keys);
      const canonicalKeysArray = Array.from(canonicalKeys);
      
      if (!canonicalKeysArray.every(k => receivedKeysSet.has(k))) {
        return res.status(400).json({ 
          message: `Invalid payload. Must include all 6 metrics for ${detectedGroup} hexagon.`
        });
      }
      
      // hexagonData is already validated by Zod schema (integers 0-10)
      const updates: Record<string, number> = hexagonData;
      
      // Validate total points for the detected hexagon (must be exactly 24)
      const total = Object.values(updates).reduce((sum, v) => sum + v, 0);
      
      if (total !== 24) {
        return res.status(400).json({ 
          message: `Invalid point distribution. The ${detectedGroup} hexagon must have exactly 24 total points (received ${total}).`
        });
      }
      
      // All validations passed - update the hexagon
      const updated = await storage.updateUserProfile(userId, updates);
      
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Failed to update hexagon:", error);
      res.status(500).json({ message: "Failed to update tendency charts" });
    }
  });

  // Update user hobbies (own profile only)
  app.patch("/api/users/:userId/hobbies", requireAuth, requireNonVisitor, async (req, res) => {
    try {
      const userId = req.params.userId;
      const currentUserId = req.session.userId!;
      
      if (userId !== currentUserId) {
        return res.status(403).json({ message: "You can only edit your own hobbies" });
      }
      
      // Validate hobbies using Zod schema (allow empty array to delete all hobbies)
      const hobbiesSchema = z.object({
        hobbies: z.array(z.string().trim().min(1).max(50)).max(5)
      });
      
      const parseResult = hobbiesSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid hobbies format. Must be an array of 1-5 strings, each 1-50 characters.",
          errors: parseResult.error.errors
        });
      }
      
      const { hobbies } = parseResult.data;
      
      // Update user hobbies
      const updated = await storage.updateUserProfile(userId, { hobbies });
      
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Failed to update hobbies:", error);
      res.status(500).json({ message: "Failed to update hobbies" });
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

  // Get all assigned students (admin only)
  app.get("/api/admin/students", requireAdmin, async (req, res) => {
    try {
      const students = await storage.getAssignedStudents();
      res.json(students);
    } catch (error) {
      console.error("Failed to fetch assigned students:", error);
      res.status(500).json({ message: "Failed to fetch assigned students" });
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

  // Delete student account (admin only) - deletes all related data and the user
  app.delete("/api/admin/student/:userId", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Prevent admin from deleting themselves
      if (userId === req.session.userId) {
        return res.status(400).json({ 
          message: "Cannot delete your own admin account" 
        });
      }
      
      // Verify the user exists and is a student (not an admin)
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.role === "admin") {
        return res.status(400).json({ 
          message: "Cannot delete admin accounts using this endpoint" 
        });
      }
      
      const success = await storage.deleteStudentAccount(userId);
      
      if (!success) {
        return res.status(500).json({ 
          message: "Failed to delete student account" 
        });
      }
      
      res.json({ message: "Student account deleted successfully" });
    } catch (error) {
      console.error("Failed to delete student account:", error);
      res.status(500).json({ message: "Failed to delete student account" });
    }
  });

  // Delete teacher account (admin only) - deletes all related data
  app.delete("/api/admin/teacher/:teacherId", requireAdmin, async (req, res) => {
    try {
      const { teacherId } = req.params;
      
      const success = await storage.deleteTeacherAccount(teacherId);
      
      if (!success) {
        return res.status(500).json({ 
          message: "Failed to delete teacher account" 
        });
      }
      
      res.json({ message: "Teacher account deleted successfully" });
    } catch (error) {
      console.error("Failed to delete teacher account:", error);
      res.status(500).json({ message: "Failed to delete teacher account" });
    }
  });

  // ==================== SETTINGS / SUPPORT ====================
  
  // Get donation URL (public - anyone can check if donation URL is configured)
  app.get("/api/settings/donation-url", async (req, res) => {
    try {
      const setting = await storage.getSetting("donationUrl");
      res.json({ 
        url: setting?.value || null 
      });
    } catch (error) {
      console.error("Failed to get donation URL:", error);
      res.status(500).json({ message: "Failed to get donation URL" });
    }
  });
  
  // Set donation URL (admin only)
  app.put("/api/admin/settings/donation-url", requireAdmin, async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url || typeof url !== "string") {
        return res.status(400).json({ message: "Invalid donation URL" });
      }
      
      // Basic URL validation
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ message: "Invalid URL format" });
      }
      
      await storage.setSetting("donationUrl", url);
      res.json({ 
        message: "Donation URL updated successfully",
        url 
      });
    } catch (error) {
      console.error("Failed to set donation URL:", error);
      res.status(500).json({ message: "Failed to set donation URL" });
    }
  });

  // ==================== ACCESS CODE / DIGITAL KEY SYSTEM ====================
  
  // Verify and unlock scope (uses authenticated user from session)
  app.post("/api/keys/unlock", requireAuth, requireNonVisitor, async (req, res) => {
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

  // Promote user to admin (requires current user to be admin)
  app.post("/api/admin/promote", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.body;
      const currentAdminId = req.session.userId!;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }
      
      const result = await storage.promoteUserToAdmin(currentAdminId, userId);
      
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Failed to promote user to admin:", error);
      res.status(500).json({ message: "Failed to promote user to admin" });
    }
  });

  // ==================== CREDIBILITY & REPUTATION ENGINE ====================
  
  // Calculate authenticated user's reputation
  app.post("/api/reputation/calculate", requireAuth, requireNonVisitor, async (req, res) => {
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

  // Delete user account (admin only)
  app.delete("/api/users/:userId", requireAdmin, async (req, res) => {
    try {
      const userId = req.params.userId;
      const currentAdmin = await storage.getUser(req.session.userId!);
      
      // Prevent admins from deleting themselves
      if (currentAdmin?.id === userId) {
        return res.status(400).json({ message: "You cannot delete your own account" });
      }
      
      const success = await storage.deleteUser(userId);
      
      if (!success) {
        return res.status(404).json({ message: "User not found or already deleted" });
      }
      
      res.json({ message: "User account deleted successfully" });
    } catch (error) {
      console.error("Failed to delete user:", error);
      res.status(500).json({ message: "Failed to delete user account" });
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
      // Additional validation
      const { type, gradeNumber, sectionName, accessCode, name } = req.body;

      // Public scopes don't need access codes, but other scopes do
      if (type !== "public") {
        // Validate access code format (alphanumeric, no spaces)
        if (!accessCode || !/^[A-Za-z0-9]+$/.test(accessCode)) {
          return res.status(400).json({ message: "Access code must be alphanumeric with no spaces" });
        }
      }

      // Validate based on scope type
      if (type === "public") {
        // Public scope is always allowed and doesn't require additional validation
        // Check if public scope already exists
        const allScopes = await storage.getAllScopes();
        const existingPublic = allScopes.find(s => s.type === "public");
        if (existingPublic) {
          return res.status(400).json({ message: "Public square scope already exists" });
        }
      } else if (type === "grade") {
        if (!gradeNumber || typeof gradeNumber !== "number" || gradeNumber < 1 || gradeNumber > 6) {
          return res.status(400).json({ message: "Grade number must be a number between 1 and 6" });
        }
        
        // Check if grade scope already exists
        const allScopes = await storage.getAllScopes();
        const existingGrade = allScopes.find(s => s.type === "grade" && s.gradeNumber === gradeNumber);
        if (existingGrade) {
          return res.status(400).json({ message: `Grade ${gradeNumber} scope already exists` });
        }
      } else if (type === "section") {
        if (!sectionName || typeof sectionName !== "string" || !sectionName.trim()) {
          return res.status(400).json({ message: "Section name is required for class scopes" });
        }
        // Validate section name format (e.g., "1-A", "2-B")
        if (!/^\d+-[A-E]$/.test(sectionName)) {
          return res.status(400).json({ message: "Section name must be in format: grade-section (e.g., 1-A, 2-B)" });
        }
        
        // Extract grade number from section name and verify parent grade exists
        const sectionGrade = parseInt(sectionName.split('-')[0]);
        const allScopes = await storage.getAllScopes();
        const parentGrade = allScopes.find(s => s.type === "grade" && s.gradeNumber === sectionGrade);
        if (!parentGrade) {
          return res.status(400).json({ message: `Parent grade scope (Grade ${sectionGrade}) must exist before creating class sections` });
        }
        
        // Check if section already exists
        const existingSection = allScopes.find(s => s.type === "section" && s.sectionName === sectionName);
        if (existingSection) {
          return res.status(400).json({ message: `Class section ${sectionName} already exists` });
        }
      }

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

  // Delete scope (admin only)
  app.delete("/api/scopes/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteScope(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Scope not found" });
      }
      res.json({ message: "Scope deleted successfully" });
    } catch (error) {
      if (error instanceof Error) {
        // Return specific error message from storage layer
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to delete scope" });
    }
  });

  // ==================== POSTS ====================
  
  // Create post (uses authenticated user) with optional file upload
  app.post("/api/posts", requireAuth, requireNonVisitor, upload.single('media'), async (req, res) => {
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
      const userId = req.session.userId!;
      const posts = await storage.getPosts(scopeId === "null" ? null : scopeId, userId);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });
  
  // Edit post (author only)
  app.patch("/api/posts/:id", requireAuth, requireNonVisitor, async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.session.userId!;
      const { content } = req.body;
      
      if (!content || typeof content !== "string") {
        return res.status(400).json({ message: "Content is required" });
      }
      
      // Verify user is the post author
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      if (post.authorId !== userId) {
        return res.status(403).json({ message: "You can only edit your own posts" });
      }
      
      // Moderate content before updating
      if (content.trim()) {
        await requireModeration(content);
      }
      
      const updated = await storage.updatePost(postId, content);
      res.json(updated);
    } catch (error) {
      if (error instanceof Error && error.message.includes("community guidelines")) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update post" });
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

  // Delete post (admin only)
  app.delete("/api/posts/:id", requireAdmin, async (req, res) => {
    try {
      const postId = req.params.id;
      
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const success = await storage.deletePost(postId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete post" });
      }
      
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Failed to delete post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Like a post (toggle)
  app.post("/api/posts/:id/like", requireAuth, requireNonVisitor, async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.session.userId!;
      
      // Check if user already liked this post
      const existingReaction = await storage.getUserPostReaction(postId, userId);
      
      if (existingReaction) {
        // Unlike - delete reaction
        await storage.deletePostReaction(postId, userId);
        res.json({ liked: false, message: "Post unliked" });
      } else {
        // Like - create reaction
        await storage.createPostReaction(postId, userId);
        res.json({ liked: true, message: "Post liked" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Get user's like status for a post
  app.get("/api/posts/:id/like-status", requireAuth, async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.session.userId!;
      
      const reaction = await storage.getUserPostReaction(postId, userId);
      res.json({ liked: !!reaction });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch like status" });
    }
  });

  // Rate post accuracy (1-5 stars)
  app.post("/api/posts/:id/rate-accuracy", requireAuth, requireNonVisitor, async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.session.userId!;
      const { rating } = req.body;
      
      // Validate rating
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be an integer between 1 and 5" });
      }
      
      const result = await storage.ratePostAccuracy(postId, userId, rating);
      res.json({ success: true, rating: result.rating });
    } catch (error) {
      console.error("Failed to rate post accuracy:", error);
      res.status(500).json({ message: "Failed to rate post accuracy" });
    }
  });

  // ==================== EVENTS ====================
  
  // Create event
  app.post("/api/events", requireAuth, requireNonVisitor, async (req, res) => {
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

  // Get single event by ID
  app.get("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const events = await storage.getEvents(undefined, req.session.userId);
      const event = events.find(e => e.id === req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });
  
  // RSVP to event
  app.post("/api/events/:id/rsvp", requireAuth, requireNonVisitor, async (req, res) => {
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
  app.post("/api/schedules", requireAuth, requireNonVisitor, async (req, res) => {
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
  app.patch("/api/schedules/:id", requireAuth, requireNonVisitor, async (req, res) => {
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
  app.patch("/api/schedules/:scopeId/bulk", requireAuth, requireNonVisitor, async (req, res) => {
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
  app.post("/api/teachers/:id/reviews", requireAuth, requireNonVisitor, async (req, res) => {
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

  // ==================== POST COMMENTS ====================
  app.post("/api/posts/:postId/comments", requireAuth, requireNonVisitor, async (req, res) => {
    try {
      const commentData = insertPostCommentSchema.parse({
        ...req.body,
        postId: req.params.postId,
        authorId: req.session.userId!,
      });
      
      const comment = await storage.createPostComment(commentData);
      res.json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.get("/api/posts/:postId/comments", requireAuth, async (req, res) => {
    try {
      const comments = await storage.getPostComments(req.params.postId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // ==================== EVENT COMMENTS ====================
  app.post("/api/events/:eventId/comments", requireAuth, requireNonVisitor, async (req, res) => {
    try {
      const commentData = insertEventCommentSchema.parse({
        ...req.body,
        eventId: req.params.eventId,
        authorId: req.session.userId!,
      });
      
      const comment = await storage.createEventComment(commentData);
      res.json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.get("/api/events/:eventId/comments", requireAuth, async (req, res) => {
    try {
      const comments = await storage.getEventComments(req.params.eventId);
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
