"use client";

import React from "react";
import type { Checker, AlignmentReport } from "@core/types";
import { generateAlignmentReport } from "@utils/queryAnalyzer";
import { formatSQL, formatCondition } from "@utils/sqlFormatter";
import { BusinessRulesPanel } from "./BusinessRulesPanel";
import { AlignmentReportPanel } from "./AlignmentReportPanel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, Trash2, Wand2 } from "lucide-react";

interface CheckerCardProps {
  checker: Checker;
  canDelete: boolean;
  onNameChange: (value: string) => void;
  onDelete: () => void;
  onToggleExpanded: () => void;
  onInputModeChange: (mode: "query" | "condition") => void;
  onQueryChange: (value: string) => void;
  onConditionChange: (value: string) => void;
  onRuleUpdate: (
    ruleIndex: number,
    field: "table" | "column" | "condition",
    value: string,
  ) => void;
  onRuleAdd: () => void;
  onRuleRemove: (ruleIndex: number) => void;
  onPasteBulkRules: (pastedText: string) => void;
  onReportUpdate: (report: AlignmentReport) => void;
  onSave?: () => void;
  onCancel?: () => void;
  isSaving?: boolean;
}

export const CheckerCard: React.FC<CheckerCardProps> = ({
  checker,
  canDelete,
  onNameChange,
  onDelete,
  onToggleExpanded,
  onInputModeChange,
  onQueryChange,
  onConditionChange,
  onRuleUpdate,
  onRuleAdd,
  onRuleRemove,
  onPasteBulkRules,
  onReportUpdate,
  onSave,
  onCancel,
  isSaving,
}) => {
  const handleCheckAlignment = () => {
    if (!checker.businessRules || checker.businessRules.length === 0) {
      alert("Please fill in Business Rules");
      return;
    }

    const businessRulesObj: Record<string, Record<string, string>> = {};
    checker.businessRules.forEach((rule) => {
      if (rule.table && rule.column) {
        const tableUpper = rule.table.toUpperCase();
        const columnUpper = rule.column.toUpperCase();
        if (!businessRulesObj[tableUpper]) {
          businessRulesObj[tableUpper] = {};
        }
        businessRulesObj[tableUpper][columnUpper] = rule.condition;
      }
    });

    let reportData: AlignmentReport;

    if (checker.inputMode === "query") {
      if (!checker.query) {
        alert("Please fill in the SQL Query");
        return;
      }
      reportData = generateAlignmentReport(checker.query, businessRulesObj);
    } else {
      if (!checker.conditionInput) {
        alert("Please fill in the Condition/WHERE clause");
        return;
      }
      const whereClause = "WHERE " + checker.conditionInput;
      reportData = generateAlignmentReport(whereClause, businessRulesObj);
    }

    onReportUpdate(reportData);
  };

  return (
    <Card className="mb-4 shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex-1 mr-2">
          <Input
            value={checker.name}
            onChange={(e) => onNameChange(e.target.value)}
            className="text-lg font-semibold border-0 px-10 focus-visible:ring-0"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Show alignment result & percentage when collapsed */}
          {!checker.expanded && checker.report && (
            <div className="flex items-center gap-2 mr-2 text-xs">
              <span className="text-green-600 dark:text-green-400 font-medium">
                {checker.report.matched.length} matched
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-red-600 dark:text-red-400 font-medium">
                {checker.report.misaligned.length} issues
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {checker.report.totalConditions} total
              </span>
              <span
                className={`text-sm font-bold px-2 py-0.5 rounded ${
                  checker.report.alignmentPercentage >= 80
                    ? "text-green-600 dark:text-green-400 bg-green-500/10"
                    : checker.report.alignmentPercentage >= 50
                      ? "text-amber-600 dark:text-amber-400 bg-amber-500/10"
                      : "text-red-600 dark:text-red-400 bg-red-500/10"
                }`}
              >
                {checker.report.alignmentPercentage}%
              </span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleExpanded}
            className="gap-2"
          >
            {checker.expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {checker.expanded ? "Collapse" : "Expand"}
          </Button>
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </CardHeader>

      {checker.expanded && (
        <CardContent className="space-y-4">
          <Tabs
            value={checker.inputMode}
            onValueChange={onInputModeChange}
            defaultValue="query"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="query">SQL Query</TabsTrigger>
              <TabsTrigger value="condition">Condition/WHERE</TabsTrigger>
            </TabsList>

            <TabsContent value="query" className="mt-4">
              <div className="space-y-2">
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onQueryChange(formatSQL(checker.query))}
                    className="gap-2"
                  >
                    <Wand2 className="h-4 w-4" />
                    Format
                  </Button>
                </div>
                <Textarea
                  value={checker.query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  placeholder="Paste your SQL query here..."
                  rows={6}
                  className="font-mono text-sm border"
                />
              </div>
            </TabsContent>

            <TabsContent value="condition" className="mt-4">
              <div className="space-y-2">
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onConditionChange(formatCondition(checker.conditionInput))
                    }
                    className="gap-2"
                  >
                    <Wand2 className="h-4 w-4" />
                    Format
                  </Button>
                </div>
                <Textarea
                  value={checker.conditionInput}
                  onChange={(e) => onConditionChange(e.target.value)}
                  placeholder="Paste your WHERE conditions here (without WHERE keyword)..."
                  rows={6}
                  className="font-mono text-sm border"
                />
              </div>
            </TabsContent>
          </Tabs>

          <BusinessRulesPanel
            checkerId={checker.id}
            businessRules={checker.businessRules}
            onRuleUpdate={onRuleUpdate}
            onRuleAdd={onRuleAdd}
            onRuleRemove={onRuleRemove}
            onPasteBulkRules={onPasteBulkRules}
            onCheckAlignment={handleCheckAlignment}
            onSave={onSave}
            onCancel={onCancel}
            isSaving={isSaving}
          />

          <AlignmentReportPanel report={checker.report} />
        </CardContent>
      )}
    </Card>
  );
};
