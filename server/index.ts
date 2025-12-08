import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import connectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedAdminAccounts } from "./seed-admins";
import { seedScopes } from "./seed-scopes";
import { storage } from "./storage";
import { pool } from "./db";
import { testEmailConnection } from "./email";

const app = express();

// Trust proxy - Required for secure cookies to work in production behind Replit's proxy
app.set('trust proxy', 1);

// Cookie parser middleware (for remember-me tokens)
app.use(cookieParser());

// PostgreSQL session store for persistent sessions across server restarts
const PgSession = connectPgSimple(session);

// Session configuration with PostgreSQL store
app.use(
  session({
    store: new PgSession({
      pool: pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "school-community-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days (extended from 7)
    },
  })
);

// Remember-me token middleware (automatically restore sessions)
app.use(async (req, res, next) => {
  // Skip if already authenticated
  if (req.session.userId) {
    return next();
  }

  // Check for remember-me token
  const token = req.cookies?.remember_token;
  if (!token) {
    return next();
  }

  try {
    const tokenRecord = await storage.getRememberMeToken(token);
    
    if (!tokenRecord) {
      // Invalid token, clear cookie
      res.clearCookie('remember_token');
      return next();
    }

    // Check if token is expired
    if (new Date() > tokenRecord.expiresAt) {
      // Expired, delete from database and clear cookie
      await storage.deleteRememberMeToken(token);
      res.clearCookie('remember_token');
      return next();
    }

    // Valid token - restore session
    req.session.userId = tokenRecord.userId;
    
    try {
      // Update last used time and extend expiration (both in DB and cookie)
      await storage.updateRememberMeTokenActivity(tokenRecord.id);
      
      // Refresh the cookie with new expiration (7 days from now)
      res.cookie('remember_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax'
      });
    } catch (updateError) {
      // If update fails, clear the cookie to avoid state divergence
      console.error("Failed to update remember-me token activity:", updateError);
      res.clearCookie('remember_token');
      await storage.deleteRememberMeToken(token);
    }
    
    next();
  } catch (error) {
    console.error("Remember-me token validation error:", error);
    next();
  }
});

// Extend Express session type
declare module "express-session" {
  interface SessionData {
    userId?: string;
    isVisitor?: boolean;
    visitorData?: {
      username: string;
      name: string;
      role: string;
    };
  }
}

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Test email configuration on startup
  const emailConfigured = await testEmailConnection();
  if (!emailConfigured) {
    console.warn("[STARTUP] Email functionality is disabled - password reset emails will not be sent");
  }

  const server = await registerRoutes(app);

  // Automatically seed admin accounts and scopes on startup
  await seedAdminAccounts();
  await seedScopes();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
