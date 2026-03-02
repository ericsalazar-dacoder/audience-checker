import { create } from "zustand";
import type { BusinessRule, Checker, CheckerStore } from "@/app/core/types";

// Re-export types for backward compatibility
export type { BusinessRule, Checker, AlignmentReport } from "@/app/core/types";

const initialChecker: Checker = {
  id: 1,
  name: "New Query",
  query: "",
  businessRules: [{ table: "", column: "", condition: "" }],
  report: null,
  expanded: true,
  inputMode: "query",
  conditionInput: "",
};

export const useCheckerStore = create<CheckerStore>((set) => ({
  checkers: [initialChecker],
  nextId: 2,

  addChecker: () =>
    set((state) => {
      const newChecker: Checker = {
        id: state.nextId,
        name: `New Query ${state.nextId}`,
        query: "",
        businessRules: [{ table: "", column: "", condition: "" }],
        report: null,
        expanded: true,
        inputMode: "query",
        conditionInput: "",
      };
      return {
        checkers: [...state.checkers, newChecker],
        nextId: state.nextId + 1,
      };
    }),

  updateChecker: (id, field, value) =>
    set((state) => ({
      checkers: state.checkers.map((checker) =>
        checker.id === id ? { ...checker, [field]: value } : checker,
      ),
    })),

  deleteChecker: (id) =>
    set((state) => ({
      checkers: state.checkers.filter((checker) => checker.id !== id),
    })),

  toggleExpanded: (id) =>
    set((state) => ({
      checkers: state.checkers.map((checker) =>
        checker.id === id
          ? { ...checker, expanded: !checker.expanded }
          : checker,
      ),
    })),

  updateRule: (checkerId, ruleIndex, field, value) =>
    set((state) => ({
      checkers: state.checkers.map((checker) =>
        checker.id === checkerId
          ? {
              ...checker,
              businessRules: checker.businessRules.map((rule, idx) =>
                idx === ruleIndex ? { ...rule, [field]: value } : rule,
              ),
            }
          : checker,
      ),
    })),

  addRule: (checkerId) =>
    set((state) => ({
      checkers: state.checkers.map((checker) =>
        checker.id === checkerId
          ? {
              ...checker,
              businessRules: [
                ...checker.businessRules,
                { table: "", column: "", condition: "" },
              ],
            }
          : checker,
      ),
    })),

  removeRule: (checkerId, ruleIndex) =>
    set((state) => ({
      checkers: state.checkers.map((checker) =>
        checker.id === checkerId
          ? {
              ...checker,
              businessRules: checker.businessRules.filter(
                (_, idx) => idx !== ruleIndex,
              ),
            }
          : checker,
      ),
    })),

  pasteBulkRules: (checkerId, pastedText) =>
    set((state) => {
      if (!pastedText.trim()) {
        alert("Please paste business rules");
        return state;
      }

      const lines = pastedText.trim().split("\n");
      const parsedRules: BusinessRule[] = [];
      let currentRule: {
        table: string;
        column: string;
        condition: string;
      } | null = null;

      let i = 0;
      while (i < lines.length) {
        let line = lines[i];
        let trimmedLine = line.trim();
        i++;

        if (!trimmedLine) continue;

        trimmedLine = trimmedLine.replace(/\t+/g, "\t");

        // Parse the line to check if it's a valid rule
        let parts: string[];
        if (trimmedLine.includes("\t")) {
          parts = trimmedLine.split("\t").map((p) => p.trim());
        } else {
          parts = trimmedLine.split(/\s{2,}/).map((p) => p.trim());
        }

        // Detect rule structure: could be simple (table, column, condition)
        // or complex with merged cells (table, empty, empty, column, empty, condition)
        let tableName: string | null = null;
        let columnName: string | null = null;
        let condition: string | null = null;

        if (
          parts.length > 4 &&
          parts[1] === "" &&
          parts[2] === "" &&
          parts[3]
        ) {
          // Complex structure with merged cells: parts[0] = table, parts[3] = column, parts[5+] = condition
          tableName = parts[0];
          columnName = parts[3];
          condition = parts.slice(5).join(" ");
        } else if (parts.length >= 3) {
          // Simple structure with tabs: parts[0] = table, parts[1] = column, parts[2+] = condition
          tableName = parts[0];
          columnName = parts[1];
          condition = parts.slice(2).join(" ");
        }

        const isNewRule =
          tableName && columnName && condition && !tableName.match(/^[\(\><=]/);

        // Check if condition has unclosed quotes - if so, consume lines until closing quote
        if (isNewRule && condition) {
          const openQuotes = (condition.match(/"/g) || []).length;
          
          if (openQuotes % 2 === 1) {
            // Unclosed quote - consume next lines until we find the closing quote
            while (i < lines.length) {
              const nextLine = lines[i];
              const nextTrimmed = nextLine.trim();
              if (!nextTrimmed) {
                i++;
                continue;
              }
              condition += " " + nextTrimmed;
              i++;
              
              const totalQuotes = (condition.match(/"/g) || []).length;
              if (totalQuotes % 2 === 0) {
                break;
              }
            }
          }
        }

        // Now check if line starts like a condition (for non-rule lines)
        const startsLikeCondition =
          /^[(>"<=]|^(OR|AND)\s|^\d+\s|^(IS|LIKE)/.test(trimmedLine);

        // If it starts like a condition and we have a current rule, it's a continuation
        if (!isNewRule && startsLikeCondition && currentRule) {
          // Add to existing rule's condition
          currentRule.condition += " " + trimmedLine;
          continue;

        if (isNewRule) {
          let finalTableName = tableName!.toUpperCase();
          const finalColumnName = columnName!.toUpperCase();

          // Map ucg_tag and blacklist_tag to UNIVERSAL_EXCLUSION_LIST
          if (
            finalColumnName === "UCG_TAG" ||
            finalColumnName === "BLACKLIST_TAG"
          ) {
            finalTableName = "UNIVERSAL_EXCLUSION_LIST";
          }

          currentRule = {
            table: finalTableName,
            column: columnName!,
            condition: condition!,
          };
        }
      }

      // Don't forget the last rule
      if (currentRule) {
        currentRule.condition = currentRule.condition
          .replace(/^["']|["']$/g, "")
          .trim();
        parsedRules.push(currentRule);
      }

      if (parsedRules.length > 0) {
        return {
          checkers: state.checkers.map((checker) =>
            checker.id === checkerId
              ? { ...checker, businessRules: parsedRules }
              : checker,
          ),
        };
      } else {
        alert("No valid rules found. Please check the format.");
        return state;
      }
    }),

  addMultipleCheckers: (
    newCheckers: Array<{ name: string; conditions: string }>,
  ) =>
    set((state) => {
      let currentId = state.nextId;
      const checkersToAdd: Checker[] = newCheckers.map((item) => ({
        id: currentId++,
        name: item.name,
        query: "",
        businessRules: [{ table: "", column: "", condition: "" }],
        report: null,
        expanded: false,
        inputMode: "condition" as const,
        conditionInput: item.conditions,
      }));

      return {
        checkers: [...state.checkers, ...checkersToAdd],
        nextId: currentId,
      };
    }),
}));
