import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Table alias mapping - maps SQL table names to business rule table names
 * e.g., CAR_BROADBAND -> BB_POSTPAID
 */
export interface TableAlias {
  id: string;
  sqlTableName: string;
  ruleTableName: string;
}

/**
 * Condition equivalence - defines conditions that are considered equal
 * e.g., "IS NULL OR IS EMPTY" matches COALESCE(x,'') = '' or x IS NULL
 */
export interface ConditionEquivalence {
  id: string;
  name: string;
  rulePattern: string; // What the business rule says
  sqlPatterns: string[]; // SQL patterns that match this rule
}

/**
 * Column to table mapping - auto-maps specific columns to a table name
 * e.g., blacklist_tag -> universal_exclusion_list
 */
export interface ColumnTableMapping {
  id: string;
  columnName: string;
  tableName: string;
}

interface ConfigState {
  tableAliases: TableAlias[];
  conditionEquivalences: ConditionEquivalence[];
  columnTableMappings: ColumnTableMapping[];

  // Table alias actions
  addTableAlias: (alias: Omit<TableAlias, "id">) => void;
  updateTableAlias: (id: string, alias: Partial<TableAlias>) => void;
  deleteTableAlias: (id: string) => void;

  // Condition equivalence actions
  addConditionEquivalence: (equiv: Omit<ConditionEquivalence, "id">) => void;
  updateConditionEquivalence: (
    id: string,
    equiv: Partial<ConditionEquivalence>
  ) => void;
  deleteConditionEquivalence: (id: string) => void;
  addSqlPattern: (equivId: string, pattern: string) => void;
  removeSqlPattern: (equivId: string, patternIndex: number) => void;

  // Column table mapping actions
  addColumnTableMapping: (mapping: Omit<ColumnTableMapping, "id">) => void;
  updateColumnTableMapping: (
    id: string,
    mapping: Partial<ColumnTableMapping>
  ) => void;
  deleteColumnTableMapping: (id: string) => void;
}

// Default configurations
const defaultTableAliases: TableAlias[] = [
  {
    id: "1",
    sqlTableName: "CAR_BROADBAND",
    ruleTableName: "BB_POSTPAID",
  },
];

const defaultConditionEquivalences: ConditionEquivalence[] = [
  {
    id: "1",
    name: "IS NULL or IS EMPTY",
    rulePattern: "IS NULL OR IS EMPTY",
    sqlPatterns: [
      "IS NULL",
      "COALESCE({{column}},'') = ''",
      "{{column}} = ''",
      "{{column}} IS NULL OR {{column}} = ''",
    ],
  },
  {
    id: "2",
    name: "IS NOT NULL and IS NOT EMPTY",
    rulePattern: "IS NOT NULL AND IS NOT EMPTY",
    sqlPatterns: [
      "IS NOT NULL",
      "COALESCE({{column}},'') <> ''",
      "{{column}} <> ''",
      "{{column}} IS NOT NULL AND {{column}} <> ''",
    ],
  },
  {
    id: "3",
    name: "Zero or NULL",
    rulePattern: "0 OR IS NULL OR IS EMPTY",
    sqlPatterns: [
      "= '0'",
      "= 0",
      "IS NULL",
      "{{column}} = '0' OR {{column}} IS NULL",
    ],
  },
  {
    id: "4",
    name: "Boolean True",
    rulePattern: "1",
    sqlPatterns: ["= '1'", "= 1", "= TRUE", "= 'TRUE'", "= 'Y'", "= 'YES'"],
  },
  {
    id: "5",
    name: "Boolean False",
    rulePattern: "0",
    sqlPatterns: ["= '0'", "= 0", "= FALSE", "= 'FALSE'", "= 'N'", "= 'NO'"],
  },
];

const defaultColumnTableMappings: ColumnTableMapping[] = [
  {
    id: "1",
    columnName: "blacklist_tag",
    tableName: "universal_exclusion_list",
  },
  {
    id: "2",
    columnName: "ucg_tag",
    tableName: "universal_exclusion_list",
  },
];

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      tableAliases: defaultTableAliases,
      conditionEquivalences: defaultConditionEquivalences,
      columnTableMappings: defaultColumnTableMappings,

      addTableAlias: (alias) =>
        set((state) => ({
          tableAliases: [...state.tableAliases, { ...alias, id: generateId() }],
        })),

      updateTableAlias: (id, updates) =>
        set((state) => ({
          tableAliases: state.tableAliases.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),

      deleteTableAlias: (id) =>
        set((state) => ({
          tableAliases: state.tableAliases.filter((a) => a.id !== id),
        })),

      addConditionEquivalence: (equiv) =>
        set((state) => ({
          conditionEquivalences: [
            ...state.conditionEquivalences,
            { ...equiv, id: generateId() },
          ],
        })),

      updateConditionEquivalence: (id, updates) =>
        set((state) => ({
          conditionEquivalences: state.conditionEquivalences.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),

      deleteConditionEquivalence: (id) =>
        set((state) => ({
          conditionEquivalences: state.conditionEquivalences.filter(
            (e) => e.id !== id
          ),
        })),

      addSqlPattern: (equivId, pattern) =>
        set((state) => ({
          conditionEquivalences: state.conditionEquivalences.map((e) =>
            e.id === equivId
              ? { ...e, sqlPatterns: [...e.sqlPatterns, pattern] }
              : e
          ),
        })),

      removeSqlPattern: (equivId, patternIndex) =>
        set((state) => ({
          conditionEquivalences: state.conditionEquivalences.map((e) =>
            e.id === equivId
              ? {
                  ...e,
                  sqlPatterns: e.sqlPatterns.filter(
                    (_, idx) => idx !== patternIndex
                  ),
                }
              : e
          ),
        })),

      addColumnTableMapping: (mapping) =>
        set((state) => ({
          columnTableMappings: [
            ...state.columnTableMappings,
            { ...mapping, id: generateId() },
          ],
        })),

      updateColumnTableMapping: (id, updates) =>
        set((state) => ({
          columnTableMappings: state.columnTableMappings.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      deleteColumnTableMapping: (id) =>
        set((state) => ({
          columnTableMappings: state.columnTableMappings.filter(
            (m) => m.id !== id
          ),
        })),
    }),
    {
      name: "audience-checker-config",
    }
  )
);
