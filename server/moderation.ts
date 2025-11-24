import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export interface ModerationResult {
  flagged: boolean;
  categories: string[];
  reason?: string;
}

export interface EnhancedModerationResult {
  isViolation: boolean;
  violationType?: "spam" | "offensive" | "hate_speech" | "harassment" | "inappropriate";
  severity?: "low" | "medium" | "high" | "critical";
  confidence: number;
  reasoning: string;
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

export async function requireModeration(content: string): Promise<void> {
  const result = await moderateContent(content);
  
  if (result.flagged) {
    throw new Error(result.reason || "Content violates community guidelines");
  }
}

export async function moderateContentEnhanced(content: string, contentType: string): Promise<EnhancedModerationResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a content moderation AI for a school community platform. Analyze the following ${contentType} content and determine if it violates community guidelines.

Check for:
1. Spam (repetitive, irrelevant, or promotional content)
2. Offensive language (profanity, insults, derogatory remarks)
3. Hate speech (discrimination, racism, sexism, etc.)
4. Harassment (bullying, threats, intimidation)
5. Inappropriate content (sexual content, violence, illegal activities)

Respond ONLY with valid JSON matching this exact structure:
{
  "isViolation": boolean,
  "violationType": "spam" | "offensive" | "hate_speech" | "harassment" | "inappropriate" | null,
  "severity": "low" | "medium" | "high" | "critical" | null,
  "confidence": number (0-1),
  "reasoning": "Brief explanation of why this is or isn't a violation"
}

For school context:
- Be strict but fair
- Consider age-appropriate language
- Flag bullying and exclusionary behavior
- Allow constructive criticism and debate`
        },
        {
          role: "user",
          content: `Moderate this ${contentType}: "${content}"`
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 500,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");
    
    return {
      isViolation: result.isViolation || false,
      violationType: result.violationType,
      severity: result.severity,
      confidence: result.confidence || 0,
      reasoning: result.reasoning || "No reasoning provided"
    };
  } catch (error) {
    console.error("Enhanced moderation error:", error);
    return {
      isViolation: false,
      confidence: 0,
      reasoning: "Moderation service error - content allowed by default"
    };
  }
}

export function calculatePunishment(
  violationType: string,
  severity: string,
  userViolationCount: number
): {
  punishmentType: "warning" | "credibility_reduction" | "temp_ban" | "permanent_ban";
  credibilityPenalty: number;
  banDurationHours?: number;
} {
  const severityMultiplier = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 5
  }[severity] || 1;

  const baseCredibilityPenalty = {
    spam: 2,
    offensive: 5,
    hate_speech: 15,
    harassment: 10,
    inappropriate: 8
  }[violationType] || 5;

  const credibilityPenalty = baseCredibilityPenalty * severityMultiplier * (1 + userViolationCount * 0.2);

  if (severity === "critical" || userViolationCount >= 5) {
    return {
      punishmentType: "permanent_ban",
      credibilityPenalty: Math.min(credibilityPenalty, 50)
    };
  }

  if (severity === "high" || userViolationCount >= 3) {
    return {
      punishmentType: "temp_ban",
      credibilityPenalty: Math.min(credibilityPenalty, 30),
      banDurationHours: severity === "high" ? 168 : 72
    };
  }

  if (credibilityPenalty >= 10 || userViolationCount >= 2) {
    return {
      punishmentType: "credibility_reduction",
      credibilityPenalty: Math.min(credibilityPenalty, 20)
    };
  }

  return {
    punishmentType: "warning",
    credibilityPenalty: Math.min(credibilityPenalty, 5)
  };
}
