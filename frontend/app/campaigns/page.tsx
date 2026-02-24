"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useCampaignStore } from "@/app/store/campaignStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  FolderOpen,
  FolderKanban,
} from "lucide-react";

export default function CampaignsPage() {
  const {
    campaigns,
    isLoading,
    error,
    fetchCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
  } = useCampaignStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
  });

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleCreate = async () => {
    if (!formData.name.trim()) return;
    try {
      await createCampaign({ name: formData.name });
      setFormData({ name: "" });
      setIsCreateOpen(false);
    } catch (e) {
      // Error handled by store
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateCampaign(id, { name: formData.name });
      setEditingCampaign(null);
      setFormData({ name: "" });
    } catch (e) {
      // Error handled by store
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCampaign(id);
    } catch (e) {
      // Error handled by store
    }
  };

  const startEdit = (campaign: any) => {
    setFormData({
      name: campaign.name,
    });
    setEditingCampaign(campaign.id);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-1">Campaigns</h1>
          <p className="text-muted-foreground">
            Manage your audience checker campaigns
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder="Campaign name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!formData.name.trim()}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && campaigns.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Campaign List */}
      {!isLoading && campaigns.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No campaigns yet. Create one to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className="group hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-2">
                {editingCampaign === campaign.id ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FolderKanban className="h-6 w-6 text-primary" />
                      </div>
                      <Input
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="flex-1"
                      />
                    </div>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(campaign.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingCampaign(null);
                          setFormData({ name: "" });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FolderKanban className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    </div>
                    <div className="flex gap-0.5 -mt-4 -mr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 rounded-full"
                        onClick={() => startEdit(campaign)}
                      >
                        <Pencil className="h-2.5 w-2.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5 rounded-full"
                          >
                            <Trash2 className="h-2.5 w-2.5 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Campaign?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete &quot;{campaign.name}
                              &quot; and all its audience checkers. This action
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(campaign.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage audience and validations for this campaign.
                </p>
                <div className="flex items-center justify-end">
                  <Link href={`/campaigns/${campaign.id}`}>
                    <Button size="sm" variant="outline">
                      View Campaign
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
