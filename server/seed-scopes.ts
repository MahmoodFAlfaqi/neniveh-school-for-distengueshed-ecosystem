import { storage } from "./storage";

/**
 * Seed scopes and access codes on server startup
 * Safe to run multiple times - checks for existing data first
 */
export async function seedScopes() {
  try {
    console.log("[SEED] Checking scopes initialization...");
    
    // Check if scopes already exist
    const existingScopes = await storage.getAllScopes();
    if (existingScopes && existingScopes.length > 0) {
      console.log(`[SEED] ✓ Found ${existingScopes.length} existing scopes, skipping seed`);
      return;
    }
    
    console.log("[SEED] 🌱 No scopes found, initializing default scopes...");
    
    // Create global scope
    await storage.createScope({
      name: "Public Square",
      type: "global",
      accessCode: "PUBLIC123",
    });
    console.log("[SEED] ✓ Created Global scope (Public Square)");
    
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
    
    let classCount = 0;
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
        classCount++;
      }
    }
    
    console.log(`[SEED] ✓ Created ${classCount} class section scopes`);
    console.log(`[SEED] ✅ Scope initialization complete! (1 global + ${classCount} class sections)`);
    
  } catch (error) {
    console.error("[SEED] ❌ Failed to seed scopes:", error);
    // Don't throw - allow server to continue running
  }
}
