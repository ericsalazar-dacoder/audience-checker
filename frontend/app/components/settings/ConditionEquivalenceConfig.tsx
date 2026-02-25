"use client";

import React, { useState } from "react";
import { useConfigStore } from "@/app/store/configStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, X } from "lucide-react";

export const ConditionEquivalenceConfig: React.FC = () => {
  const {
    conditionEquivalences,
    addConditionEquivalence,
    updateConditionEquivalence,
    deleteConditionEquivalence,
    addSqlPattern,
    removeSqlPattern,
  } = useConfigStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEquiv, setNewEquiv] = useState({
    name: "",
    rulePattern: "",
    sqlPatterns: [""],
  });

  const handleAdd = () => {
    if (newEquiv.name && newEquiv.rulePattern) {
      addConditionEquivalence({
        name: newEquiv.name,
        rulePattern: newEquiv.rulePattern.toUpperCase(),
        sqlPatterns: newEquiv.sqlPatterns.filter((p) => p.trim()),
      });
      setNewEquiv({ name: "", rulePattern: "", sqlPatterns: [""] });
      setDialogOpen(false);
    }
  };

  const handleAddPattern = (equivId: string, pattern: string) => {
    if (pattern.trim()) {
      addSqlPattern(equivId, pattern.trim());
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Condition Equivalences</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Define which SQL patterns match business rule conditions.
              <br />
              Use{" "}
              <code className="text-xs bg-muted px-1 rounded">
                {"{{column}}"}
              </code>{" "}
              as a placeholder for the column name.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Condition Equivalence</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={newEquiv.name}
                    onChange={(e) =>
                      setNewEquiv({ ...newEquiv, name: e.target.value })
                    }
                    placeholder="e.g., IS NULL or IS EMPTY"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Rule Pattern</label>
                  <Input
                    value={newEquiv.rulePattern}
                    onChange={(e) =>
                      setNewEquiv({ ...newEquiv, rulePattern: e.target.value })
                    }
                    placeholder="e.g., IS NULL OR IS EMPTY"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The pattern as written in business rules
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">SQL Patterns</label>
                  <Textarea
                    value={newEquiv.sqlPatterns.join("\n")}
                    onChange={(e) =>
                      setNewEquiv({
                        ...newEquiv,
                        sqlPatterns: e.target.value.split("\n"),
                      })
                    }
                    placeholder="One pattern per line..."
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    SQL patterns that should match this rule (one per line)
                  </p>
                </div>
                <Button onClick={handleAdd} className="w-full">
                  Add Equivalence
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {conditionEquivalences.map((equiv) => (
          <div key={equiv.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{equiv.name}</h4>
                <p className="text-sm font-mono text-muted-foreground">
                  Rule: {equiv.rulePattern}
                </p>
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                onClick={() => deleteConditionEquivalence(equiv.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                SQL Patterns that match:
              </label>
              <div className="flex flex-wrap gap-2">
                {equiv.sqlPatterns.map((pattern, idx) => (
                  <div
                    key={`${equiv.id}-pattern-${idx}`}
                    className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm font-mono"
                  >
                    <span>{pattern}</span>
                    <button
                      onClick={() => removeSqlPattern(equiv.id, idx)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add SQL pattern..."
                  className="flex-1 font-mono text-sm h-8"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddPattern(equiv.id, e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    const input = e.currentTarget
                      .previousElementSibling as HTMLInputElement;
                    handleAddPattern(equiv.id, input.value);
                    input.value = "";
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {conditionEquivalences.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No condition equivalences defined. Add one to get started.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
