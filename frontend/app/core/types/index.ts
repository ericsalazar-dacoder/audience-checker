/**
 * Core type definitions for the Query Checker application
 */

/**
 * Represents a single business rule for validation
 */
export interface BusinessRule {
  table: string;
  column: string;
  condition: string;
}

/**
 * Represents the alignment report generated after comparing query with business rules
 */
export interface AlignmentReport {
  totalConditions: number;
  matched: Array<{ table: string; column: string; condition: string }>;
  misaligned: Array<{ condition: string; issues: string[] }>;
  undefined: Array<string>;
  allConditions: string[];
  alignmentPercentage: number;
}

/**
 * Input mode for the checker - either full SQL query or just WHERE conditions
 */
export type InputMode = "query" | "condition";

/**
 * Represents a single checker instance with its query, rules, and report
 */
export interface Checker {
  id: number;
  name: string;
  query: string;
  businessRules: BusinessRule[];
  report: AlignmentReport | null;
  expanded: boolean;
  inputMode: InputMode;
  conditionInput: string;
}

/**
 * Zustand store state and actions for managing checkers
 */
export interface CheckerStore {
  checkers: Checker[];
  nextId: number;
  addChecker: () => void;
  updateChecker: (id: number, field: keyof Checker, value: unknown) => void;
  deleteChecker: (id: number) => void;
  toggleExpanded: (id: number) => void;
  updateRule: (
    checkerId: number,
    ruleIndex: number,
    field: keyof BusinessRule,
    value: string
  ) => void;
  addRule: (checkerId: number) => void;
  removeRule: (checkerId: number, ruleIndex: number) => void;
  pasteBulkRules: (checkerId: number, pastedText: string) => void;
  addMultipleCheckers: (
    checkers: Array<{ name: string; conditions: string }>
  ) => void;
}
