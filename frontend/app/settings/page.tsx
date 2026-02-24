"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground">
          Configure application behavior and rules
        </p>
      </div>

      {/* Settings List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Audience Validation Settings Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ClipboardCheck className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Audience Validation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure condition matching, table aliases, and column mappings
              for audience validation.
            </p>
            <div className="flex justify-end">
              <Link href="/settings/audience-validation">
                <Button size="sm" variant="outline">
                  View Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
