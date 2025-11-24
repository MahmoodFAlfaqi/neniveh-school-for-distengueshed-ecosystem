import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const ADMIN_ACCOUNTS = [
  {
    username: "Mahmood.Fawaz.AL-Faqi",
    email: "keneyreplitalfaqi+mahmood@gmail.com",
    name: "Mahmood Fawaz AL-Faqi",
    role: "admin" as const,
  },
  {
    username: "Mustafa.Mouied.Al-Ali",
    email: "keneyreplitalfaqi+mustafa@gmail.com",
    name: "Mustafa Mouied Al-Ali",
    role: "admin" as const,
  },
];

export async function seedAdminAccounts() {
  try {
    console.log("[SEED] Starting admin account initialization...");

    // Get admin password from environment variable
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD;
    
    if (!adminPassword) {
      console.error("[SEED] ⚠️  ADMIN_DEFAULT_PASSWORD environment variable is not set!");
      console.error("[SEED] ⚠️  Admin accounts will not be created. Please set this variable.");
      return; // Skip seeding if no password is provided
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    for (const adminData of ADMIN_ACCOUNTS) {
      try {
        // Check if admin already exists
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.username, adminData.username))
          .limit(1);

        if (existingUser.length > 0) {
          console.log(`[SEED] Admin account already exists: ${adminData.username}`);
          
          // Optional: Update password if hash has changed
          const passwordMatch = await bcrypt.compare(adminPassword, existingUser[0].password);
          if (!passwordMatch) {
            await db
              .update(users)
              .set({ password: hashedPassword })
              .where(eq(users.username, adminData.username));
            console.log(`[SEED] Updated password for: ${adminData.username}`);
          }
          continue;
        }

        // Create new admin account
        await db.insert(users).values({
          username: adminData.username,
          email: adminData.email,
          name: adminData.name,
          password: hashedPassword,
          role: adminData.role,
          credibilityScore: 100,
          reputationPoints: 0,
          accountStatus: "active",
        });

        console.log(`[SEED] ✓ Created admin account: ${adminData.username}`);
      } catch (error) {
        console.error(`[SEED] Failed to seed admin ${adminData.username}:`, error);
      }
    }

    console.log("[SEED] Admin account initialization complete");
  } catch (error) {
    console.error("[SEED] Critical error during admin seeding:", error);
    // Don't crash the server, just log the error
  }
}
