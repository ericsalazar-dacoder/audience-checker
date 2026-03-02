"use client";

import React, { useState } from "react";
import type { Checker, AlignmentReport } from "@core/types";
import { generateAlignmentReport } from "@utils/queryAnalyzer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";

interface CheckerSummary {
  id: number;
  name: string;
  report: AlignmentReport | null;
  error?: string;
}

interface BulkCheckSummary {
  total: number;
  checked: number;
  healthy: number; // >= 80% alignment
  warning: number; // < 80% alignment
  failed: number; // errors or no data
  averageAlignment: number;
  checkers: CheckerSummary[];
}

interface BulkCheckDialogProps {
  checkers: Checker[];
  onReportsUpdate: (reports: Map<number, AlignmentReport>) => void;
}

export const BulkCheckDialog: React.FC<BulkCheckDialogProps> = ({
  checkers,
  onReportsUpdate,
}) => {
  const [open, setOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [summary, setSummary] = useState<BulkCheckSummary | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleExpanded = (id: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSaveAllResults = () => {
    if (!summary) return;

    // Convert results to CSV format
    const headers = [
      "Checker Name",
      "Status",
      "Alignment %",
      "Matched",
      "Issues",
      "Total Conditions",
    ];
    const rows = summary.checkers.map((item) => [
      item.name,
      item.error ? "Error" : item.report ? "Checked" : "Skipped",
      item.report?.alignmentPercentage?.toString() || "N/A",
      item.report?.matched.length?.toString() || "0",
      item.report?.misaligned.length?.toString() || "0",
      item.report?.totalConditions?.toString() || "0",
    ]);

    // Create CSV content
    const csvContent = [
      headers.join("\t"),
      ...rows.map((row) => row.join("\t")),
      "",
      "Summary",
      `Total,${summary.total}`,
      `Healthy,${summary.healthy}`,
      `Warnings,${summary.warning}`,
      `Failed,${summary.failed}`,
      `Average Alignment %,${summary.averageAlignment}`,
    ].join("\n");

    // Create and download file
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(csvContent)
    );
    element.setAttribute("download", `bulk-check-results-${Date.now()}.tsv`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    alert("Results saved successfully!");
  };

  const runBulkCheck = () => {
    setIsChecking(true);
    const reports = new Map<number, AlignmentReport>();
    const checkerSummaries: CheckerSummary[] = [];

    let healthy = 0;
    let warning = 0;
    let failed = 0;
    let totalAlignment = 0;
    let validChecks = 0;

    checkers.forEach((checker) => {
      try {
        // Validate checker has required data
        if (!checker.businessRules || checker.businessRules.length === 0) {
          checkerSummaries.push({
            id: checker.id,
            name: checker.name,
            report: null,
            error: "No business rules defined",
          });
          failed++;
          return;
        }

        const hasValidRules = checker.businessRules.some(
          (rule) => rule.table && rule.column,
        );
        if (!hasValidRules) {
          checkerSummaries.push({
            id: checker.id,
            name: checker.name,
            report: null,
            error: "Business rules are incomplete",
          });
          failed++;
          return;
        }

        // Get the query text
        let queryText = "";
        if (checker.inputMode === "query") {
          if (!checker.query) {
            checkerSummaries.push({
              id: checker.id,
              name: checker.name,
              report: null,
              error: "No SQL query provided",
            });
            failed++;
            return;
          }
          queryText = checker.query;
        } else {
          if (!checker.conditionInput) {
            checkerSummaries.push({
              id: checker.id,
              name: checker.name,
              report: null,
              error: "No conditions provided",
            });
            failed++;
            return;
          }
          queryText = "WHERE " + checker.conditionInput;
        }

        // Build business rules object
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

        // Generate report
        const report = generateAlignmentReport(queryText, businessRulesObj);
        reports.set(checker.id, report);

        checkerSummaries.push({
          id: checker.id,
          name: checker.name,
          report,
        });

        totalAlignment += report.alignmentPercentage;
        validChecks++;

        if (report.alignmentPercentage >= 80) {
          healthy++;
        } else {
          warning++;
        }
      } catch (err) {
        checkerSummaries.push({
          id: checker.id,
          name: checker.name,
          report: null,
          error: (err as Error).message || "Unknown error",
        });
        failed++;
      }
    });

    const newSummary: BulkCheckSummary = {
      total: checkers.length,
      checked: validChecks,
      healthy,
      warning,
      failed,
      averageAlignment:
        validChecks > 0 ? Math.round(totalAlignment / validChecks) : 0,
      checkers: checkerSummaries,
    };

    setSummary(newSummary);
    setIsChecking(false);

    // Update reports in parent
    onReportsUpdate(reports);
  };

  const getStatusColor = (report: AlignmentReport | null, error?: string) => {
    if (error || !report) return "text-red-600 dark:text-red-400";
    if (report.alignmentPercentage >= 80)
      return "text-green-600 dark:text-green-400";
    return "text-amber-600 dark:text-amber-400";
  };

  const getStatusIcon = (report: AlignmentReport | null, error?: string) => {
    if (error || !report)
      return <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
    if (report.alignmentPercentage >= 80)
      return (
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
      );
    return (
      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          Bulk Check All
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Bulk Alignment Check
          </DialogTitle>
          <DialogDescription>
            Check alignment for all {checkers.length} checker
            {checkers.length !== 1 ? "s" : ""} at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!summary && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                This will run alignment checks on all checkers and show a
                summary of results.
              </p>
              <Button
                onClick={runBulkCheck}
                disabled={isChecking || checkers.length === 0}
                className="gap-2"
              >
                <PlayCircle className="h-4 w-4" />
                {isChecking ? "Checking..." : "Run Bulk Check"}
              </Button>
            </div>
          )}

          {summary && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{summary.total}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Healthy</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {summary.healthy}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Warnings</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {summary.warning}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Failed</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {summary.failed}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Average Alignment */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Average Alignment Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Progress
                      value={summary.averageAlignment}
                      className="flex-1 h-3"
                    />
                    <span
                      className={`text-2xl font-bold ${
                        summary.averageAlignment >= 80
                          ? "text-green-600 dark:text-green-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {summary.averageAlignment}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Individual Results */}
              <div>
                <h3 className="text-sm font-semibold mb-3">
                  Individual Results
                </h3>
                <div className="space-y-2">
                  {summary.checkers.map((item) => (
                    <div key={item.id} className="border rounded-lg">
                      <button
                        onClick={() => toggleExpanded(item.id)}
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(item.report, item.error)}
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.report && (
                            <span
                              className={`text-sm font-semibold ${getStatusColor(
                                item.report,
                                item.error,
                              )}`}
                            >
                              {item.report.alignmentPercentage}%
                            </span>
                          )}
                          {item.error && (
                            <span className="text-sm text-red-600 dark:text-red-400">
                              Error
                            </span>
                          )}
                          {expandedItems.has(item.id) ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {expandedItems.has(item.id) && (
                        <div className="px-3 pb-3 border-t">
                          {item.error ? (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                              {item.error}
                            </p>
                          ) : item.report ? (
                            <div className="mt-3 space-y-3">
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">
                                    Matched:
                                  </span>{" "}
                                  <span className="font-medium text-green-600 dark:text-green-400">
                                    {item.report.matched.length}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Issues:
                                  </span>{" "}
                                  <span className="font-medium text-red-600 dark:text-red-400">
                                    {item.report.misaligned.length}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Total:
                                  </span>{" "}
                                  <span className="font-medium">
                                    {item.report.totalConditions}
                                  </span>
                                </div>
                              </div>

                              {item.report.misaligned.length > 0 && (
                                <div className="text-sm">
                                  <p className="text-muted-foreground mb-1">
                                    Issues:
                                  </p>
                                  <ul className="space-y-1 ml-2">
                                    {item.report.misaligned
                                      .slice(0, 3)
                                      .map((issue, idx) => (
                                        <li
                                          key={`${item.id}-issue-${idx}`}
                                          className="text-red-600 dark:text-red-400"
                                        >
                                          • {issue.condition}
                                        </li>
                                      ))}
                                    {item.report.misaligned.length > 3 && (
                                      <li className="text-muted-foreground">
                                        ... and{" "}
                                        {item.report.misaligned.length - 3} more
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSummary(null);
                    setExpandedItems(new Set());
                  }}
                >
                  Reset
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSaveAllResults}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Save All Results
                </Button>
                <Button onClick={() => setOpen(false)}>Close</Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
