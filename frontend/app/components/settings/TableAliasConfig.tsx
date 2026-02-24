"use client";

import React, { useState } from "react";
import { useConfigStore, TableAlias } from "@/app/store/configStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ArrowRight } from "lucide-react";

export const TableAliasConfig: React.FC = () => {
  const { tableAliases, addTableAlias, updateTableAlias, deleteTableAlias } =
    useConfigStore();

  const [newAlias, setNewAlias] = useState({
    sqlTableName: "",
    ruleTableName: "",
  });

  const handleAdd = () => {
    if (newAlias.sqlTableName && newAlias.ruleTableName) {
      addTableAlias({
        sqlTableName: newAlias.sqlTableName.toUpperCase(),
        ruleTableName: newAlias.ruleTableName.toUpperCase(),
      });
      setNewAlias({ sqlTableName: "", ruleTableName: "" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Table Aliases</CardTitle>
        <p className="text-sm text-muted-foreground">
          Map SQL table names to business rule table names
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing aliases */}
        {tableAliases.map((alias) => (
          <div key={alias.id} className="flex items-center gap-2">
            <Input
              value={alias.sqlTableName}
              onChange={(e) =>
                updateTableAlias(alias.id, {
                  sqlTableName: e.target.value.toUpperCase(),
                })
              }
              placeholder="SQL Table Name"
              className="flex-1 font-mono text-sm"
            />
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              value={alias.ruleTableName}
              onChange={(e) =>
                updateTableAlias(alias.id, {
                  ruleTableName: e.target.value.toUpperCase(),
                })
              }
              placeholder="Rule Table Name"
              className="flex-1 font-mono text-sm"
            />
            <Button
              variant="destructive"
              size="icon"
              onClick={() => deleteTableAlias(alias.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {/* Add new alias */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Input
            value={newAlias.sqlTableName}
            onChange={(e) =>
              setNewAlias({ ...newAlias, sqlTableName: e.target.value })
            }
            placeholder="SQL Table Name"
            className="flex-1 font-mono text-sm"
          />
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            value={newAlias.ruleTableName}
            onChange={(e) =>
              setNewAlias({ ...newAlias, ruleTableName: e.target.value })
            }
            placeholder="Rule Table Name"
            className="flex-1 font-mono text-sm"
          />
          <Button onClick={handleAdd} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
