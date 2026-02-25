"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCampaignStore } from "@/app/store/campaignStore";
import { useAudienceCheckerStore } from "@/app/store/audienceCheckerStore";
import { useConfigStore } from "@/app/store/configStore";
import { useToast } from "@/hooks/use-toast";
import type { AudienceChecker } from "@/app/services/api";
import type { Checker, BusinessRule, AlignmentReport } from "@/app/core/types";
import { CheckerCard } from "@/app/components/checker/CheckerCard";
import { ImportDialog } from "@/app/components/import/ImportDialog";
import { BulkCheckDialog } from "@/app/components/summary/BulkCheckDialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Loader2, ClipboardCheck, ChevronRight } from "lucide-react";

// Convert API checker to local Checker format
function apiToLocalChecker(
  apiChecker: AudienceChecker,
  index: number,
): Checker {
  const businessRules: BusinessRule[] = (apiChecker.rules || []).map((rule) => {
    const parts = rule.field.split(".");
    return {
      table: parts[0] || "",
      column: parts.slice(1).join(".") || "",
      condition: rule.value || "",
    };
  });

  if (businessRules.length === 0) {
    businessRules.push({ table: "", column: "", condition: "" });
  }

  let report: AlignmentReport | null = null;
  if (apiChecker.alignmentReport) {
    const ar = apiChecker.alignmentReport;
    report = {
      totalConditions: ar.totalConditions,
      alignmentPercentage: ar.alignmentPercentage,
      matched: ar.matched.map((m) => ({
        table: m.table,
        column: m.column,
        condition: m.condition || "",
      })),
      misaligned: ar.unmatched.map((m) => ({
        condition: `${m.table}.${m.column}`,
        issues: [m.condition || "Missing from query"],
      })),
      undefined: ar.extra.map((m) => `${m.table}.${m.column}`),
      allConditions: [],
    };
  }

  return {
    id: index,
    name: apiChecker.name,
    query: apiChecker.query || "",
    conditionInput: "",
    inputMode: "query",
    businessRules,
    report,
    expanded: false,
  };
}

// Convert local Checker to API format for saving
function localToApiChecker(checker: Checker) {
  const rules = checker.businessRules
    .filter((r) => r.table && r.column)
    .map((r) => ({
      field: `${r.table}.${r.column}`,
      operator: "condition",
      value: r.condition,
    }));

  const query =
    checker.inputMode === "query"
      ? checker.query
      : checker.conditionInput
        ? `WHERE ${checker.conditionInput}`
        : undefined;

  let alignmentReport = undefined;
  if (checker.report) {
    alignmentReport = {
      alignmentPercentage: checker.report.alignmentPercentage,
      totalConditions: checker.report.totalConditions,
      matched: checker.report.matched,
      unmatched: checker.report.misaligned.map((m) => ({
        table: "",
        column: m.condition,
        condition: m.issues.join(", "),
      })),
      extra: checker.report.undefined.map((u) => {
        const parts = u.split(".");
        return { table: parts[0] || "", column: parts[1] || u };
      }),
    };
  }

  return { query, rules, alignmentReport };
}

export default function ValidationsPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const { toast } = useToast();

  const {
    selectedCampaign,
    fetchCampaign,
    isLoading: campaignLoading,
  } = useCampaignStore();

  const {
    checkers: apiCheckers,
    isLoading: checkersLoading,
    error,
    fetchCheckersByCampaign,
    createChecker,
    updateChecker: updateApiChecker,
    deleteChecker: deleteApiChecker,
    clearCheckers,
  } = useAudienceCheckerStore();

  // Local state for editing
  const [localCheckers, setLocalCheckers] = useState<Checker[]>([]);
  const [checkerIdMap, setCheckerIdMap] = useState<Map<number, string>>(
    new Map(),
  );
  const [pendingChanges, setPendingChanges] = useState<Set<number>>(new Set());
  const [savingChecker, setSavingChecker] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    localId: number;
    apiId: string;
    name: string;
  } | null>(null);
  const [nextLocalId, setNextLocalId] = useState(1000);
  const [initialSyncDone, setInitialSyncDone] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  // Load campaign and checkers
  useEffect(() => {
    fetchCampaign(campaignId);
    fetchCheckersByCampaign(campaignId).finally(() => {
      setHasAttemptedFetch(true);
    });
    return () => {
      clearCheckers();
      setInitialSyncDone(false);
      setHasAttemptedFetch(false);
    };
  }, [campaignId, fetchCampaign, fetchCheckersByCampaign, clearCheckers]);

  // Convert API checkers to local format only on initial load
  useEffect(() => {
    if (!hasAttemptedFetch || initialSyncDone) return;

    if (apiCheckers.length > 0) {
      const converted = apiCheckers.map((c, i) => apiToLocalChecker(c, i));
      setLocalCheckers(converted);

      const idMap = new Map<number, string>();
      apiCheckers.forEach((c, i) => idMap.set(i, c.id));
      setCheckerIdMap(idMap);
      setInitialSyncDone(true);
    } else if (!checkersLoading) {
      // No checkers exist, mark sync as done
      setInitialSyncDone(true);
    }
  }, [apiCheckers, checkersLoading, initialSyncDone, hasAttemptedFetch]);

  // Update a local checker field
  const updateLocalChecker = useCallback(
    (id: number, field: keyof Checker, value: unknown) => {
      setLocalCheckers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
      );
      setPendingChanges((prev) => new Set(prev).add(id));
    },
    [],
  );

  // Toggle expanded state
  const toggleExpanded = useCallback((id: number) => {
    setLocalCheckers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, expanded: !c.expanded } : c)),
    );
  }, []);

  // Update a rule
  const updateRule = useCallback(
    (
      checkerId: number,
      ruleIndex: number,
      field: keyof BusinessRule,
      value: string,
    ) => {
      setLocalCheckers((prev) =>
        prev.map((c) => {
          if (c.id !== checkerId) return c;
          const newRules = [...c.businessRules];
          newRules[ruleIndex] = { ...newRules[ruleIndex], [field]: value };
          return { ...c, businessRules: newRules };
        }),
      );
      setPendingChanges((prev) => new Set(prev).add(checkerId));
    },
    [],
  );

  // Add a rule
  const addRule = useCallback((checkerId: number) => {
    setLocalCheckers((prev) =>
      prev.map((c) => {
        if (c.id !== checkerId) return c;
        return {
          ...c,
          businessRules: [
            ...c.businessRules,
            { table: "", column: "", condition: "" },
          ],
        };
      }),
    );
    setPendingChanges((prev) => new Set(prev).add(checkerId));
  }, []);

  // Remove a rule
  const removeRule = useCallback((checkerId: number, ruleIndex: number) => {
    setLocalCheckers((prev) =>
      prev.map((c) => {
        if (c.id !== checkerId) return c;
        const newRules = c.businessRules.filter((_, i) => i !== ruleIndex);
        if (newRules.length === 0) {
          newRules.push({ table: "", column: "", condition: "" });
        }
        return { ...c, businessRules: newRules };
      }),
    );
    setPendingChanges((prev) => new Set(prev).add(checkerId));
  }, []);

  // Paste bulk rules
  const { columnTableMappings } = useConfigStore();

  const pasteBulkRules = useCallback(
    (checkerId: number, pastedText: string) => {
      const lines = pastedText.split("\n").filter((line) => line.trim());
      const newRules: BusinessRule[] = lines.map((line) => {
        // Replace multiple consecutive tabs with a single tab
        const normalizedLine = line.replace(/\t+/g, "\t");
        const parts = normalizedLine.split("\t");

        let table = parts[0]?.trim() || "";
        const column = parts[1]?.trim() || "";
        const condition = parts[2]?.trim() || "";

        // Auto-set table based on column mappings from settings
        const columnLower = column.toLowerCase();
        const mapping = columnTableMappings.find(
          (m) => m.columnName.toLowerCase() === columnLower,
        );
        if (mapping) {
          table = mapping.tableName;
        }

        return { table, column, condition };
      });

      if (newRules.length > 0) {
        setLocalCheckers((prev) =>
          prev.map((c) => {
            if (c.id !== checkerId) return c;
            return { ...c, businessRules: newRules };
          }),
        );
        setPendingChanges((prev) => new Set(prev).add(checkerId));
      }
    },
    [columnTableMappings],
  );

  // Add new checker
  const handleAddChecker = () => {
    const newId = nextLocalId;
    setNextLocalId((prev) => prev + 1);

    const newChecker: Checker = {
      id: newId,
      name: `New Validation ${localCheckers.length + 1}`,
      query: "",
      conditionInput: "",
      inputMode: "query",
      businessRules: [{ table: "", column: "", condition: "" }],
      report: null,
      expanded: true,
    };

    setLocalCheckers((prev) => [...prev, newChecker]);
    setPendingChanges((prev) => new Set(prev).add(newId));
  };

  // Handle import
  const handleImport = (
    importedCheckers: Array<{
      name: string;
      query: string;
      conditionInput: string;
      inputMode: string;
    }>,
  ) => {
    let currentId = nextLocalId;
    const newCheckers: Checker[] = [];

    importedCheckers.forEach((checkerData) => {
      const newChecker: Checker = {
        id: currentId,
        name: checkerData.name,
        query: checkerData.query || "",
        conditionInput: checkerData.conditionInput || "",
        inputMode: (checkerData.inputMode as "query" | "condition") || "query",
        businessRules: [{ table: "", column: "", condition: "" }],
        report: null,
        expanded: false,
      };

      newCheckers.push(newChecker);
      currentId++;
    });

    setLocalCheckers((prev) => [...prev, ...newCheckers]);
    setNextLocalId(currentId);

    newCheckers.forEach((checker) => {
      setPendingChanges((prev) => new Set(prev).add(checker.id));
    });
  };

  // Handle bulk reports update
  const handleBulkReportsUpdate = (reports: Map<number, AlignmentReport>) => {
    reports.forEach((report, checkerId) => {
      updateLocalChecker(checkerId, "report", report);
    });
  };

  // Save a checker
  const handleSaveChecker = async (localId: number) => {
    const checker = localCheckers.find((c) => c.id === localId);
    if (!checker) return;

    setSavingChecker(localId);
    try {
      const apiId = checkerIdMap.get(localId);
      const apiData = localToApiChecker(checker);

      if (apiId) {
        await updateApiChecker(apiId, {
          name: checker.name,
          ...apiData,
        } as any);
      } else {
        const created = await createChecker({
          campaignId,
          name: checker.name,
          query: apiData.query,
          rules: apiData.rules as any,
          alignmentReport: apiData.alignmentReport,
        });
        setCheckerIdMap((prev) => new Map(prev).set(localId, created.id));
      }

      setPendingChanges((prev) => {
        const next = new Set(prev);
        next.delete(localId);
        return next;
      });

      toast({
        title: "Saved successfully",
        description: `Validation "${checker.name}" has been saved.`,
        variant: "success",
      });
    } catch (e) {
      console.error("Failed to save checker:", e);
      toast({
        title: "Failed to save",
        description: "An error occurred while saving the validation.",
        variant: "destructive",
      });
    } finally {
      setSavingChecker(null);
    }
  };

  // Delete a checker
  const handleDeleteChecker = async () => {
    if (!deleteConfirm) return;

    const { localId, apiId } = deleteConfirm;

    try {
      if (apiId) {
        await deleteApiChecker(apiId);
      }
      setLocalCheckers((prev) => prev.filter((c) => c.id !== localId));
      setCheckerIdMap((prev) => {
        const next = new Map(prev);
        next.delete(localId);
        return next;
      });
      setPendingChanges((prev) => {
        const next = new Set(prev);
        next.delete(localId);
        return next;
      });
    } catch (e) {
      console.error("Failed to delete checker:", e);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const isLoading = campaignLoading || checkersLoading;

  if (isLoading && !selectedCampaign) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link
          href="/campaigns"
          className="hover:text-foreground transition-colors"
        >
          Campaigns
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href={`/campaigns/${campaignId}`}
          className="hover:text-foreground transition-colors"
        >
          {selectedCampaign?.name || "Campaign"}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href={`/campaigns/${campaignId}/audience`}
          className="hover:text-foreground transition-colors"
        >
          Audience
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Validations</span>
      </nav>

      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-1">Validations</h1>
          <p className="text-muted-foreground">
            Manage audience validations for{" "}
            {selectedCampaign?.name || "this campaign"}
          </p>
        </div>
        <div className="flex gap-2">
          <BulkCheckDialog
            checkers={localCheckers}
            onReportsUpdate={handleBulkReportsUpdate}
          />
          <ImportDialog
            existingNames={localCheckers.map((c) => c.name)}
            onImport={handleImport}
          />
          <Button onClick={handleAddChecker} className="gap-2">
            <Plus className="h-4 w-4" />
            New Validation
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Validations List */}
      {!isLoading && localCheckers.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            No validations yet. Create one to get started.
          </p>
          <div className="flex gap-2 justify-center">
            <ImportDialog
              existingNames={localCheckers.map((c) => c.name)}
              onImport={handleImport}
            />
            <Button onClick={handleAddChecker} className="gap-2">
              <Plus className="h-4 w-4" />
              Add First Validation
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-w-6xl">
          {localCheckers.map((checker) => {
            const apiId = checkerIdMap.get(checker.id);
            const hasChanges = pendingChanges.has(checker.id);
            const isSaving = savingChecker === checker.id;

            return (
              <CheckerCard
                key={checker.id}
                checker={checker}
                canDelete={true}
                hasChanges={hasChanges}
                isSaving={isSaving}
                onNameChange={(value) =>
                  updateLocalChecker(checker.id, "name", value)
                }
                onDelete={() =>
                  setDeleteConfirm({
                    localId: checker.id,
                    apiId: apiId || "",
                    name: checker.name,
                  })
                }
                onToggleExpanded={() => toggleExpanded(checker.id)}
                onInputModeChange={(mode) =>
                  updateLocalChecker(checker.id, "inputMode", mode)
                }
                onQueryChange={(value) =>
                  updateLocalChecker(checker.id, "query", value)
                }
                onConditionChange={(value) =>
                  updateLocalChecker(checker.id, "conditionInput", value)
                }
                onRuleUpdate={(ruleIndex, field, value) =>
                  updateRule(checker.id, ruleIndex, field, value)
                }
                onRuleAdd={() => addRule(checker.id)}
                onRuleRemove={(ruleIndex) => removeRule(checker.id, ruleIndex)}
                onPasteBulkRules={(text) => pasteBulkRules(checker.id, text)}
                onReportUpdate={(report) => {
                  updateLocalChecker(checker.id, "report", report);
                }}
                onSave={() => handleSaveChecker(checker.id)}
              />
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Validation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deleteConfirm?.name}&quot; and
              all its rules. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChecker}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
