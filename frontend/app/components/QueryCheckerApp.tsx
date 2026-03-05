"use client";

import React from "react";
import { useCheckerStore } from "@store/checkerStore";
import { CheckerCard, ImportDialog, BulkCheckDialog } from "@components";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const QueryCheckerApp: React.FC = () => {
  const {
    checkers,
    addChecker,
    updateChecker,
    deleteChecker,
    toggleExpanded,
    updateRule,
    addRule,
    removeRule,
    pasteBulkRules,
  } = useCheckerStore();

  const handleBulkReportsUpdate = (reports: Map<number, any>) => {
    reports.forEach((report, checkerId) => {
      updateChecker(checkerId, "report", report);
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-1">Audience Checker</h1>
          <p className="text-muted-foreground">
            Validate your SQL queries against business rules
          </p>
        </div>
        <div className="flex gap-2">
          <BulkCheckDialog
            checkers={checkers}
            onReportsUpdate={handleBulkReportsUpdate}
          />
          <ImportDialog
            existingNames={checkers.map((c) => c.name)}
            onImport={(importedCheckers, updates) => {
              // Handle updates to existing checkers
              if (updates) {
                updates.forEach((update) => {
                  const existingChecker = checkers.find(
                    (c) =>
                      c.name.toLowerCase().trim() ===
                      update.name.toLowerCase().trim(),
                  );
                  if (existingChecker) {
                    updateChecker(existingChecker.id, "query", update.query);
                    updateChecker(
                      existingChecker.id,
                      "conditionInput",
                      update.conditionInput,
                    );
                    updateChecker(
                      existingChecker.id,
                      "inputMode",
                      update.inputMode,
                    );
                    // Reset the alignment report since query/condition changed
                    updateChecker(existingChecker.id, "report", null);
                  }
                });
              }

              // Add new checkers
              importedCheckers.forEach((checkerData) => {
                addChecker();
                const newCheckerId =
                  useCheckerStore.getState().checkers.length - 1;
                updateChecker(newCheckerId, "name", checkerData.name);
                updateChecker(newCheckerId, "query", checkerData.query);
                updateChecker(
                  newCheckerId,
                  "conditionInput",
                  checkerData.conditionInput,
                );
                updateChecker(newCheckerId, "inputMode", checkerData.inputMode);
              });
            }}
          />
        </div>
      </div>

      {/* Checkers List */}
      <div className="space-y-4 max-w-6xl">
        {checkers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No checkers yet. Create one to get started.
            </p>
          </div>
        ) : (
          checkers.map((checker) => (
            <CheckerCard
              key={checker.id}
              checker={checker}
              canDelete={checkers.length > 1}
              onNameChange={(value) => updateChecker(checker.id, "name", value)}
              onDelete={() => deleteChecker(checker.id)}
              onToggleExpanded={() => toggleExpanded(checker.id)}
              onInputModeChange={(mode) =>
                updateChecker(checker.id, "inputMode", mode)
              }
              onQueryChange={(value) =>
                updateChecker(checker.id, "query", value)
              }
              onConditionChange={(value) =>
                updateChecker(checker.id, "conditionInput", value)
              }
              onRuleUpdate={(ruleIndex, field, value) =>
                updateRule(checker.id, ruleIndex, field, value)
              }
              onRuleAdd={() => addRule(checker.id)}
              onRuleRemove={(ruleIndex) => removeRule(checker.id, ruleIndex)}
              onPasteBulkRules={(text) => pasteBulkRules(checker.id, text)}
              onReportUpdate={(report) =>
                updateChecker(checker.id, "report", report)
              }
            />
          ))
        )}

        {/* Add New Checker Button */}
        <div className="mt-8 flex gap-2">
          <Button onClick={addChecker} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Checker
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QueryCheckerApp;
