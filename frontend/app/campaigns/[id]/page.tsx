"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCampaignStore } from "@/app/store/campaignStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, ChevronRight } from "lucide-react";

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;

  const { selectedCampaign, fetchCampaign, isLoading } = useCampaignStore();

  useEffect(() => {
    fetchCampaign(campaignId);
  }, [campaignId, fetchCampaign]);

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
        <span className="text-foreground font-medium">
          {selectedCampaign?.name || "Campaign"}
        </span>
      </nav>

      {/* Campaign Header */}
      <div>
        <h1 className="text-3xl font-bold mb-1">
          {selectedCampaign?.name || "Campaign"}
        </h1>
        <p className="text-muted-foreground">Manage your campaign sections</p>
      </div>

      {/* Campaign Sections */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Audience Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Audience</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View and manage the target audience for this campaign.
            </p>
            <div className="flex justify-end">
              <Link href={`/campaigns/${campaignId}/audience`}>
                <Button size="sm" variant="outline">
                  View Audience
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
