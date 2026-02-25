/**
 * Utility functions for parsing and analyzing SQL queries and business rules
 * Includes checks for brand and mnp_brand fields
 */

import { BusinessRule, AlignmentReport } from "../store/checkerStore";

// Extract all column names mentioned in WHERE clause
const extractAllColumnNames = (sql: string): Set<string> => {
  // Normalize SQL to single line for regex matching
  const normalizedSql = sql.replace(/\s+/g, " ").trim();
  const whereMatch = normalizedSql.match(/WHERE\s+(.*?)(?:LIMIT|$)/i);
  if (!whereMatch) return new Set();

  const whereClause = whereMatch[1];
  const columns = new Set<string>();

  // Match patterns like table.column or just column names
  const columnMatches = whereClause.match(/(\w+)\.(\w+)/g) || [];
  columnMatches.forEach((match: string) => {
    const parts = match.split(".");
    if (parts.length === 2) {
      columns.add(parts[1].toUpperCase());
    }
  });

  return columns;
};

// Parse WHERE clause conditions from SQL query
export const parseWhereConditions = (sql: string): string[] => {
  // Normalize SQL to single line for proper parsing (handles formatted multi-line SQL)
  // Also ensure spaces around AND/OR keywords for proper splitting
  let normalizedSql = sql.replace(/\s+/g, " ").trim();
  // Add space before AND/OR if preceded by ) without space
  normalizedSql = normalizedSql.replace(/\)AND\b/gi, ") AND");
  normalizedSql = normalizedSql.replace(/\)OR\b/gi, ") OR");

  const whereMatch = normalizedSql.match(
    /WHERE\s+(.*?)(?:LIMIT|ORDER\s+BY|GROUP\s+BY|HAVING|$)/i,
  );
  if (!whereMatch) return [];

  const whereClause = whereMatch[1].trim();
  const conditions: string[] = [];

  let depth = 0;
  let current = "";

  for (let i = 0; i < whereClause.length; i++) {
    const char = whereClause[i];

    if (char === "(") {
      depth++;
      current += char;
    } else if (char === ")") {
      depth--;
      current += char;
    } else if (depth === 0) {
      // Check for AND keyword at depth 0 (top-level AND, not inside parentheses)
      if (
        whereClause.substring(i).toUpperCase().startsWith("AND ") &&
        (i === 0 || /[\s)]/.test(whereClause[i - 1]))
      ) {
        if (current.trim()) {
          conditions.push(current.trim());
        }
        current = "";
        i += 3;
        while (i < whereClause.length && /\s/.test(whereClause[i])) {
          i++;
        }
        i--;
      } else {
        current += char;
      }
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    conditions.push(current.trim());
  }

  return conditions.filter((c) => c);
};

// Extract table and column information from WHERE clause
export const extractTableColumns = (sql: string): Record<string, string[]> => {
  const conditions = parseWhereConditions(sql);
  const tableColumns: Record<string, string[]> = {};

  conditions.forEach((condition) => {
    const matches = condition.match(/(\w+)\.(\w+)/g);
    if (matches) {
      matches.forEach((match) => {
        const [table, column] = match.split(".");
        if (!tableColumns[table]) {
          tableColumns[table] = [];
        }
        if (!tableColumns[table].includes(column)) {
          tableColumns[table].push(column);
        }
      });
    }
  });

  return tableColumns;
};

// Parse business rule format
export const parseBusinessRule = (
  ruleText: string,
): Record<string, Record<string, string>> => {
  const lines = ruleText.split("\n").filter((line) => line.trim());
  const rules: Record<string, Record<string, string>> = {};

  lines.forEach((line) => {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 2) {
      const table = parts[0].toUpperCase();
      const column = parts[1].toUpperCase();
      const condition = parts.slice(2).join(" ");

      if (!rules[table]) {
        rules[table] = {};
      }
      rules[table][column] = condition;
    }
  });

  return rules;
};

// Helper function to find matching table in business rules
const findMatchingRuleTable = (
  sqlTableName: string,
  businessRules: Record<string, Record<string, string>>,
): string | null => {
  const sqlTableUpper = sqlTableName.toUpperCase();

  // Check for exact match first
  if (businessRules[sqlTableUpper]) {
    return sqlTableUpper;
  }

  // Map common table aliases to their rule table names
  const tableAliasMap: Record<string, string> = {
    CAR_BROADBAND: "BB_POSTPAID",
    BB_POSTPAID: "BB_POSTPAID",
  };

  const mappedTable = tableAliasMap[sqlTableUpper];
  if (mappedTable && businessRules[mappedTable]) {
    return mappedTable;
  }

  // Check for any rule table that could match
  for (const ruleTable of Object.keys(businessRules)) {
    // If the SQL table starts with the rule table or vice versa (loose matching)
    if (
      sqlTableUpper.includes(ruleTable) ||
      ruleTable.includes(sqlTableUpper)
    ) {
      return ruleTable;
    }
  }

  return null;
};

// Check if a condition matches the business rule
export const checkConditionAlignment = (
  condition: string,
  businessRules: Record<string, Record<string, string>>,
): {
  matched: Array<{ table: string; column: string; condition: string }>;
  issues: string[];
  matchedTableColumn?: string; // Track which rule was matched
} => {
  const issues: string[] = [];
  const matched: Array<{ table: string; column: string; condition: string }> =
    [];

  const tableColumnMatch = condition.match(/(\w+)\.(\w+)/);
  if (!tableColumnMatch) {
    return {
      matched: [],
      issues: ["Could not parse table.column from condition"],
    };
  }

  const [, table, column] = tableColumnMatch;
  const tableUpper = table.toUpperCase();
  const columnUpper = column.toUpperCase();

  // Find matching rule table (handles aliases like car_broadband -> BB_POSTPAID)
  const ruleTable = findMatchingRuleTable(tableUpper, businessRules);

  // Check if business rule exists for this column in the matching table
  if (ruleTable && businessRules[ruleTable][columnUpper]) {
    const ruleCondition = businessRules[ruleTable][columnUpper].toUpperCase();
    const conditionUpper = condition.toUpperCase();

    // Check for alignment
    if (matchesRule(conditionUpper, ruleCondition)) {
      matched.push({ table: ruleTable, column, condition: ruleCondition });
    } else {
      issues.push(
        `Condition for ${table}.${column} does not align with rule: ${ruleCondition}`,
      );
    }
  } else {
    if (tableUpper !== "UM_OBJECTS") {
      issues.push(`No business rule defined for ${table}.${column}`);
    }
  }

  return { matched, issues };
};

// Check if a field is brand or mnp_brand related
const isBrandOrMnpBrandField = (columnUpper: string): boolean => {
  return columnUpper === "BRAND_TYPE_CODE" || columnUpper === "MNP_BRAND";
};

// Check if a SQL condition matches a business rule condition
const matchesRule = (sqlCondition: string, ruleCondition: string): boolean => {
  // Handle generic template: IN({{values}}) - matches any IN with any number of values
  if (ruleCondition.includes("{{values}}")) {
    // Extract all values from SQL condition
    const sqlInMatch = sqlCondition.match(/IN\s*\(\s*(.+?)\s*\)/i);
    const sqlOrMatch = sqlCondition.match(/=\s*['"](.*?)['"]|=\s*'([^']+)'/g);

    // If SQL has IN clause
    if (sqlInMatch) {
      return true; // Any IN matches the generic IN({{values}}) pattern
    }

    // If SQL has OR conditions with =
    if (sqlOrMatch && sqlOrMatch.length > 0) {
      return true; // Any = value pairs match the generic pattern
    }
  }

  // Handle template patterns: IN ('{{value}}','{{value}}') with dynamic count
  if (ruleCondition.includes("{{value}}")) {
    // For IN clauses, make the value count dynamic
    if (ruleCondition.includes("IN (")) {
      // Match IN with any number of quoted values: IN ('val1','val2','val3',...)
      // Replace template with regex that matches one or more quoted values
      const regexPattern = ruleCondition
        .replace(/,\s*'{{value}}'/g, "(?:,\\s*'[^']+')*") // Match zero or more additional values
        .replace(/'{{value}}'/g, "'[^']+'") // Match at least one value
        .replace(/\s+/g, "\\s*");

      try {
        const templateRegex = new RegExp(regexPattern, "i");
        if (templateRegex.test(sqlCondition)) {
          return true;
        }
      } catch (e) {
        // Regex is invalid, fall through to other checks
      }
    } else {
      // For non-IN patterns, use original replacement
      const regexPattern = ruleCondition
        .replace(/{{value}}/g, "'([^']+)'")
        .replace(/\s+/g, "\\s*");

      try {
        const templateRegex = new RegExp(regexPattern, "i");
        if (templateRegex.test(sqlCondition)) {
          return true;
        }
      } catch (e) {
        // Regex is invalid, fall through to other checks
      }
    }
  }

  // Handle IN clause in rule: IN ('PAID BILL','PARTIAL PAYMENT')
  if (ruleCondition.includes("IN (")) {
    // Extract values from IN clause
    const inMatch = ruleCondition.match(/IN\s*\(\s*(.+?)\s*\)/i);
    if (inMatch) {
      const values = inMatch[1]
        .split(",")
        .map((v) => v.trim().replace(/^['"]|['"]$/g, ""))
        .filter((v) => v);

      // Check if SQL contains any of these values with OR
      if (values.length > 0) {
        // Check for "column = 'value' OR column = 'value'" pattern
        const hasAllValues = values.every(
          (val) =>
            sqlCondition.includes(`"${val}"`) ||
            sqlCondition.includes(`'${val}'`),
        );

        // Also check for IN clause in SQL
        const sqlInMatch = sqlCondition.match(/IN\s*\(\s*(.+?)\s*\)/i);
        const hasInClause =
          sqlInMatch && values.every((val) => sqlInMatch[1].includes(val));

        return hasAllValues || hasInClause || sqlCondition.includes("OR");
      }
    }
  }

  // If rule ONLY has "IS NULL" (not OR), then SQL must have IS NULL
  if (ruleCondition === "IS NULL") {
    return sqlCondition.includes("IS NULL");
  }

  // If rule has "OR IS NULL" or "IS EMPTY", check both possibilities
  if (
    ruleCondition.includes("OR IS NULL") ||
    ruleCondition.includes("IS EMPTY")
  ) {
    // Check if SQL has IS NULL alone
    if (
      sqlCondition.includes("IS NULL") &&
      !sqlCondition.match(/([><=!]+)\s*(\d+)/)
    ) {
      return true;
    }

    // Check for range part
    const rangeMatch = ruleCondition.match(/\(([^)]+)\)/);
    if (rangeMatch) {
      const rangeCondition = rangeMatch[1];
      return matchesRule(sqlCondition, rangeCondition);
    }

    // Fallback: check for any comparison operators
    return (
      sqlCondition.includes("=") ||
      sqlCondition.includes("!=") ||
      sqlCondition.includes(">") ||
      sqlCondition.includes("<")
    );
  }

  // For range conditions, check for exact boundary match
  if (
    ruleCondition.includes(">=") ||
    ruleCondition.includes("<=") ||
    ruleCondition.includes("<") ||
    ruleCondition.includes(">")
  ) {
    const ruleBoundaries = (ruleCondition.match(/([><=!]+)\s*(\d+)/g) ||
      []) as string[];
    const sqlBoundaries = (sqlCondition.match(/([><=!]+)\s*(\d+)/g) ||
      []) as string[];

    if (ruleBoundaries.length > 0 && sqlBoundaries.length > 0) {
      return ruleBoundaries.every((ruleBound: string) => {
        return sqlBoundaries.some((sqlBound: string) => {
          const ruleNorm = ruleBound.replace(/\s+/g, "");
          const sqlNorm = sqlBound.replace(/\s+/g, "");
          return ruleNorm === sqlNorm;
        });
      });
    }

    return (
      sqlCondition.includes(">=") ||
      sqlCondition.includes("<=") ||
      sqlCondition.includes("BETWEEN")
    );
  }

  // Simple equality check
  const normalizedRule = ruleCondition.replace(/\s+/g, " ").trim();
  return sqlCondition.includes(normalizedRule.split(" ")[0]);
};

// Generate alignment report
export const generateAlignmentReport = (
  sql: string,
  businessRules: Record<string, Record<string, string>>,
): AlignmentReport => {
  const conditions = parseWhereConditions(sql);
  const report: AlignmentReport = {
    totalConditions: conditions.length,
    matched: [],
    misaligned: [],
    undefined: [],
    allConditions: conditions,
    alignmentPercentage: 0,
  };

  // Track which rule columns have been matched
  const matchedRuleColumns = new Set<string>();

  conditions.forEach((condition) => {
    const { matched, issues } = checkConditionAlignment(
      condition,
      businessRules,
    );
    if (matched.length > 0) {
      report.matched.push(...matched);
      // Track which rule columns were matched
      matched.forEach((m) => {
        matchedRuleColumns.add(m.column.toUpperCase());
      });
    }
    if (issues.length > 0) {
      report.misaligned.push({ condition, issues });
    }
  });

  // Check for rules defined in businessRules but not matched
  Object.entries(businessRules).forEach(([table, columns]) => {
    Object.entries(columns).forEach(([column, condition]) => {
      const columnUpper = column.toUpperCase();
      // If this rule column wasn't matched, it means the SQL doesn't have it
      if (!matchedRuleColumns.has(columnUpper)) {
        // Check if the column appears anywhere in the SQL
        const columnInSQL = sql.toUpperCase().includes(columnUpper);

        if (!columnInSQL) {
          // Map table name for ucg_tag and blacklist_tag
          let displayTable = table;
          if (
            (columnUpper === "UCG_TAG" || columnUpper === "BLACKLIST_TAG") &&
            table !== "UNIVERSAL_EXCLUSION_LIST"
          ) {
            displayTable = "UNIVERSAL_EXCLUSION_LIST";
          }

          report.misaligned.push({
            condition: `${displayTable}.${column}`,
            issues: [
              `Business rule for ${displayTable}.${column} (${condition}) not found in SQL query`,
            ],
          });
        }
      }
    });
  });

  // Update total conditions to include missing rules
  report.totalConditions = report.matched.length + report.misaligned.length;

  report.alignmentPercentage =
    report.totalConditions > 0
      ? Math.round((report.matched.length / report.totalConditions) * 100)
      : 0;

  return report;
};
