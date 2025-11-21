import OpenAI from "openai";

// Initialize OpenAI client with Replit AI Integrations
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export interface ModerationResult {
  flagged: boolean;
  categories: string[];
  reason?: string;
}

/**
 * Check if content contains inappropriate material using OpenAI Moderation API
 * Supports Arabic, English, and French content
 */
export async function moderateContent(content: string): Promise<ModerationResult> {
  try {
    // Use OpenAI's moderation API
    const moderation = await openai.moderations.create({
      input: content,
    });

    const result = moderation.results[0];
    
    if (result.flagged) {
      // Collect flagged categories
      const flaggedCategories: string[] = [];
      
      if (result.categories.sexual) flaggedCategories.push("sexual");
      if (result.categories.hate) flaggedCategories.push("hate");
      if (result.categories.harassment) flaggedCategories.push("harassment");
      if (result.categories.violence) flaggedCategories.push("violence");
      if (result.categories["self-harm"]) flaggedCategories.push("self-harm");
      if (result.categories["sexual/minors"]) flaggedCategories.push("sexual/minors");
      if (result.categories["hate/threatening"]) flaggedCategories.push("hate/threatening");
      if (result.categories["violence/graphic"]) flaggedCategories.push("violence/graphic");
      if (result.categories["self-harm/intent"]) flaggedCategories.push("self-harm/intent");
      if (result.categories["self-harm/instructions"]) flaggedCategories.push("self-harm/instructions");
      if (result.categories["harassment/threatening"]) flaggedCategories.push("harassment/threatening");
      
      return {
        flagged: true,
        categories: flaggedCategories,
        reason: `Content violates community guidelines: ${flaggedCategories.join(", ")}`,
      };
    }
    
    return {
      flagged: false,
      categories: [],
    };
  } catch (error) {
    console.error("Moderation API error:", error);
    
    // If moderation API fails, we log the error but allow the content
    // (better than blocking legitimate content)
    return {
      flagged: false,
      categories: [],
    };
  }
}

/**
 * Middleware to moderate content before saving
 * Returns error if content is flagged
 */
export async function requireModeration(content: string): Promise<void> {
  const result = await moderateContent(content);
  
  if (result.flagged) {
    throw new Error(result.reason || "Content violates community guidelines");
  }
}
