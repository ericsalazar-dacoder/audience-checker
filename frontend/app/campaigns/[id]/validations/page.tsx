"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
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
import {
  Plus,
  Loader2,
  ClipboardCheck,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [originalCheckers, setOriginalCheckers] = useState<Checker[]>([]);
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
  const [sortBy, setSortBy] = useState<
    | "default"
    | "name-asc"
    | "name-desc"
    | "alignment-asc"
    | "alignment-desc"
    | "status"
  >("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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
      // Store a deep copy of original data for cancel functionality
      setOriginalCheckers(JSON.parse(JSON.stringify(converted)));

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
    updates?: Array<{
      name: string;
      query: string;
      conditionInput: string;
      inputMode: string;
    }>,
  ) => {
    // Handle updates to existing checkers
    if (updates) {
      updates.forEach((update) => {
        const existingChecker = localCheckers.find(
          (c) =>
            c.name.toLowerCase().trim() === update.name.toLowerCase().trim(),
        );
        if (existingChecker) {
          updateLocalChecker(existingChecker.id, "query", update.query);
          updateLocalChecker(
            existingChecker.id,
            "conditionInput",
            update.conditionInput,
          );
          updateLocalChecker(
            existingChecker.id,
            "inputMode",
            update.inputMode as "query" | "condition",
          );
          setPendingChanges((prev) => new Set(prev).add(existingChecker.id));
        }
      });
    }

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

      // Update originalCheckers to reflect saved state so cancel won't revert past this save
      setOriginalCheckers((prev) => {
        const savedChecker = localCheckers.find((c) => c.id === localId);
        if (!savedChecker) return prev;
        const copy = JSON.parse(JSON.stringify(savedChecker));
        const exists = prev.find((c) => c.id === localId);
        if (exists) {
          return prev.map((c) => (c.id === localId ? copy : c));
        }
        return [...prev, copy];
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

  // Cancel changes and restore original data
  const handleCancelChecker = (localId: number) => {
    const original = originalCheckers.find((c) => c.id === localId);
    if (original) {
      setLocalCheckers((prev) =>
        prev.map((c) =>
          c.id === localId ? JSON.parse(JSON.stringify(original)) : c,
        ),
      );
      setPendingChanges((prev) => {
        const next = new Set(prev);
        next.delete(localId);
        return next;
      });

      const checker = localCheckers.find((c) => c.id === localId);
      toast({
        title: "Changes discarded",
        description: `All changes to "${checker?.name}" have been reverted.`,
        variant: "default",
      });
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

  // Filtered checkers (search)
  const filteredCheckers = useMemo(() => {
    if (!searchQuery.trim()) return localCheckers;
    const query = searchQuery.toLowerCase().trim();
    return localCheckers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.query.toLowerCase().includes(query) ||
        c.conditionInput.toLowerCase().includes(query),
    );
  }, [localCheckers, searchQuery]);

  // Sorted checkers
  const sortedCheckers = useMemo(() => {
    if (sortBy === "default") return filteredCheckers;

    return [...filteredCheckers].sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "alignment-asc":
          return (
            (a.report?.alignmentPercentage ?? -1) -
            (b.report?.alignmentPercentage ?? -1)
          );
        case "alignment-desc":
          return (
            (b.report?.alignmentPercentage ?? -1) -
            (a.report?.alignmentPercentage ?? -1)
          );
        case "status": {
          const aHasReport = a.report ? 0 : 1;
          const bHasReport = b.report ? 0 : 1;
          if (aHasReport !== bHasReport) return aHasReport - bHasReport;
          return (
            (b.report?.alignmentPercentage ?? -1) -
            (a.report?.alignmentPercentage ?? -1)
          );
        }
        default:
          return 0;
      }
    });
  }, [filteredCheckers, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedCheckers.length / pageSize));
  const paginatedCheckers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCheckers.slice(start, start + pageSize);
  }, [sortedCheckers, currentPage, pageSize]);

  // Reset to page 1 when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

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
        <div className="flex gap-2 items-center">
          <BulkCheckDialog
            checkers={localCheckers}
            onReportsUpdate={handleBulkReportsUpdate}
            campaignId={campaignId}
            checkerIdMap={checkerIdMap}
            autoSave
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

      {/* Search & Sort Bar */}
      {localCheckers.length > 0 && (
        <div className="flex gap-3 items-center max-w-6xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search validations by name or query..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {localCheckers.length > 1 && (
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as typeof sortBy)}
            >
              <SelectTrigger className="w-[200px] gap-2">
                <ArrowUpDown className="h-4 w-4" />
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Order</SelectItem>
                <SelectItem value="name-asc">Name (A → Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z → A)</SelectItem>
                <SelectItem value="alignment-desc">
                  Alignment (High → Low)
                </SelectItem>
                <SelectItem value="alignment-asc">
                  Alignment (Low → High)
                </SelectItem>
                <SelectItem value="status">Status (Checked First)</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      )}

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
      ) : sortedCheckers.length === 0 && searchQuery.trim() ? (
        <div className="text-center py-12 max-w-6xl">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">
            No validations match &quot;{searchQuery}&quot;
          </p>
          <Button
            variant="ghost"
            onClick={() => setSearchQuery("")}
            className="text-sm"
          >
            Clear search
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4 max-w-6xl">
            {paginatedCheckers.map((checker) => {
              const apiId = checkerIdMap.get(checker.id);

              return (
                <CheckerCard
                  key={checker.id}
                  checker={checker}
                  canDelete={true}
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
                  onRuleRemove={(ruleIndex) =>
                    removeRule(checker.id, ruleIndex)
                  }
                  onPasteBulkRules={(text) => pasteBulkRules(checker.id, text)}
                  onReportUpdate={(report) => {
                    updateLocalChecker(checker.id, "report", report);
                  }}
                  onSave={() => handleSaveChecker(checker.id)}
                  onCancel={() => handleCancelChecker(checker.id)}
                  isSaving={savingChecker === checker.id}
                />
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between max-w-6xl">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                {Math.min(
                  (currentPage - 1) * pageSize + 1,
                  sortedCheckers.length,
                )}
                –{Math.min(currentPage * pageSize, sortedCheckers.length)} of{" "}
                {sortedCheckers.length} validation
                {sortedCheckers.length !== 1 ? "s" : ""}
                {searchQuery.trim() && (
                  <span className="ml-1">
                    (filtered from {localCheckers.length})
                  </span>
                )}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 text-sm font-medium">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
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
