/**
 * Application constants
 */

/**
 * Default empty checker configuration
 */
export const DEFAULT_CHECKER_NAME = "New Checker";

/**
 * Default SQL query for new checkers
 */
export const DEFAULT_QUERY = "";

/**
 * Default business rules for new checkers
 */
export const DEFAULT_BUSINESS_RULES = [
  { table: "", column: "", condition: "" },
];

/**
 * Input mode options
 */
export const INPUT_MODES = {
  QUERY: "query" as const,
  CONDITION: "condition" as const,
};

/**
 * Theme options
 */
export const THEMES = {
  LIGHT: "light" as const,
  DARK: "dark" as const,
};

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  THEME: "query-checker-theme",
  CHECKERS: "query-checker-state",
};
