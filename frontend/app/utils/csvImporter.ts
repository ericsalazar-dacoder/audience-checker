/**
 * Parse CSV/TSV data from pasted content
 */
export interface AudienceImportData {
  audienceName: string;
  description: string;
  sqlQuery: string;
  segmentType: string;
  eventId: string;
  condition: string;
}

/**
 * Check if first line looks like a header row
 */
function isHeaderRow(line: string): boolean {
  const lowerLine = line.toLowerCase();
  const headerKeywords = [
    "audience name",
    "audience_name",
    "description",
    "desription",
    "sql_query",
    "segment_type",
    "condition",
  ];
  // If the line contains at least 2 header-like keywords, it's probably a header
  const matchCount = headerKeywords.filter((kw) =>
    lowerLine.includes(kw)
  ).length;
  return matchCount >= 2;
}

/**
 * Check if a line looks like the start of a new data row
 * A new row should start with a name pattern (Aud_*, letters/numbers/underscores)
 * and have multiple tab-separated columns
 */
function isNewDataRow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Check if it starts with a typical audience name pattern
  // and has at least a few tab characters (indicating multiple columns)
  const tabCount = (line.match(/\t/g) || []).length;
  const startsWithName = /^[A-Za-z][A-Za-z0-9_-]*\t/.test(trimmed);

  return startsWithName && tabCount >= 3;
}

/**
 * Parse TSV/CSV handling multi-line cells properly
 * Rows are identified by looking for patterns that indicate a new record
 */
function parseRows(text: string): string[][] {
  const lines = text.split("\n");
  const rows: string[][] = [];
  let currentRowColumns: string[] | null = null;

  for (const line of lines) {
    if (isNewDataRow(line) || isHeaderRow(line)) {
      // Start of a new row
      if (currentRowColumns !== null) {
        rows.push(currentRowColumns);
      }
      currentRowColumns = line.split("\t").map((col) => col.trim());
    } else if (currentRowColumns !== null && line.trim()) {
      // Continuation of previous row (multi-line cell content)
      // Append to the last column
      const lastIdx = currentRowColumns.length - 1;
      if (lastIdx >= 0) {
        currentRowColumns[lastIdx] += " " + line.trim();
      }
    }
  }

  // Don't forget the last row
  if (currentRowColumns !== null) {
    rows.push(currentRowColumns);
  }

  return rows;
}

export function parseCSVData(csvText: string): AudienceImportData[] {
  const rows = parseRows(csvText.trim());

  if (rows.length < 1) {
    throw new Error("No data found in CSV");
  }

  // Detect if first row is a header
  const firstRowText = rows[0].join("\t");
  const hasHeader = isHeaderRow(firstRowText);
  const startIndex = hasHeader ? 1 : 0;

  // If we have a header, try to parse column positions from it
  let audienceNameIdx = 0;
  let descriptionIdx = 1;
  let sqlQueryIdx = 2;
  let segmentTypeIdx = 3;
  let eventIdIdx = 4;
  let conditionIdx = 5;

  if (hasHeader) {
    const header = rows[0];
    for (let i = 0; i < header.length; i++) {
      const col = header[i].toLowerCase();
      if (col.includes("audience")) audienceNameIdx = i;
      else if (col.includes("desription") || col.includes("description"))
        descriptionIdx = i;
      else if (col.includes("sql_query") || col.includes("query"))
        sqlQueryIdx = i;
      else if (col.includes("segment_type") || col.includes("type"))
        segmentTypeIdx = i;
      else if (col.includes("event_id") || col.includes("event"))
        eventIdIdx = i;
      else if (col.includes("condition")) conditionIdx = i;
    }
  }

  // Parse data rows
  const results: AudienceImportData[] = [];

  for (let i = startIndex; i < rows.length; i++) {
    const columns = rows[i];

    const audienceName = (columns[audienceNameIdx] ?? "").trim();
    if (!audienceName) continue; // Skip rows without audience name

    const sqlQuery = (columns[sqlQueryIdx] ?? "").trim();
    const condition = (columns[conditionIdx] ?? "").trim();

    results.push({
      audienceName,
      description: (columns[descriptionIdx] ?? "").trim(),
      sqlQuery,
      segmentType: (columns[segmentTypeIdx] ?? "").trim(),
      eventId: (columns[eventIdIdx] ?? "").trim(),
      condition,
    });
  }

  if (results.length === 0) {
    throw new Error("No valid data rows found in CSV");
  }

  return results;
}

/**
 * Convert import data to checker data
 * If condition has value, use it and clear sqlQuery
 * Otherwise use sqlQuery
 */
export function convertToCheckerData(data: AudienceImportData) {
  return {
    name: data.audienceName,
    description: data.description,
    query: data.condition ? "" : data.sqlQuery,
    conditionInput: data.condition || "",
    inputMode: data.condition ? "condition" : "query",
    businessRules: [],
  };
}
