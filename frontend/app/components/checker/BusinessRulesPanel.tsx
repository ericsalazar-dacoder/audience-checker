"use client";

import React from "react";
import type { BusinessRule } from "@core/types";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Download, Save, Loader2 } from "lucide-react";

interface BusinessRulesPanelProps {
  checkerId: number;
  businessRules: BusinessRule[];
  onRuleUpdate: (
    ruleIndex: number,
    field: "table" | "column" | "condition",
    value: string,
  ) => void;
  onRuleAdd: () => void;
  onRuleRemove: (ruleIndex: number) => void;
  onPasteBulkRules: (pastedText: string) => void;
  onCheckAlignment: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  isSaving?: boolean;
}

export const BusinessRulesPanel: React.FC<BusinessRulesPanelProps> = ({
  checkerId,
  businessRules,
  onRuleUpdate,
  onRuleAdd,
  onRuleRemove,
  onPasteBulkRules,
  onCheckAlignment,
  onSave,
  onCancel,
  isSaving,
}) => {
  const handleExportRules = () => {
    if (businessRules.length === 0) {
      alert("No business rules to save");
      return;
    }

    // Convert rules to CSV format
    const headers = ["Table Name", "Column Name", "Condition"];
    const rows = businessRules.map((rule) => [
      rule.table || "",
      rule.column || "",
      rule.condition || "",
    ]);

    // Create CSV content
    const csvContent = [
      headers.join("\t"),
      ...rows.map((row) => row.join("\t")),
    ].join("\n");

    // Create and download file
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(csvContent),
    );
    element.setAttribute("download", `business-rules-${Date.now()}.tsv`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    alert("Business rules exported successfully!");
  };

  return (
    <Card>
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg">Business Rules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Paste from Excel/Spreadsheet (Tab-separated or Space-separated):
          </label>
          <Textarea
            rows={3}
            placeholder="TABLE_NAME	COLUMN_NAME	CONDITION
BB_POSTPAID	brand_type_code	WIRELINE"
            onPaste={(e) => {
              e.preventDefault();
              const pastedText = e.clipboardData.getData("text");
              onPasteBulkRules(pastedText);
            }}
            className="font-mono text-sm border"
          />
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium">
                    Table Name
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium">
                    Column Name
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium">
                    Condition
                  </th>
                  <th className="px-4 py-2 text-center text-sm font-medium w-20">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {businessRules.map((rule, idx) => (
                  <tr key={idx} className="hover:opacity-80">
                    <td className="px-4 py-2">
                      <Input
                        value={rule.table}
                        onChange={(e) =>
                          onRuleUpdate(idx, "table", e.target.value)
                        }
                        placeholder="e.g., BB_POSTPAID"
                        className="h-8 border"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        value={rule.column}
                        onChange={(e) =>
                          onRuleUpdate(idx, "column", e.target.value)
                        }
                        placeholder="e.g., brand_type_code"
                        className="h-8 border"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        value={rule.condition}
                        onChange={(e) =>
                          onRuleUpdate(idx, "condition", e.target.value)
                        }
                        placeholder="e.g., WIRELINE or IS NULL"
                        className="h-8 border"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRuleRemove(idx)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={onRuleAdd}
            size="sm"
            className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            <Plus className="h-4 w-4" />
            Add Rule
          </Button>
          <Button onClick={onCheckAlignment} size="sm" className="gap-2">
            Check Alignment
          </Button>
          {onCancel && (
            <Button
              onClick={onCancel}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              Cancel
            </Button>
          )}
          {onSave && (
            <Button
              onClick={onSave}
              size="sm"
              className="gap-2"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? "Saving..." : "Save"}
            </Button>
          )}
          <Button
            onClick={handleExportRules}
            size="sm"
            variant="outline"
            className="gap-2 ml-auto"
          >
            <Download className="h-4 w-4" />
            Export Rules
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
