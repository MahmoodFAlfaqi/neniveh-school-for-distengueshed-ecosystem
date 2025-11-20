import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
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
} from "@shared/schema";
import bcrypt from "bcrypt";
import { z } from "zod";

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
      
      // Check if user already exists
      const existing = await storage.getUserByEmail(userData.email);
      if (existing) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      const user = await storage.createUser(userData);
      
      // Don't send password back
      const { password, ...userWithoutPassword } = user;
      
      res.json({ 
        message: "Registration successful",
        user: userWithoutPassword 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });
  
  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({ 
        message: "Login successful",
        user: userWithoutPassword 
      });
    } catch (error) {
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
  
  // Create post (uses authenticated user)
  app.post("/api/posts", requireAuth, async (req, res) => {
    try {
      const postData = insertPostSchema.parse({
        ...req.body,
        authorId: req.session.userId!, // Use authenticated user
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
      const eventData = insertEventSchema.parse({
        ...req.body,
        createdById: req.session.userId!,
      });
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create event" });
    }
  });
  
  // Get events
  app.get("/api/events", requireAuth, async (req, res) => {
    try {
      const scopeId = req.query.scopeId as string | undefined;
      const events = await storage.getEvents(scopeId);
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
  
  // Get single teacher
  app.get("/api/teachers/:id", requireAuth, async (req, res) => {
    try {
      const teacher = await storage.getTeacher(req.params.id);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      res.json(teacher);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teacher" });
    }
  });
  
  // Create teacher review
  app.post("/api/teachers/:id/reviews", requireAuth, async (req, res) => {
    try {
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

  const httpServer = createServer(app);

  return httpServer;
}
