"use client";

import React from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  TableAliasConfig,
  ConditionEquivalenceConfig,
  ColumnTableMappingConfig,
} from "@/app/components/settings";
import { ChevronRight } from "lucide-react";

export default function AudienceValidationSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link
          href="/settings"
          className="hover:text-foreground transition-colors"
        >
          Settings
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Audience Validation</span>
      </nav>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-1">
          Audience Validation Settings
        </h1>
        <p className="text-muted-foreground">
          Configure condition matching, table aliases, and column mappings
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="conditions" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="conditions">Condition Config</TabsTrigger>
          <TabsTrigger value="tables">Table Aliases</TabsTrigger>
          <TabsTrigger value="columns">Column Mappings</TabsTrigger>
        </TabsList>

        <TabsContent value="conditions" className="mt-6 space-y-6">
          <ConditionEquivalenceConfig />
        </TabsContent>

        <TabsContent value="tables" className="mt-6 space-y-6">
          <TableAliasConfig />
        </TabsContent>

        <TabsContent value="columns" className="mt-6 space-y-6">
          <ColumnTableMappingConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
}
