"use client";

import React, { useEffect, useState } from "react";
import { useCampaignStore } from "@/app/store/campaignStore";
import { useAudienceCheckerStore } from "@/app/store/audienceCheckerStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Loader2, Check, AlertCircle } from "lucide-react";
import type { Checker } from "@/app/core/types";

interface SaveToCampaignDialogProps {
  checker: Checker;
}

export const SaveToCampaignDialog: React.FC<SaveToCampaignDialogProps> = ({
  checker,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    campaigns,
    fetchCampaigns,
    isLoading: campaignsLoading,
  } = useCampaignStore();
  const { createChecker } = useAudienceCheckerStore();

  // Validation checks
  const hasQuery =
    checker.inputMode === "query"
      ? checker.query?.trim().length > 0
      : checker.conditionInput?.trim().length > 0;
  const hasRules =
    checker.businessRules.filter((r) => r.table && r.column).length > 0;
  const hasReport = checker.report !== null;
  const canSave = hasQuery && hasRules && hasReport;

  useEffect(() => {
    if (isOpen && campaigns.length === 0) {
      fetchCampaigns();
    }
  }, [isOpen, campaigns.length, fetchCampaigns]);

  const handleSave = async () => {
    if (!selectedCampaignId || !canSave) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Convert local checker rules to API format
      const rulesData = checker.businessRules
        .filter((rule) => rule.table && rule.column)
        .map((rule) => ({
          field: `${rule.table}.${rule.column}`,
          operator: "condition",
          value: rule.condition,
        }));

      // Get the query text
      const queryText =
        checker.inputMode === "query"
          ? checker.query
          : checker.conditionInput
          ? `WHERE ${checker.conditionInput}`
          : undefined;

      // Convert alignment report to API format
      // Local uses: matched, misaligned, undefined
      // API uses: matched, unmatched, extra
      const alignmentReportData = checker.report
        ? {
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
              return {
                table: parts[0] || "",
                column: parts[1] || u,
              };
            }),
          }
        : undefined;

      await createChecker({
        campaignId: selectedCampaignId,
        name: checker.name,
        query: queryText,
        rules: rulesData as any,
        alignmentReport: alignmentReportData,
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSaveSuccess(false);
        setSelectedCampaignId("");
      }, 1500);
    } catch (error) {
      console.error("Failed to save checker:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={!canSave}
          title={
            !canSave
              ? "Run alignment check first with query and rules"
              : "Save checker to a campaign"
          }
        >
          <Save className="h-4 w-4" />
          Save to Campaign
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Checker to Campaign</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Validation warnings */}
          {!canSave && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-4 py-3 rounded-lg text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">Cannot save yet:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    {!hasQuery && <li>Add a SQL query or condition</li>}
                    {!hasRules && <li>Add at least one business rule</li>}
                    {!hasReport && <li>Run the alignment check first</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Checker Name</label>
            <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
              {checker.name}
            </p>
          </div>

          {/* Alignment status */}
          {hasReport && checker.report && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Alignment Status</label>
              <div
                className={`text-sm px-3 py-2 rounded-md ${
                  checker.report.alignmentPercentage >= 80
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : checker.report.alignmentPercentage >= 50
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                }`}
              >
                {checker.report.alignmentPercentage}% aligned (
                {checker.report.matched.length}/{checker.report.totalConditions}{" "}
                conditions matched)
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Campaign</label>
            {campaignsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading campaigns...
              </div>
            ) : campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No campaigns found. Create a campaign first.
              </p>
            ) : (
              <Select
                value={selectedCampaignId}
                onValueChange={setSelectedCampaignId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                      {campaign.campaignType && (
                        <span className="text-muted-foreground ml-2">
                          ({campaign.campaignType})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {hasRules && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Rules to save (
                {
                  checker.businessRules.filter((r) => r.table && r.column)
                    .length
                }
                )
              </label>
              <div className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded-md max-h-24 overflow-y-auto">
                {checker.businessRules
                  .filter((r) => r.table && r.column)
                  .map((rule, idx) => (
                    <div key={idx}>
                      {rule.table}.{rule.column}: {rule.condition}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              !selectedCampaignId ||
              isSaving ||
              campaigns.length === 0 ||
              !canSave
            }
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="h-4 w-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
