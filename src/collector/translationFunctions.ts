export const TRANSLATION_FUNCTIONS = new Set(["t", "te", "tm", "tc", "$t", "$te", "$tm", "$tc"])

// Regex for checking if text contains a translation function. To be used to skip full parsing.
export const TRANSLATION_CALL_REGEX = /\$?t[emc]?\s*\(/
