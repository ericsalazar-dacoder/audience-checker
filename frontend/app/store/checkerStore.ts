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
        checker.id === id ? { ...checker, [field]: value } : checker
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
          : checker
      ),
    })),

  updateRule: (checkerId, ruleIndex, field, value) =>
    set((state) => ({
      checkers: state.checkers.map((checker) =>
        checker.id === checkerId
          ? {
              ...checker,
              businessRules: checker.businessRules.map((rule, idx) =>
                idx === ruleIndex ? { ...rule, [field]: value } : rule
              ),
            }
          : checker
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
          : checker
      ),
    })),

  removeRule: (checkerId, ruleIndex) =>
    set((state) => ({
      checkers: state.checkers.map((checker) =>
        checker.id === checkerId
          ? {
              ...checker,
              businessRules: checker.businessRules.filter(
                (_, idx) => idx !== ruleIndex
              ),
            }
          : checker
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

      lines.forEach((line) => {
        let trimmedLine = line.trim();
        if (!trimmedLine) return;

        trimmedLine = trimmedLine.replace(/\t+/g, "\t");

        let parts: string[];
        if (trimmedLine.includes("\t")) {
          parts = trimmedLine.split("\t").map((p) => p.trim());
        } else {
          parts = trimmedLine.split(/\s{2,}/).map((p) => p.trim());
        }

        if (parts.length >= 3) {
          let tableName = parts[0].toUpperCase();
          const columnName = parts[1].toUpperCase();

          // Map ucg_tag and blacklist_tag to UNIVERSAL_EXCLUSION_LIST
          if (columnName === "UCG_TAG" || columnName === "BLACKLIST_TAG") {
            tableName = "UNIVERSAL_EXCLUSION_LIST";
          }

          parsedRules.push({
            table: tableName,
            column: parts[1],
            condition: parts.slice(2).join(" "),
          });
        }
      });

      if (parsedRules.length > 0) {
        return {
          checkers: state.checkers.map((checker) =>
            checker.id === checkerId
              ? { ...checker, businessRules: parsedRules }
              : checker
          ),
        };
      } else {
        alert("No valid rules found. Please check the format.");
        return state;
      }
    }),

  addMultipleCheckers: (
    newCheckers: Array<{ name: string; conditions: string }>
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
