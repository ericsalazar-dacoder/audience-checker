/**
 * Format SQL query with proper indentation and line breaks (Prettier-style)
 */
export function formatSQL(sql: string): string {
  if (!sql.trim()) return sql;

  const indent = "  ";
  let indentLevel = 0;

  // Normalize whitespace
  let normalized = sql.replace(/\s+/g, " ").trim();

  // List of keywords that should start on a new line
  const newlineKeywords = [
    "SELECT",
    "FROM",
    "WHERE",
    "AND",
    "OR",
    "JOIN",
    "LEFT JOIN",
    "RIGHT JOIN",
    "INNER JOIN",
    "OUTER JOIN",
    "CROSS JOIN",
    "GROUP BY",
    "HAVING",
    "ORDER BY",
    "LIMIT",
    "OFFSET",
    "UNION",
    "UNION ALL",
    "EXCEPT",
    "INTERSECT",
    "ON",
  ];

  // Split by keywords and reconstruct with newlines
  let result = normalized;

  for (const keyword of newlineKeywords.sort((a, b) => b.length - a.length)) {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    result = result.replace(regex, `\n${keyword}`);
  }

  // Handle parentheses
  result = result.replace(/\s*\(\s*/g, " (\n").replace(/\s*\)\s*/g, "\n)");

  // Split into lines and apply indentation
  const lines = result
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const formattedLines: string[] = [];
  let currentIndentLevel = 0;

  for (const line of lines) {
    // Decrease indent for closing parenthesis
    if (line.startsWith(")")) {
      currentIndentLevel = Math.max(0, currentIndentLevel - 1);
    }

    formattedLines.push(indent.repeat(currentIndentLevel) + line);

    // Increase indent after opening parenthesis
    if (line.endsWith("(")) {
      currentIndentLevel++;
    }

    // Increase indent after main keywords (except AND/OR in WHERE)
    if (
      /^(SELECT|FROM|WHERE|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|OUTER JOIN|CROSS JOIN|GROUP BY|HAVING|ORDER BY)\b/i.test(
        line
      )
    ) {
      if (!line.endsWith("(")) {
        currentIndentLevel++;
      }
    }

    // Decrease indent after WHERE, JOIN conditions
    if (
      /^(WHERE|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|OUTER JOIN|CROSS JOIN|ON)\b/i.test(
        line
      ) &&
      currentIndentLevel > 0
    ) {
      // Keep as is for now
    }
  }

  return formattedLines.join("\n").trim();
}

/**
 * Format WHERE conditions with proper indentation and line breaks (Prettier-style)
 */
export function formatCondition(condition: string): string {
  if (!condition.trim()) return condition;

  const indent = "  ";
  let indentLevel = 0;

  // Normalize whitespace
  let normalized = condition.replace(/\s+/g, " ").trim();

  // Add newlines before AND/OR at the beginning (for new clauses)
  let result = normalized
    .replace(/\s+(AND|OR)\s+/gi, "\n$1 ")
    // Handle parentheses
    .replace(/\s*\(\s*/g, " (\n")
    .replace(/\s*\)\s*/g, "\n)");

  // Split into lines and apply indentation
  const lines = result
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const formattedLines: string[] = [];
  let currentIndentLevel = 0;

  for (const line of lines) {
    // Decrease indent for closing parenthesis
    if (line.startsWith(")")) {
      currentIndentLevel = Math.max(0, currentIndentLevel - 1);
    }

    formattedLines.push(indent.repeat(currentIndentLevel) + line);

    // Increase indent after opening parenthesis
    if (line.endsWith("(")) {
      currentIndentLevel++;
    }
  }

  return formattedLines.join("\n").trim();
}
