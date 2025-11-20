import { storage } from "./storage";

async function seed() {
  console.log("🌱 Seeding database...");
  
  try {
    // Create some scopes with access codes for testing
    const globalScope = await storage.createScope({
      name: "Public Square",
      type: "global",
      accessCode: "PUBLIC123", // Users can read without code, but this is for write access
    });
    console.log("✓ Created Global scope");
    
    const stage1 = await storage.createScope({
      name: "Stage 1 (Grades 1-2)",
      type: "stage",
      stageLevel: 1,
      accessCode: "STAGE1SECRET",
    });
    console.log("✓ Created Stage 1");
    
    const stage6 = await storage.createScope({
      name: "Stage 6 (Grades 11-12)",
      type: "stage",
      stageLevel: 6,
      accessCode: "STAGE6SECRET",
    });
    console.log("✓ Created Stage 6");
    
    const section10A = await storage.createScope({
      name: "Class 10-A",
      type: "section",
      sectionName: "10-A",
      accessCode: "CLASS10A",
    });
    console.log("✓ Created Section 10-A");
    
    const section10B = await storage.createScope({
      name: "Class 10-B",
      type: "section",
      sectionName: "10-B",
      accessCode: "CLASS10B",
    });
    console.log("✓ Created Section 10-B");
    
    console.log("\n📋 Access Codes for Testing:");
    console.log("- Global: PUBLIC123");
    console.log("- Stage 1: STAGE1SECRET");
    console.log("- Stage 6: STAGE6SECRET");
    console.log("- Class 10-A: CLASS10A");
    console.log("- Class 10-B: CLASS10B");
    
    console.log("\n✅ Seeding complete!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  }
}

seed();
