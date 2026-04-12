export const TRANSLATION_FUNCTIONS = new Set(["t", "te", "tm", "tc", "$t", "$te", "$tm", "$tc"])

// Regex for checking if text contains a translation function. To be used to skip full parsing.
export const TRANSLATION_CALL_REGEX = new RegExp(
  "(?:" +
    TRANSLATION_FUNCTIONS.values()
      .toArray()
      .sort((a, b) => b.length - a.length)
      .map((fn) => RegExp.escape(fn))
      .join("|") +
    ")\\s*\\(",
)
