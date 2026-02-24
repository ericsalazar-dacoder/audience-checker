"use client";

import React, { useState } from "react";
import { useConfigStore, ColumnTableMapping } from "@/app/store/configStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

export const ColumnTableMappingConfig: React.FC = () => {
  const {
    columnTableMappings,
    addColumnTableMapping,
    updateColumnTableMapping,
    deleteColumnTableMapping,
  } = useConfigStore();

  const [newMapping, setNewMapping] = useState({
    columnName: "",
    tableName: "",
  });

  const handleAdd = () => {
    if (newMapping.columnName.trim() && newMapping.tableName.trim()) {
      addColumnTableMapping({
        columnName: newMapping.columnName.trim().toLowerCase(),
        tableName: newMapping.tableName.trim(),
      });
      setNewMapping({ columnName: "", tableName: "" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Column to Table Mapping</CardTitle>
        <p className="text-sm text-muted-foreground">
          Auto-assign table names when specific columns are pasted in business
          rules.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Mappings */}
        {columnTableMappings.map((mapping) => (
          <div key={mapping.id} className="flex gap-2 items-center">
            <Input
              value={mapping.columnName}
              onChange={(e) =>
                updateColumnTableMapping(mapping.id, {
                  columnName: e.target.value.toLowerCase(),
                })
              }
              placeholder="Column name"
              className="flex-1"
            />
            <span className="text-muted-foreground">→</span>
            <Input
              value={mapping.tableName}
              onChange={(e) =>
                updateColumnTableMapping(mapping.id, {
                  tableName: e.target.value,
                })
              }
              placeholder="Table name"
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteColumnTableMapping(mapping.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}

        {/* Add New Mapping */}
        <div className="flex gap-2 items-center pt-2 border-t">
          <Input
            value={newMapping.columnName}
            onChange={(e) =>
              setNewMapping({ ...newMapping, columnName: e.target.value })
            }
            placeholder="Column name (e.g., blacklist_tag)"
            className="flex-1"
          />
          <span className="text-muted-foreground">→</span>
          <Input
            value={newMapping.tableName}
            onChange={(e) =>
              setNewMapping({ ...newMapping, tableName: e.target.value })
            }
            placeholder="Table name (e.g., universal_exclusion_list)"
            className="flex-1"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleAdd}
            disabled={
              !newMapping.columnName.trim() || !newMapping.tableName.trim()
            }
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
