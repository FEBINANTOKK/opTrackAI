import { Preferences } from "../types/auth";

/**
 * Ensures that a value is an array of strings.
 * Handles:
 * - Single string: "Remote" -> ["Remote"]
 * - Comma separated string in array: ["React, TS"] -> ["React", "TS"]
 * - Null/Undefined: null -> []
 */
export function ensureArray(value: any): string[] {
  if (!value) return [];
  
  if (Array.isArray(value)) {
    // Flatten and split any strings that might contain commas
    return value.flatMap(item => {
      if (typeof item === 'string') {
        return item.split(',').map(s => s.trim()).filter(Boolean);
      }
      return [];
    });
  }
  
  if (typeof value === 'string') {
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }
  
  return [];
}

/**
 * Normalizes a preferences object to ensure all multi-value fields are valid arrays.
 */
export function normalizePreferences(prefs: any): Preferences {
  if (!prefs) return prefs;
  
  return {
    ...prefs,
    reward: ensureArray(prefs.reward),
    workMode: ensureArray(prefs.workMode),
    timeCommitment: ensureArray(prefs.timeCommitment),
    opportunityType: ensureArray(prefs.opportunityType),
    skills: ensureArray(prefs.skills),
    target: prefs.target || 'student',
    location: typeof prefs.location === 'string' ? prefs.location : '',
  };
}
