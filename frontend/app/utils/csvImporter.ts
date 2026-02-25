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
  const matchCount = headerKeywords.filter((kw) =>
    lowerLine.includes(kw),
  ).length;
  return matchCount >= 2;
}

/**
 * Parse TSV/CSV - simple line-by-line parsing
 * Each line is a row, tab-separated columns
 */
function parseRows(text: string): string[][] {
  // Normalize line endings to just \n
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Split by newline and filter empty lines
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const rows: string[][] = [];

  for (const line of lines) {
    // Split by tab
    const columns = line.split("\t").map((col) => col.trim());

    // Only add rows that have at least one non-empty column
    if (columns.length > 0 && columns.some((col) => col.length > 0)) {
      rows.push(columns);
    }
  }

  console.log(`Parsed ${rows.length} rows from CSV data`);
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

  console.log(`Has header: ${hasHeader}, starting from row ${startIndex}`);
  console.log(
    `Total rows: ${rows.length}, data rows: ${rows.length - startIndex}`,
  );

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
    let condition = (columns[conditionIdx] ?? "").trim();

    // Parse IN condition dynamically: IN ('value1','value2') -> "value1" OR "value2"
    const inMatch = condition.match(/IN\s*\(\s*(.+?)\s*\)/i);
    if (inMatch) {
      const values = inMatch[1]
        .split(",")
        .map((v) => v.trim().replace(/^['"]|['"]$/g, ""))
        .filter((v) => v);
      if (values.length > 0) {
        // Keep it as: "value1" OR "value2" for dynamic matching
        condition = values.map((v) => `"${v}"`).join(" OR ");
      }
    }

    results.push({
      audienceName,
      description: (columns[descriptionIdx] ?? "").trim(),
      sqlQuery,
      segmentType: (columns[segmentTypeIdx] ?? "").trim(),
      eventId: (columns[eventIdIdx] ?? "").trim(),
      condition,
    });
  }

  console.log(`Parsed ${results.length} valid audience records`);

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
