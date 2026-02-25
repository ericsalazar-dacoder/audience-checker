"use client";

import React from "react";
import type { AlignmentReport } from "@core/types";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface AlignmentReportPanelProps {
  report: AlignmentReport | null;
}

export const AlignmentReportPanel: React.FC<AlignmentReportPanelProps> = ({
  report,
}) => {
  if (!report) return null;

  const isHealthy = report.alignmentPercentage >= 80;

  return (
    <Card>
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg">Alignment Report</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 mt-4">
        {/* Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4">
            <p className="text-sm">Total Conditions</p>
            <p className="text-2xl font-semibold">{report.totalConditions}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm">Aligned</p>
            <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {report.matched.length}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm">Issues</p>
            <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
              {report.misaligned.length}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm">Alignment Score</p>
            <p
              className={`text-2xl font-semibold ${
                isHealthy
                  ? "text-green-600 dark:text-green-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {report.alignmentPercentage}%
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between mb-2">
            <p className="text-sm font-medium">Alignment Progress</p>
            <p className="text-sm">{report.alignmentPercentage}%</p>
          </div>
          <Progress value={report.alignmentPercentage} className="h-2" />
        </div>

        {/* Conditions Found */}
        <div>
          <p className="text-sm font-semibold mb-3">
            Conditions Found ({report.allConditions.length})
          </p>
          <div className="space-y-2 rounded-lg p-3 border">
            {report.allConditions.length > 0 ? (
              <ul className="space-y-1">
                {report.allConditions.map((condition, idx) => (
                  <li key={idx} className="text-sm">
                    • {condition}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm">No conditions found</p>
            )}
          </div>
        </div>

        {/* Matched Rules */}
        {report.matched.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-3 flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              Matched Rules ({report.matched.length})
            </p>
            <div className="space-y-2 rounded-lg p-3 border border-green-600 dark:border-green-400 bg-green-50 dark:bg-green-950">
              {report.matched.map((match, idx) => (
                <div key={idx} className="text-sm">
                  <p className="font-medium text-green-700 dark:text-green-300">
                    {match.table}.{match.column}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 ml-2">
                    {match.condition}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Misaligned/Issues */}
        {report.misaligned.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-3 flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              Misaligned/Issues ({report.misaligned.length})
            </p>
            <div className="space-y-3">
              {report.misaligned.map((issue, idx) => (
                <Alert
                  key={`misaligned-${idx}-${issue.condition}`}
                  variant="destructive"
                  className="border-red-700 bg-red-900"
                >
                  <AlertTitle className="flex items-center gap-2">
                    {issue.condition}
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    <ul className="space-y-1 ml-2">
                      {issue.issues.map((problem, i) => (
                        <li
                          key={`${issue.condition}-problem-${i}`}
                          className="text-sm"
                        >
                          • {problem}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
