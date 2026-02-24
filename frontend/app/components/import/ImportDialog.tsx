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
    }>
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
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  // Check for duplicates - both within import data and against existing checkers
  const { uniqueItems, duplicates, existingDuplicates } = useMemo(() => {
    const seen = new Set<string>();
    const unique: AudienceImportData[] = [];
    const dupes: string[] = [];
    const existingDupes: string[] = [];

    const existingNamesLower = existingNames.map((n) => n.toLowerCase().trim());

    for (const item of preview) {
      const nameLower = item.audienceName.toLowerCase().trim();

      // Check if exists in current checkers
      if (existingNamesLower.includes(nameLower)) {
        existingDupes.push(item.audienceName);
        if (skipDuplicates) continue;
      }

      // Check if duplicate within import data
      if (seen.has(nameLower)) {
        dupes.push(item.audienceName);
        if (skipDuplicates) continue;
      }

      seen.add(nameLower);
      unique.push(item);
    }

    return {
      uniqueItems: unique,
      duplicates: dupes,
      existingDuplicates: existingDupes,
    };
  }, [preview, existingNames, skipDuplicates]);

  // Items to import based on skipDuplicates setting
  const itemsToImport = skipDuplicates ? uniqueItems : preview;

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData("text");
    setCsvData(pastedText);
    setError(null);
    tryParseData(pastedText);
  };

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
              onPaste={handlePaste}
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
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {preview.map((item, idx) => {
                  const isExistingDupe = existingDuplicates.includes(
                    item.audienceName
                  );
                  const isImportDupe = duplicates.includes(item.audienceName);
                  const isDupe = isExistingDupe || isImportDupe;
                  const willBeSkipped = isDupe && skipDuplicates;

                  return (
                    <div
                      key={idx}
                      className={`border rounded p-3 space-y-1 text-sm ${
                        willBeSkipped ? "opacity-50 border-amber-500" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base">
                          {item.audienceName}
                        </span>
                        {isExistingDupe && (
                          <span className="text-xs px-2 py-0.5 bg-amber-200 dark:bg-amber-800 rounded text-amber-800 dark:text-amber-200">
                            Already exists
                            {willBeSkipped ? " (skipped)" : " (will import)"}
                          </span>
                        )}
                        {isImportDupe && (
                          <span className="text-xs px-2 py-0.5 bg-amber-200 dark:bg-amber-800 rounded text-amber-800 dark:text-amber-200">
                            Duplicate
                            {willBeSkipped ? " (skipped)" : " (will import)"}
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground">
                        {item.description}
                      </div>
                      <div className="text-xs">
                        <span className="font-medium">Input Mode:</span>{" "}
                        {item.condition ? "Condition" : "Query"}
                      </div>
                      {item.condition && (
                        <div className="text-xs font-mono bg-muted p-2 rounded">
                          <span className="font-medium">Condition:</span>{" "}
                          {item.condition.substring(0, 100)}
                          {item.condition.length > 100 ? "..." : ""}
                        </div>
                      )}
                      {!item.condition && item.sqlQuery && (
                        <div className="text-xs font-mono bg-muted p-2 rounded">
                          <span className="font-medium">Query:</span>{" "}
                          {item.sqlQuery.substring(0, 100)}
                          {item.sqlQuery.length > 100 ? "..." : ""}
                        </div>
                      )}
                    </div>
                  );
                })}
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
