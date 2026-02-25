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
    if (itemsToImport.length === 0) {
      setError("No valid data to import");
      return;
    }

    const checkers = itemsToImport.map(convertToCheckerData);
    onImport(checkers);
    setOpen(false);
    setCsvData("");
    setPreview([]);
    setError(null);
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
              {/* Duplicate warnings */}
              {(duplicates.length > 0 || existingDuplicates.length > 0) && (
                <Alert className="mb-3 border-amber-500 bg-amber-50 dark:bg-amber-950">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    {existingDuplicates.length > 0 && (
                      <div>
                        <span className="font-medium">
                          {existingDuplicates.length} already exist:
                        </span>{" "}
                        {existingDuplicates.join(", ")}
                      </div>
                    )}
                    {duplicates.length > 0 && (
                      <div>
                        <span className="font-medium">
                          {duplicates.length} duplicates in import:
                        </span>{" "}
                        {duplicates.join(", ")}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="skipDuplicates"
                        checked={skipDuplicates}
                        onChange={(e) => setSkipDuplicates(e.target.checked)}
                        className="h-4 w-4 rounded border-amber-500 accent-amber-600"
                      />
                      <label
                        htmlFor="skipDuplicates"
                        className="text-sm cursor-pointer"
                      >
                        Skip duplicates during import
                      </label>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <label className="text-sm font-medium mb-2 block">
                Preview ({preview.length} parsed, {itemsToImport.length} to
                import):
              </label>

              {/* Table View */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
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
                        const willBeSkipped = isDupe && skipDuplicates;

                        return (
                          <tr
                            key={`preview-${item.audienceName}-${idx}`}
                            className={`border-b hover:bg-muted/50 ${
                              willBeSkipped
                                ? "opacity-50 bg-amber-50 dark:bg-amber-950/20"
                                : ""
                            }`}
                          >
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
                                <span className="text-xs px-2 py-1 bg-amber-200 dark:bg-amber-800 rounded text-amber-800 dark:text-amber-200">
                                  Exists
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
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={itemsToImport.length === 0}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Import {itemsToImport.length} Audience
              {itemsToImport.length !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
