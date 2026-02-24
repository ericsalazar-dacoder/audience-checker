"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy,
  Wand2,
  Trash2,
  Plus,
  ArrowRight,
  FileJson,
  GitBranch,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ParsedRule {
  table: string;
  column: string;
  operator: string;
  value: string;
  raw: string;
  hasOrConditions: boolean;
  orConditions: Array<{ operator: string; value: string }>;
}

type JoinType = "AND" | "OR";

export default function QueryGeneratorPage() {
  const { toast } = useToast();
  const [inputText, setInputText] = useState("");
  const [parsedRules, setParsedRules] = useState<ParsedRule[]>([]);
  const [generatedQuery, setGeneratedQuery] = useState("");
  const [generatedJson, setGeneratedJson] = useState("");
  const [joinType, setJoinType] = useState<JoinType>("AND");
  const [selectColumns, setSelectColumns] = useState("*");
  const [primaryTable, setPrimaryTable] = useState("car");
  const [idColumn, setIdColumn] = useState("line_id");
  const [idAlias, setIdAlias] = useState("CUSTOMERID");
  const [outputTab, setOutputTab] = useState("query");

  // JSON specific options
  const [audienceName, setAudienceName] = useState("NEW_AUDIENCE");
  const [audienceDescription, setAudienceDescription] = useState("");
  const [tableId, setTableId] = useState("shallow_car_mysql");
  const [tableLabel, setTableLabel] = useState("CAR");
  const [fromLastNDays, setFromLastNDays] = useState("7");
  const [toLastNDays, setToLastNDays] = useState("1");

  // Parse a single condition (handles operators like >=6, IS NULL, values like 'port in')
  const parseCondition = (
    condition: string
  ): { operator: string; value: string } => {
    const trimmed = condition.trim();

    // Handle IS NULL / IS NOT NULL / IS EMPTY
    if (/^IS\s+NULL$/i.test(trimmed)) {
      return { operator: "IS NULL", value: "" };
    }
    if (/^IS\s+NOT\s+NULL$/i.test(trimmed)) {
      return { operator: "IS NOT NULL", value: "" };
    }
    if (/^IS\s+EMPTY$/i.test(trimmed)) {
      return { operator: "IS EMPTY", value: "" };
    }

    // Handle operators with values like >=6, <=10, >5, <3
    const opValueMatch = trimmed.match(/^(>=|<=|!=|<>|>|<|=)\s*(.+)$/);
    if (opValueMatch) {
      return { operator: opValueMatch[1], value: opValueMatch[2].trim() };
    }

    // Handle LIKE with values (must start with LIKE)
    const likeMatch = trimmed.match(/^LIKE\s+(.+)$/i);
    if (likeMatch) {
      return { operator: "LIKE", value: likeMatch[1].trim() };
    }

    // Handle NOT IN with values (must have parentheses)
    const notInMatch = trimmed.match(/^NOT\s+IN\s*\((.+)\)$/i);
    if (notInMatch) {
      return { operator: "NOT IN", value: `(${notInMatch[1].trim()})` };
    }

    // Handle IN with values (must have parentheses)
    const inMatch = trimmed.match(/^IN\s*\((.+)\)$/i);
    if (inMatch) {
      return { operator: "IN", value: `(${inMatch[1].trim()})` };
    }

    // Default: treat as equality value (e.g., "port in", "GHP-PREPAID")
    return { operator: "=", value: trimmed };
  };

  // Parse business rules from pasted text
  const parseBusinessRules = useCallback((text: string): ParsedRule[] => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const rules: ParsedRule[] = [];

    for (const line of lines) {
      // Normalize multiple tabs to single tab
      const normalizedLine = line.replace(/\t+/g, "\t");

      // Handle tab-separated format: table \t column \t condition
      const tabParts = normalizedLine.split("\t").map((p) => p.trim());
      if (tabParts.length >= 3) {
        const [table, column, ...conditionParts] = tabParts;
        const fullCondition = conditionParts.join(" ").trim();

        // Check for OR conditions (e.g., "0 OR IS NULL OR IS EMPTY")
        const hasOr = /\s+OR\s+/i.test(fullCondition);

        if (hasOr) {
          const orParts = fullCondition.split(/\s+OR\s+/i).map((p) => p.trim());
          const orConditions = orParts.map((part) => parseCondition(part));

          rules.push({
            table: table || "",
            column: column || "",
            operator: orConditions[0].operator,
            value: orConditions[0].value,
            raw: line,
            hasOrConditions: true,
            orConditions,
          });
        } else {
          const parsed = parseCondition(fullCondition);
          rules.push({
            table: table || "",
            column: column || "",
            operator: parsed.operator,
            value: parsed.value,
            raw: line,
            hasOrConditions: false,
            orConditions: [],
          });
        }
        continue;
      }

      // Handle dot notation: table.column = value
      const dotMatch = line.match(
        /^(\w+)\.(\w+)\s*(=|!=|<>|>=|<=|>|<|LIKE|IN|NOT IN|IS NULL|IS NOT NULL|BETWEEN)?\s*(.*)$/i
      );
      if (dotMatch) {
        const [, table, column, operator = "=", value = ""] = dotMatch;
        rules.push({
          table,
          column,
          operator: operator.toUpperCase(),
          value: value.trim(),
          raw: line,
          hasOrConditions: false,
          orConditions: [],
        });
        continue;
      }

      // Handle simple column = value (assume no table)
      const simpleMatch = line.match(
        /^(\w+)\s*(=|!=|<>|>=|<=|>|<|LIKE|IN|NOT IN|IS NULL|IS NOT NULL|BETWEEN)\s*(.*)$/i
      );
      if (simpleMatch) {
        const [, column, operator, value] = simpleMatch;
        rules.push({
          table: "",
          column,
          operator: operator.toUpperCase(),
          value: value.trim(),
          raw: line,
          hasOrConditions: false,
          orConditions: [],
        });
      }
    }

    return rules;
  }, []);

  // Build a single condition SQL
  const buildConditionSQL = (
    column: string,
    operator: string,
    value: string
  ): string => {
    if (operator === "IS NULL") {
      return `${column} IS NULL`;
    }
    if (operator === "IS NOT NULL") {
      return `${column} IS NOT NULL`;
    }
    if (operator === "IS EMPTY") {
      return `COALESCE(${column},'') = ''`;
    }
    if (operator === "IN" || operator === "NOT IN") {
      const val = value.startsWith("(") ? value : `(${value})`;
      return `${column} ${operator} ${val}`;
    }
    if (operator === "LIKE") {
      const val = value.startsWith("'") ? value : `'${value}'`;
      return `${column} ${operator} ${val}`;
    }

    // Quote string values, leave numbers unquoted
    let quotedValue = value;
    if (
      value &&
      !value.match(/^-?\d+\.?\d*$/) &&
      !value.startsWith("'") &&
      !value.startsWith("(")
    ) {
      quotedValue = `'${value}'`;
    }

    return `${column}${operator}${quotedValue}`;
  };

  // Handle paste/input change
  const handleInputChange = (text: string) => {
    setInputText(text);
    const rules = parseBusinessRules(text);
    setParsedRules(rules);
  };

  // Generate SQL query from parsed rules
  const generateQuery = useCallback(() => {
    if (parsedRules.length === 0) {
      toast({
        title: "No rules to convert",
        description: "Please paste some business rules first.",
        variant: "destructive",
      });
      return;
    }

    // Get unique tables (lowercase for consistency)
    const tables = [
      ...new Set(parsedRules.map((r) => r.table.toLowerCase()).filter(Boolean)),
    ];
    const mainTable = primaryTable.toLowerCase() || tables[0] || "your_table";

    // Build SELECT clause
    const selectClause = `${mainTable}.${idColumn} AS ${idAlias}`;

    // Build FROM clause
    const fromClause = `um_objects.${mainTable}`;

    // Build WHERE conditions
    const conditions = parsedRules.map((rule) => {
      const tablePrefix = rule.table ? `${rule.table.toLowerCase()}.` : "";
      const column = `${tablePrefix}${rule.column}`;

      // Handle OR conditions
      if (rule.hasOrConditions && rule.orConditions.length > 0) {
        const orParts = rule.orConditions.map((cond) =>
          buildConditionSQL(column, cond.operator, cond.value)
        );
        return `( ${orParts.join(" OR ")} )`;
      }

      return buildConditionSQL(column, rule.operator, rule.value);
    });

    const whereClause = conditions.join(`\n  ${joinType} `);

    const query = `SELECT ${selectClause}
FROM ${fromClause}
WHERE ${whereClause}`;

    setGeneratedQuery(query);

    toast({
      title: "Query generated",
      description: `Generated query with ${parsedRules.length} condition(s).`,
      variant: "success",
    });
  }, [
    parsedRules,
    joinType,
    primaryTable,
    idColumn,
    idAlias,
    toast,
    buildConditionSQL,
  ]);

  // Copy query to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedQuery);
      toast({
        title: "Copied!",
        description: "Query copied to clipboard.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  // Copy JSON to clipboard
  const copyJsonToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedJson);
      toast({
        title: "Copied!",
        description: "JSON copied to clipboard.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  // Map our operators to query builder operators
  const mapOperatorToQB = (operator: string): string => {
    const mapping: Record<string, string> = {
      "=": "equal",
      "!=": "not_equal",
      "<>": "not_equal",
      ">": "greater",
      "<": "less",
      ">=": "greater_or_equal",
      "<=": "less_or_equal",
      LIKE: "contains",
      IN: "in",
      "NOT IN": "not_in",
      "IS NULL": "is_null",
      "IS NOT NULL": "is_not_null",
      "IS EMPTY": "is_empty",
    };
    return mapping[operator] || "equal";
  };

  // Infer data type from value
  const inferDataType = (value: string, operator: string): string => {
    if (
      operator === "IS NULL" ||
      operator === "IS NOT NULL" ||
      operator === "IS EMPTY"
    ) {
      return "string";
    }
    if (!value) return "string";

    // Check if integer
    if (/^-?\d+$/.test(value)) return "integer";
    // Check if double/float
    if (/^-?\d+\.\d+$/.test(value)) return "double";
    // Default to string
    return "string";
  };

  // Build a single JSON rule for query builder
  const buildJsonRule = (rule: ParsedRule): object => {
    const tablePrefix = rule.table ? `${rule.table.toLowerCase()}.` : "";
    const fieldId = `${tablePrefix}${rule.column}`;

    if (rule.hasOrConditions && rule.orConditions.length > 0) {
      return {
        condition: "OR",
        rules: rule.orConditions.map((cond) => ({
          id: fieldId,
          field: fieldId,
          type: inferDataType(cond.value, cond.operator),
          input: "text",
          operator: mapOperatorToQB(cond.operator),
          value:
            cond.operator === "IS NULL" ||
            cond.operator === "IS NOT NULL" ||
            cond.operator === "IS EMPTY"
              ? null
              : cond.value,
        })),
      };
    }

    return {
      id: fieldId,
      field: fieldId,
      type: inferDataType(rule.value, rule.operator),
      input: "text",
      operator: mapOperatorToQB(rule.operator),
      value:
        rule.operator === "IS NULL" ||
        rule.operator === "IS NOT NULL" ||
        rule.operator === "IS EMPTY"
          ? null
          : rule.value,
    };
  };

  // Generate Audience JSON from parsed rules
  const generateAudienceJson = useCallback(() => {
    if (parsedRules.length === 0) {
      toast({
        title: "No rules to convert",
        description: "Please paste some business rules first.",
        variant: "destructive",
      });
      return;
    }

    // Build the condition SQL string
    const conditions = parsedRules.map((rule) => {
      const tablePrefix = rule.table ? `${rule.table.toLowerCase()}.` : "";
      const column = `${tablePrefix}${rule.column}`;

      if (rule.hasOrConditions && rule.orConditions.length > 0) {
        const orParts = rule.orConditions.map((cond) =>
          buildConditionSQL(column, cond.operator, cond.value)
        );
        return `( ${orParts.join(" OR ")} )`;
      }

      return buildConditionSQL(column, rule.operator, rule.value);
    });

    const conditionString = conditions.join(` ${joinType} `);

    // Build jsonRule structure
    const jsonRuleObj = {
      condition: joinType,
      rules: parsedRules.map((rule) => buildJsonRule(rule)),
    };

    // Build the full audience JSON
    const audienceJson = {
      id: null,
      active: "N",
      name: audienceName,
      description: audienceDescription || audienceName,
      segmentType: "QUERY",
      viewType: "POPULATION",
      rules: [
        {
          index: 0,
          id: null,
          condition: conditionString,
          havingClause: null,
          query: null,
          setName: "A",
          label: "A",
          tableId: tableId,
          thenClause: null,
          segmentId: null,
          fromLastNDays: parseInt(fromLastNDays) || 7,
          toLastNDays: parseInt(toLastNDays) || 1,
          tableLabel: tableLabel,
          qb: {
            where: "#querybuilder-builder-newTargetId-0-WHERE",
            having: "#querybuilder-builder-newTargetId-0-HAVING",
          },
          jsonRule: JSON.stringify(jsonRuleObj),
          count: null,
          cltv: null,
        },
      ],
    };

    setGeneratedJson(JSON.stringify(audienceJson, null, 2));

    toast({
      title: "JSON generated",
      description: `Generated audience JSON with ${parsedRules.length} condition(s).`,
      variant: "success",
    });
  }, [
    parsedRules,
    joinType,
    audienceName,
    tableId,
    tableLabel,
    fromLastNDays,
    toLastNDays,
    toast,
    buildConditionSQL,
  ]);

  // Clear all
  const handleClear = () => {
    setInputText("");
    setParsedRules([]);
    setGeneratedQuery("");
    setGeneratedJson("");
  };

  // Update a parsed rule
  const updateRule = (
    index: number,
    field: keyof ParsedRule,
    value: string
  ) => {
    setParsedRules((prev) =>
      prev.map((rule, i) => (i === index ? { ...rule, [field]: value } : rule))
    );
  };

  // Remove a rule
  const removeRule = (index: number) => {
    setParsedRules((prev) => prev.filter((_, i) => i !== index));
  };

  // Add empty rule
  const addRule = () => {
    setParsedRules((prev) => [
      ...prev,
      {
        table: "",
        column: "",
        operator: "=",
        value: "",
        raw: "",
        hasOrConditions: false,
        orConditions: [],
      },
    ]);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Audience Generator</h1>
        <p className="text-muted-foreground">
          Convert business rules into SQL queries and audience JSON. Paste your
          rules and generate the corresponding output.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1">
        {/* Input Section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Business Rules</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Paste business rules (tab-separated or table.column = value
                format)
              </label>
              <Textarea
                placeholder={`Examples:
table_name\tcolumn_name\t= 'value'
user.status = 'active'
order.amount >= 100
product.category IN ('A', 'B', 'C')`}
                value={inputText}
                onChange={(e) => handleInputChange(e.target.value)}
                className="min-h-[150px] font-mono text-sm"
              />
            </div>

            {parsedRules.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Parsed Rules ({parsedRules.length})
                  </label>
                  <Button variant="outline" size="sm" onClick={addRule}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Rule
                  </Button>
                </div>
                {/* Column Labels */}
                <div className="flex items-center gap-2 px-2 text-xs font-medium text-muted-foreground">
                  <span className="w-24">Table</span>
                  <span className="w-3"></span>
                  <span className="w-28">Column</span>
                  <span className="w-24">Operator</span>
                  <span className="flex-1">Value</span>
                  <span className="w-6"></span>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {parsedRules.map((rule, index) => (
                    <div
                      key={`${index}-${rule.raw}`}
                      className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                    >
                      <Input
                        placeholder="table"
                        value={rule.table}
                        onChange={(e) =>
                          updateRule(index, "table", e.target.value)
                        }
                        className="w-24 h-8 text-xs"
                      />
                      <span className="text-muted-foreground">.</span>
                      <Input
                        placeholder="column"
                        value={rule.column}
                        onChange={(e) =>
                          updateRule(index, "column", e.target.value)
                        }
                        className="w-28 h-8 text-xs"
                      />
                      <Select
                        value={rule.operator}
                        onValueChange={(v) => updateRule(index, "operator", v)}
                      >
                        <SelectTrigger className="w-24 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="=">=</SelectItem>
                          <SelectItem value="!=">!=</SelectItem>
                          <SelectItem value=">">{">"}</SelectItem>
                          <SelectItem value="<">{"<"}</SelectItem>
                          <SelectItem value=">=">{">="}</SelectItem>
                          <SelectItem value="<=">{"<="}</SelectItem>
                          <SelectItem value="LIKE">LIKE</SelectItem>
                          <SelectItem value="IN">IN</SelectItem>
                          <SelectItem value="NOT IN">NOT IN</SelectItem>
                          <SelectItem value="IS NULL">IS NULL</SelectItem>
                          <SelectItem value="IS NOT NULL">
                            IS NOT NULL
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <input
                        type="text"
                        placeholder="value"
                        value={rule.value || ""}
                        onChange={(e) =>
                          updateRule(index, "value", e.target.value)
                        }
                        className="flex-1 h-8 text-xs px-3 py-1 rounded-md border border-input bg-background"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeRule(index)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Generated Output</CardTitle>
              {outputTab === "query" && generatedQuery && (
                <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              )}
              {outputTab === "json" && generatedJson && (
                <Button variant="ghost" size="sm" onClick={copyJsonToClipboard}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={outputTab} onValueChange={setOutputTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="query" className="gap-2">
                  <Wand2 className="h-4 w-4" />
                  SQL Query
                </TabsTrigger>
                <TabsTrigger value="json" className="gap-2">
                  <FileJson className="h-4 w-4" />
                  Audience JSON
                </TabsTrigger>
                <TabsTrigger value="visual" className="gap-2">
                  <GitBranch className="h-4 w-4" />
                  Visualization
                </TabsTrigger>
              </TabsList>

              {/* SQL Query Tab */}
              <TabsContent value="query" className="space-y-4 mt-4">
                {/* Query Options */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Primary Table
                    </label>
                    <Input
                      value={primaryTable}
                      onChange={(e) => setPrimaryTable(e.target.value)}
                      placeholder="car"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      ID Column
                    </label>
                    <Input
                      value={idColumn}
                      onChange={(e) => setIdColumn(e.target.value)}
                      placeholder="line_id"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      ID Alias
                    </label>
                    <Input
                      value={idAlias}
                      onChange={(e) => setIdAlias(e.target.value)}
                      placeholder="CUSTOMERID"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Join with
                    </label>
                    <Select
                      value={joinType}
                      onValueChange={(v) => setJoinType(v as JoinType)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">AND</SelectItem>
                        <SelectItem value="OR">OR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  className="w-full gap-2"
                  onClick={generateQuery}
                  disabled={parsedRules.length === 0}
                >
                  <Wand2 className="h-4 w-4" />
                  Generate Query
                  <ArrowRight className="h-4 w-4" />
                </Button>

                {/* Generated Query Output */}
                {generatedQuery ? (
                  <div className="relative">
                    <Textarea
                      value={generatedQuery}
                      onChange={(e) => setGeneratedQuery(e.target.value)}
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </div>
                ) : (
                  <div className="min-h-[200px] flex items-center justify-center border rounded-lg bg-muted/30">
                    <p className="text-muted-foreground text-sm">
                      Generated SQL query will appear here
                    </p>
                  </div>
                )}

                {/* Stats */}
                {generatedQuery && (
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {parsedRules.length} condition(s)
                    </Badge>
                    <Badge variant="secondary">
                      {
                        [
                          ...new Set(
                            parsedRules.map((r) => r.table).filter(Boolean)
                          ),
                        ].length
                      }{" "}
                      table(s)
                    </Badge>
                  </div>
                )}
              </TabsContent>

              {/* Audience JSON Tab */}
              <TabsContent value="json" className="space-y-4 mt-4">
                {/* JSON Options */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Audience Name
                    </label>
                    <Input
                      value={audienceName}
                      onChange={(e) => setAudienceName(e.target.value)}
                      placeholder="NEW_AUDIENCE"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Description
                    </label>
                    <Input
                      value={audienceDescription}
                      onChange={(e) => setAudienceDescription(e.target.value)}
                      placeholder="Audience description (optional)"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Table ID
                    </label>
                    <Input
                      value={tableId}
                      onChange={(e) => setTableId(e.target.value)}
                      placeholder="shallow_car_mysql"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Table Label
                    </label>
                    <Input
                      value={tableLabel}
                      onChange={(e) => setTableLabel(e.target.value)}
                      placeholder="CAR"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      From Last N Days
                    </label>
                    <Input
                      value={fromLastNDays}
                      onChange={(e) => setFromLastNDays(e.target.value)}
                      placeholder="7"
                      className="h-8 text-sm"
                      type="number"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      To Last N Days
                    </label>
                    <Input
                      value={toLastNDays}
                      onChange={(e) => setToLastNDays(e.target.value)}
                      placeholder="1"
                      className="h-8 text-sm"
                      type="number"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Join with
                    </label>
                    <Select
                      value={joinType}
                      onValueChange={(v) => setJoinType(v as JoinType)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">AND</SelectItem>
                        <SelectItem value="OR">OR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  className="w-full gap-2"
                  onClick={generateAudienceJson}
                  disabled={parsedRules.length === 0}
                >
                  <FileJson className="h-4 w-4" />
                  Generate Audience JSON
                  <ArrowRight className="h-4 w-4" />
                </Button>

                {/* Generated JSON Output */}
                {generatedJson ? (
                  <div className="relative">
                    <Textarea
                      value={generatedJson}
                      onChange={(e) => setGeneratedJson(e.target.value)}
                      className="min-h-[300px] font-mono text-sm"
                    />
                  </div>
                ) : (
                  <div className="min-h-[200px] flex items-center justify-center border rounded-lg bg-muted/30">
                    <p className="text-muted-foreground text-sm">
                      Generated audience JSON will appear here
                    </p>
                  </div>
                )}

                {/* Stats */}
                {generatedJson && (
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {parsedRules.length} condition(s)
                    </Badge>
                    <Badge variant="secondary">
                      {
                        [
                          ...new Set(
                            parsedRules.map((r) => r.table).filter(Boolean)
                          ),
                        ].length
                      }{" "}
                      table(s)
                    </Badge>
                  </div>
                )}
              </TabsContent>

              {/* Visualization Tab */}
              <TabsContent value="visual" className="space-y-4 mt-4">
                {parsedRules.length > 0 ? (
                  <div className="space-y-4">
                    {/* Query Structure Header */}
                    <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <Badge
                        variant="outline"
                        className="bg-blue-500/20 text-blue-600 border-blue-500/30"
                      >
                        SELECT
                      </Badge>
                      <span className="font-mono text-sm">
                        {primaryTable}.{idColumn} AS {idAlias}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <Badge
                        variant="outline"
                        className="bg-green-500/20 text-green-600 border-green-500/30"
                      >
                        FROM
                      </Badge>
                      <span className="font-mono text-sm">
                        um_objects.{primaryTable}
                      </span>
                    </div>

                    {/* WHERE Conditions Tree */}
                    <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge
                          variant="outline"
                          className="bg-orange-500/20 text-orange-600 border-orange-500/30"
                        >
                          WHERE
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {parsedRules.length} conditions joined by {joinType}
                        </Badge>
                      </div>

                      <div className="space-y-2 ml-4">
                        {parsedRules.map((rule, index) => (
                          <div key={index} className="relative">
                            {/* Connector line */}
                            {index > 0 && (
                              <div className="absolute -top-3 left-4 flex items-center gap-2">
                                <div className="w-px h-3 bg-muted-foreground/30"></div>
                                <Badge
                                  variant="outline"
                                  className="text-xs h-5 px-2 bg-muted"
                                >
                                  {joinType}
                                </Badge>
                              </div>
                            )}

                            <div
                              className={`flex items-start gap-2 p-2 rounded-lg border ${
                                rule.hasOrConditions
                                  ? "bg-purple-500/5 border-purple-500/20"
                                  : "bg-muted/50 border-muted"
                              } ${index > 0 ? "mt-4" : ""}`}
                            >
                              {/* Tree branch indicator */}
                              <div className="flex items-center gap-1 mt-1">
                                <div className="w-3 h-px bg-muted-foreground/30"></div>
                                <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
                              </div>

                              <div className="flex-1">
                                {rule.hasOrConditions ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/20"
                                      >
                                        OR Group
                                      </Badge>
                                    </div>
                                    <div className="ml-4 space-y-1 border-l-2 border-purple-500/20 pl-3">
                                      {rule.orConditions.map(
                                        (cond, condIndex) => (
                                          <div
                                            key={condIndex}
                                            className="flex items-center gap-2 text-sm"
                                          >
                                            {condIndex > 0 && (
                                              <Badge
                                                variant="outline"
                                                className="text-xs h-4 px-1"
                                              >
                                                OR
                                              </Badge>
                                            )}
                                            <code className="px-2 py-0.5 rounded bg-muted font-mono text-xs">
                                              {rule.table}.{rule.column}
                                            </code>
                                            <Badge
                                              variant="secondary"
                                              className="text-xs h-5"
                                            >
                                              {cond.operator}
                                            </Badge>
                                            {cond.value && (
                                              <span className="text-muted-foreground font-mono text-xs">
                                                {cond.value}
                                              </span>
                                            )}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <code className="px-2 py-0.5 rounded bg-muted font-mono text-xs">
                                      {rule.table
                                        ? `${rule.table}.${rule.column}`
                                        : rule.column}
                                    </code>
                                    <Badge
                                      variant="secondary"
                                      className="text-xs h-5"
                                    >
                                      {rule.operator}
                                    </Badge>
                                    {rule.value && (
                                      <span className="text-muted-foreground font-mono text-xs">
                                        {rule.value}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="flex gap-2 pt-2">
                      <Badge variant="secondary">
                        {parsedRules.length} condition(s)
                      </Badge>
                      <Badge variant="secondary">
                        {
                          [
                            ...new Set(
                              parsedRules.map((r) => r.table).filter(Boolean)
                            ),
                          ].length
                        }{" "}
                        table(s)
                      </Badge>
                      <Badge variant="secondary">
                        {parsedRules.filter((r) => r.hasOrConditions).length} OR
                        group(s)
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="min-h-[300px] flex items-center justify-center border rounded-lg bg-muted/30">
                    <div className="text-center">
                      <GitBranch className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-muted-foreground text-sm">
                        Paste business rules to see the query visualization
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
