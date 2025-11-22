/**
 * Seed script to create the two special admin accounts
 * Run this once to initialize the system with admin access
 */

import { db } from "./db";
import { users, adminStudentIds } from "@shared/schema";
import bcrypt from "bcrypt";

const SPECIAL_ADMIN_PASSWORD = "NOTHINg27$"; // This will be hashed before storage

const specialAdmins = [
  {
    name: "Mahmood Fawaz AL-Faqi",
    username: "Mahmood.Fawaz.AL-Faqi",
    studentId: "ADMIN001",
    email: "mahmood.alfaqi@school.edu",
    phone: null,
  },
  {
    name: "Mustafa Mouied Al-Ali",
    username: "Mustafa.Mouied.Al-Ali",
    studentId: "ADMIN002",
    email: "mustafa.alali@school.edu",
    phone: null,
  },
];

async function seedSpecialAdmins() {
  try {
    console.log("🌱 Seeding special admin accounts...");

    // Hash the special password once
    const hashedPassword = await bcrypt.hash(SPECIAL_ADMIN_PASSWORD, 10);

    // Bootstrap: Create first admin to use as creator for student IDs
    let firstAdminId: string | null = null;

    for (let i = 0; i < specialAdmins.length; i++) {
      const admin = specialAdmins[i];

      // Check if admin already exists
      const existing = await db
        .select()
        .from(users)
        .where((u) => u.username === admin.username);

      if (existing.length > 0) {
        console.log(`✓ Admin "${admin.name}" already exists, skipping...`);
        if (i === 0) {
          firstAdminId = existing[0].id;
        }
        continue;
      }

      // Create admin user first (directly insert to bypass student ID check)
      const [user] = await db
        .insert(users)
        .values({
          username: admin.username,
          studentId: admin.studentId,
          email: admin.email,
          phone: admin.phone,
          password: hashedPassword,
          name: admin.name,
          role: "admin",
          isSpecialAdmin: true,
        })
        .returning();

      if (i === 0) {
        firstAdminId = user.id;
      }

      console.log(`✅ Created special admin: ${admin.name}`);
      console.log(`   Username: ${admin.username}`);
      console.log(`   Student ID: ${admin.studentId}`);
      console.log(`   Email: ${admin.email}`);
    }

    // Now create student ID records using first admin as creator
    if (firstAdminId) {
      console.log("\n📝 Creating student ID records...");

      for (const admin of specialAdmins) {
        // Check if student ID record exists
        const existing = await db
          .select()
          .from(adminStudentIds)
          .where((ids) => ids.studentId === admin.studentId);

        if (existing.length > 0) {
          console.log(`✓ Student ID "${admin.studentId}" already exists, skipping...`);
          continue;
        }

        // Get the user who owns this studentId
        const [user] = await db
          .select()
          .from(users)
          .where((u) => u.studentId === admin.studentId);

        if (user) {
          await db.insert(adminStudentIds).values({
            studentId: admin.studentId,
            createdByAdminId: firstAdminId,
            isAssigned: true,
            assignedToUserId: user.id,
            assignedAt: new Date(),
          });

          console.log(`✓ Created student ID record: ${admin.studentId}`);
        }
      }
    }

    console.log("\n✅ Special admin seeding complete!");
    console.log(`\n🔐 Login credentials for both admins:`);
    console.log(`\n📝 Usernames:`);
    specialAdmins.forEach((admin) => {
      console.log(`   - ${admin.username}`);
    });
  } catch (error) {
    console.error("❌ Error seeding special admins:", error);
    throw error;
  }
}

// Run if executed directly
seedSpecialAdmins()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  });

export { seedSpecialAdmins };
