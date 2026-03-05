"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, AlertCircle, AlertTriangle } from "lucide-react";
import {
  parseCSVData,
  convertToCheckerData,
  AudienceImportData,
} from "@utils/csvImporter";

interface ImportDialogProps {
  existingNames?: string[];
  onImport: (
    checkers: Array<{
      name: string;
      description: string;
      query: string;
      conditionInput: string;
      inputMode: string;
    }>,
    updates?: Array<{
      name: string;
      query: string;
      conditionInput: string;
      inputMode: string;
    }>,
  ) => void;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({
  existingNames = [],
  onImport,
}) => {
  const [open, setOpen] = useState(false);
  const [csvData, setCsvData] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<AudienceImportData[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(false);
  const [updateMode, setUpdateMode] = useState<"skip" | "update" | "import">(
    "skip",
  );
  const [selectedForUpdate, setSelectedForUpdate] = useState<Set<string>>(
    new Set(),
  );

  // Check for duplicates - both within import data and against existing checkers
  const { uniqueItems, duplicates, existingDuplicates } = useMemo(() => {
    console.log("=== Duplicate Detection Debug ===");
    console.log("Preview items count:", preview.length);
    console.log(
      "Preview names:",
      preview.map((p) => `"${p.audienceName}"`).join(", "),
    );

    const existingNamesLower = existingNames.map((n) => n.toLowerCase().trim());

    // Count how many times each name appears in preview
    const nameCount = new Map<string, string[]>(); // map name to list of original names with that lowercase

    for (const item of preview) {
      const nameLower = item.audienceName.toLowerCase().trim();
      if (!nameCount.has(nameLower)) {
        nameCount.set(nameLower, []);
      }
      nameCount.get(nameLower)!.push(item.audienceName);
    }

    console.log(
      "Name counts:",
      Array.from(nameCount.entries())
        .map(([k, v]) => `${k}: ${v.length}`)
        .join(", "),
    );

    // Find duplicates: names that appear more than once in preview
    const dupeNames = new Set<string>();
    const existingDupeNames = new Set<string>();

    for (const [nameLower, names] of nameCount) {
      // Check if this name exists in current checkers
      if (existingNamesLower.includes(nameLower)) {
        for (const name of names) {
          existingDupeNames.add(name);
        }
      }

      // Check if this name appears multiple times in preview
      if (names.length > 1) {
        for (const name of names) {
          dupeNames.add(name);
        }
      }
    }

    console.log("Import duplicates:", Array.from(dupeNames).join(", "));
    console.log(
      "Existing duplicates:",
      Array.from(existingDupeNames).join(", "),
    );

    // Build result arrays
    const unique: AudienceImportData[] = [];
    const dupes: string[] = [];
    const existingDupes: string[] = [];

    for (const item of preview) {
      const isExistingDupe = existingDupeNames.has(item.audienceName);
      const isImportDupe = dupeNames.has(item.audienceName);

      if (isExistingDupe) {
        existingDupes.push(item.audienceName);
        if (!skipDuplicates) {
          unique.push(item);
        }
      } else if (isImportDupe) {
        dupes.push(item.audienceName);
        if (!skipDuplicates) {
          unique.push(item);
        }
      } else {
        // No duplicate found
        unique.push(item);
      }
    }

    return {
      uniqueItems: unique,
      duplicates: dupes,
      existingDuplicates: existingDupes,
    };
  }, [preview, existingNames, skipDuplicates]);

  // Items to import based on skipDuplicates setting
  const itemsToImport = skipDuplicates ? uniqueItems : preview;

  const tryParseData = (text: string) => {
    try {
      const parsed = parseCSVData(text);
      setPreview(parsed);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setPreview([]);
    }
  };

  const handleImport = () => {
    if (itemsToImport.length === 0 && selectedForUpdate.size === 0) {
      setError("No valid data to import");
      return;
    }

    // Build the updates list from selected items
    const updates = Array.from(selectedForUpdate)
      .map((name) => preview.find((p) => p.audienceName === name))
      .filter((item): item is AudienceImportData => item !== undefined)
      .map((item) => ({
        name: item.audienceName,
        query: item.sqlQuery || "",
        conditionInput: item.condition || "",
        inputMode: item.condition ? "condition" : "query",
      }));

    // Exclude items that are selected for update or are existing duplicates
    // being skipped, so they don't get re-added as new checkers
    const existingNamesLower = existingNames.map((n) => n.toLowerCase().trim());
    const filteredForImport = itemsToImport.filter((item) => {
      const nameLower = item.audienceName.toLowerCase().trim();
      const isExisting = existingNamesLower.includes(nameLower);
      // If in update mode, exclude all existing duplicates (selected ones go to updates)
      if (updateMode === "update" && isExisting) return false;
      // If in skip mode, exclude existing duplicates
      if (updateMode === "skip" && isExisting) return false;
      return true;
    });

    const checkers = filteredForImport.map(convertToCheckerData);

    onImport(checkers, updates.length > 0 ? updates : undefined);
    setOpen(false);
    setCsvData("");
    setPreview([]);
    setError(null);
    setSelectedForUpdate(new Set());
    setUpdateMode("skip");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Audiences from CSV</DialogTitle>
          <DialogDescription>
            Paste CSV/TSV data with columns: Audience Name, Description,
            sql_query, segment_type, event_id, condition
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">
              Paste CSV/TSV Data:
            </label>
            <Textarea
              value={csvData}
              onChange={(e) => {
                setCsvData(e.target.value);
                tryParseData(e.target.value);
              }}
              placeholder="Paste your CSV data here (tab-separated or comma-separated)..."
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          {preview.length > 0 && (
            <div>
              {/* Duplicate warnings and options */}
              {(duplicates.length > 0 || existingDuplicates.length > 0) && (
                <div className="mb-3 space-y-3">
                  {/* Existing duplicates info */}
                  {existingDuplicates.length > 0 && (
                    <Alert className="border-amber-500/50 bg-amber-500/5">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800 dark:text-amber-200">
                        <span className="font-semibold">
                          {existingDuplicates.length} audience
                          {existingDuplicates.length !== 1 ? "s" : ""} already
                          exist
                        </span>
                        <span className="text-xs ml-1 text-muted-foreground">
                          — {existingDuplicates.join(", ")}
                        </span>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Import duplicates info */}
                  {duplicates.length > 0 && (
                    <Alert className="border-orange-500/50 bg-orange-500/5">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800 dark:text-orange-200">
                        <div className="flex items-center justify-between">
                          <span>
                            <span className="font-semibold">
                              {duplicates.length} duplicate
                              {duplicates.length !== 1 ? "s" : ""} in import
                            </span>
                            <span className="text-xs ml-1 text-muted-foreground">
                              — {duplicates.join(", ")}
                            </span>
                          </span>
                          <label className="flex items-center gap-1.5 text-xs cursor-pointer whitespace-nowrap ml-3">
                            <input
                              type="checkbox"
                              checked={skipDuplicates}
                              onChange={(e) =>
                                setSkipDuplicates(e.target.checked)
                              }
                              className="h-3.5 w-3.5 rounded"
                            />
                            Skip duplicates
                          </label>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Duplicate handling mode cards */}
                  {existingDuplicates.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          setUpdateMode("skip");
                          setSelectedForUpdate(new Set());
                        }}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-xs transition-all ${
                          updateMode === "skip"
                            ? "border-primary bg-primary/5 text-primary font-medium"
                            : "border-muted hover:border-muted-foreground/30 text-muted-foreground"
                        }`}
                      >
                        <span className="text-lg">⏭️</span>
                        <span>Skip existing</span>
                      </button>
                      <button
                        onClick={() => setUpdateMode("update")}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-xs transition-all ${
                          updateMode === "update"
                            ? "border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400 font-medium"
                            : "border-muted hover:border-muted-foreground/30 text-muted-foreground"
                        }`}
                      >
                        <span className="text-lg">🔄</span>
                        <span>Update query</span>
                        <span className="text-[10px] opacity-70">
                          Keeps rules
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setUpdateMode("import");
                          setSelectedForUpdate(new Set());
                        }}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-xs transition-all ${
                          updateMode === "import"
                            ? "border-green-500 bg-green-500/5 text-green-600 dark:text-green-400 font-medium"
                            : "border-muted hover:border-muted-foreground/30 text-muted-foreground"
                        }`}
                      >
                        <span className="text-lg">➕</span>
                        <span>Import as new</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              <label className="text-sm font-medium mb-2 block">
                Preview ({preview.length} parsed
                {updateMode === "update" && selectedForUpdate.size > 0
                  ? `, ${selectedForUpdate.size} to update`
                  : `, ${itemsToImport.length} to import`}
                ):
              </label>

              {/* Table View */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        {updateMode === "update" && (
                          <th className="border-b px-3 py-2 text-left font-medium w-12">
                            <input
                              type="checkbox"
                              checked={
                                existingDuplicates.length > 0 &&
                                selectedForUpdate.size ===
                                  existingDuplicates.length
                              }
                              ref={(el) => {
                                if (el) {
                                  el.indeterminate =
                                    selectedForUpdate.size > 0 &&
                                    selectedForUpdate.size <
                                      existingDuplicates.length;
                                }
                              }}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedForUpdate(
                                    new Set(existingDuplicates),
                                  );
                                } else {
                                  setSelectedForUpdate(new Set());
                                }
                              }}
                              className="h-4 w-4 rounded"
                              title="Select all for update"
                            />
                          </th>
                        )}
                        <th className="border-b px-3 py-2 text-left font-medium">
                          Audience Name
                        </th>
                        <th className="border-b px-3 py-2 text-left font-medium">
                          Description
                        </th>
                        <th className="border-b px-3 py-2 text-left font-medium">
                          Mode
                        </th>
                        <th className="border-b px-3 py-2 text-left font-medium">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((item, idx) => {
                        const isExistingDupe = existingDuplicates.includes(
                          item.audienceName,
                        );
                        const isImportDupe = duplicates.includes(
                          item.audienceName,
                        );
                        const isDupe = isExistingDupe || isImportDupe;
                        const willBeSkipped =
                          isDupe && skipDuplicates && isImportDupe;
                        const canUpdate =
                          isExistingDupe && updateMode === "update";
                        const isSelected = selectedForUpdate.has(
                          item.audienceName,
                        );

                        return (
                          <tr
                            key={`preview-${item.audienceName}-${idx}`}
                            className={`border-b hover:bg-muted/50 ${
                              willBeSkipped
                                ? "opacity-50 bg-amber-50 dark:bg-amber-950/20"
                                : ""
                            } ${
                              canUpdate && isSelected
                                ? "bg-blue-50 dark:bg-blue-950/20"
                                : ""
                            }`}
                          >
                            {updateMode === "update" && (
                              <td className="border-b px-3 py-2 text-center">
                                {isExistingDupe && (
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      const newSet = new Set(selectedForUpdate);
                                      if (e.target.checked) {
                                        newSet.add(item.audienceName);
                                      } else {
                                        newSet.delete(item.audienceName);
                                      }
                                      setSelectedForUpdate(newSet);
                                    }}
                                    className="h-4 w-4 rounded"
                                  />
                                )}
                              </td>
                            )}
                            <td className="px-3 py-2 font-medium">
                              {item.audienceName}
                            </td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">
                              {item.description}
                            </td>
                            <td className="px-3 py-2 text-xs">
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                                {item.condition ? "Condition" : "Query"}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              {isExistingDupe && (
                                <span
                                  className={`text-xs px-2 py-1 rounded ${
                                    updateMode === "update" && isSelected
                                      ? "bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
                                      : "bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200"
                                  }`}
                                >
                                  {updateMode === "update" && isSelected
                                    ? "Update"
                                    : "Exists"}
                                </span>
                              )}
                              {isImportDupe && !isExistingDupe && (
                                <span className="text-xs px-2 py-1 bg-orange-200 dark:bg-orange-800 rounded text-orange-800 dark:text-orange-200">
                                  Duplicate
                                </span>
                              )}
                              {!isDupe && (
                                <span className="text-xs px-2 py-1 bg-green-200 dark:bg-green-800 rounded text-green-800 dark:text-green-200">
                                  Ready
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setCsvData("");
                setPreview([]);
                setError(null);
                setSelectedForUpdate(new Set());
                setUpdateMode("skip");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={
                updateMode === "update"
                  ? selectedForUpdate.size === 0 && itemsToImport.length === 0
                  : itemsToImport.length === 0
              }
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {updateMode === "update" && selectedForUpdate.size > 0
                ? `Update ${selectedForUpdate.size} & Import`
                : `Import ${itemsToImport.length}`}{" "}
              {itemsToImport.length !== 1 ? "Audiences" : "Audience"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
