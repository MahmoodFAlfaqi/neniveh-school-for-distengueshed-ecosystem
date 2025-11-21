import { storage } from "./storage";

async function seed() {
  console.log("🌱 Seeding database...");
  
  try {
    // Create global scope
    const globalScope = await storage.createScope({
      name: "Public Square",
      type: "global",
      accessCode: "PUBLIC123",
    });
    console.log("✓ Created Global scope");
    
    // Create 22 class sections as specified:
    // Classes 1-4: 4 groups each (A, B, C, D)
    // Class 5: 5 groups (A, B, C, D, E)
    // Class 6: 1 group (A)
    
    const classes = [
      { classNum: 1, groups: ['A', 'B', 'C', 'D'] },
      { classNum: 2, groups: ['A', 'B', 'C', 'D'] },
      { classNum: 3, groups: ['A', 'B', 'C', 'D'] },
      { classNum: 4, groups: ['A', 'B', 'C', 'D'] },
      { classNum: 5, groups: ['A', 'B', 'C', 'D', 'E'] },
      { classNum: 6, groups: ['A'] },
    ];
    
    console.log("\n📚 Creating class sections:");
    for (const { classNum, groups } of classes) {
      for (const group of groups) {
        const sectionName = `${classNum}-${group}`;
        const accessCode = `CLASS${classNum}${group}`;
        
        await storage.createScope({
          name: `Class ${sectionName}`,
          type: "section",
          sectionName,
          accessCode,
        });
        
        console.log(`  ✓ Class ${sectionName} (Code: ${accessCode})`);
      }
    }
    
    console.log("\n📋 Access Codes Summary:");
    console.log("─────────────────────────────────────");
    console.log("Global:");
    console.log("  • Public Square: PUBLIC123");
    console.log("\nClass Sections (22 total):");
    console.log("  Classes 1-4 (A, B, C, D groups):");
    console.log("    • 1-A: CLASS1A, 1-B: CLASS1B, 1-C: CLASS1C, 1-D: CLASS1D");
    console.log("    • 2-A: CLASS2A, 2-B: CLASS2B, 2-C: CLASS2C, 2-D: CLASS2D");
    console.log("    • 3-A: CLASS3A, 3-B: CLASS3B, 3-C: CLASS3C, 3-D: CLASS3D");
    console.log("    • 4-A: CLASS4A, 4-B: CLASS4B, 4-C: CLASS4C, 4-D: CLASS4D");
    console.log("  Class 5 (A, B, C, D, E groups):");
    console.log("    • 5-A: CLASS5A, 5-B: CLASS5B, 5-C: CLASS5C, 5-D: CLASS5D, 5-E: CLASS5E");
    console.log("  Class 6 (A group only):");
    console.log("    • 6-A: CLASS6A");
    console.log("─────────────────────────────────────");
    
    console.log("\n✅ Seeding complete! Created 23 scopes (1 global + 22 class sections)");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  }
}

seed();
