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
    
    // Grade Scopes (6 grades)
    const gradeScopes = [
      { grade: 1, accessCode: "gaDrIE5Lo0" },
      { grade: 2, accessCode: "SolELo74F" },
      { grade: 3, accessCode: "3FojUvCk02" },
      { grade: 4, accessCode: "Dm8OnmTj5" },
      { grade: 5, accessCode: "BloIfc63CjH" },
      { grade: 6, accessCode: "tiKoEjN6A2" },
    ];
    
    for (const { grade, accessCode } of gradeScopes) {
      await storage.createScope({
        name: `Grade ${grade}`,
        type: "grade",
        gradeNumber: grade,
        accessCode,
      });
    }
    console.log(`[SEED] ✓ Created ${gradeScopes.length} grade scopes`);
    
    // Class Scopes (5 classes per grade: A, B, C, D, E)
    const classScopes = [
      // Grade 1
      { grade: 1, section: "A", accessCode: "jtKJdrDS9K" },
      { grade: 1, section: "B", accessCode: "HJdr3cVj90p" },
      { grade: 1, section: "C", accessCode: "Poij8gdf4s" },
      { grade: 1, section: "D", accessCode: "Gytrf6J9lkyF" },
      { grade: 1, section: "E", accessCode: "Sdfe57YIJkl" },
      // Grade 2
      { grade: 2, section: "A", accessCode: "juyGAY63D" },
      { grade: 2, section: "B", accessCode: "LijKmnBesa3f" },
      { grade: 2, section: "C", accessCode: "TcdsE7TkjO31" },
      { grade: 2, section: "D", accessCode: "EcSfC7AhPsE7" },
      { grade: 2, section: "E", accessCode: "FkhfUvCmjK75" },
      // Grade 3
      { grade: 3, section: "A", accessCode: "SkoiyHifI67T" },
      { grade: 3, section: "B", accessCode: "NkuEfdRjyU8" },
      { grade: 3, section: "C", accessCode: "Rover3Black" },
      { grade: 3, section: "D", accessCode: "hgtyuGPT67" },
      { grade: 3, section: "E", accessCode: "lsihyxXxfa645" },
      // Grade 4
      { grade: 4, section: "A", accessCode: "u7T59x92Gp" },
      { grade: 4, section: "B", accessCode: "XDfh65trfc" },
      { grade: 4, section: "C", accessCode: "Lokoko6768h" },
      { grade: 4, section: "D", accessCode: "FOwO7cEjMBjOfY75" },
      { grade: 4, section: "E", accessCode: "GjiAfdYk75" },
      // Grade 5
      { grade: 5, section: "A", accessCode: "Mahmood75fd5" },
      { grade: 5, section: "B", accessCode: "Senpai8YDf" },
      { grade: 5, section: "C", accessCode: "SHkjtfOnmjT76d" },
      { grade: 5, section: "D", accessCode: "911EMERGENCY9" },
      { grade: 5, section: "E", accessCode: "Htsxd44Ate" },
      // Grade 6
      { grade: 6, section: "A", accessCode: "FoFo6ds5Boy" },
      { grade: 6, section: "B", accessCode: "LmjuOdV5E" },
      { grade: 6, section: "C", accessCode: "THX53dciyilG" },
      { grade: 6, section: "D", accessCode: "legfsxrtut7" },
      { grade: 6, section: "E", accessCode: "AREURIGHT7" },
    ];
    
    for (const { grade, section, accessCode } of classScopes) {
      const sectionName = `${grade}-${section}`;
      await storage.createScope({
        name: `Class ${sectionName}`,
        type: "section",
        sectionName,
        accessCode,
      });
    }
    
    console.log(`[SEED] ✓ Created ${classScopes.length} class section scopes`);
    console.log(`[SEED] ✅ Scope initialization complete! (${gradeScopes.length} grades + ${classScopes.length} class sections)`);
    
  } catch (error) {
    console.error("[SEED] ❌ Failed to seed scopes:", error);
    // Don't throw - allow server to continue running
  }
}
