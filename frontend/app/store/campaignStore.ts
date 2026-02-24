import { create } from "zustand";
import {
  apiService,
  Campaign,
  CreateCampaignDto,
  UpdateCampaignDto,
} from "@/app/services/api";

interface CampaignState {
  campaigns: Campaign[];
  selectedCampaign: Campaign | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCampaigns: () => Promise<void>;
  fetchCampaign: (id: string) => Promise<void>;
  createCampaign: (data: CreateCampaignDto) => Promise<Campaign>;
  updateCampaign: (id: string, data: UpdateCampaignDto) => Promise<Campaign>;
  deleteCampaign: (id: string) => Promise<void>;
  setSelectedCampaign: (campaign: Campaign | null) => void;
  clearError: () => void;
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  selectedCampaign: null,
  isLoading: false,
  error: null,

  fetchCampaigns: async () => {
    set({ isLoading: true, error: null });
    try {
      const campaigns = await apiService.getCampaigns();
      set({ campaigns, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch campaigns",
        isLoading: false,
      });
    }
  },

  fetchCampaign: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const campaign = await apiService.getCampaign(id);
      set({ selectedCampaign: campaign, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch campaign",
        isLoading: false,
      });
    }
  },

  createCampaign: async (data: CreateCampaignDto) => {
    set({ isLoading: true, error: null });
    try {
      const campaign = await apiService.createCampaign(data);
      set((state) => ({
        campaigns: [...state.campaigns, campaign],
        isLoading: false,
      }));
      return campaign;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to create campaign",
        isLoading: false,
      });
      throw error;
    }
  },

  updateCampaign: async (id: string, data: UpdateCampaignDto) => {
    set({ isLoading: true, error: null });
    try {
      const campaign = await apiService.updateCampaign(id, data);
      set((state) => ({
        campaigns: state.campaigns.map((c) => (c.id === id ? campaign : c)),
        selectedCampaign:
          state.selectedCampaign?.id === id ? campaign : state.selectedCampaign,
        isLoading: false,
      }));
      return campaign;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to update campaign",
        isLoading: false,
      });
      throw error;
    }
  },

  deleteCampaign: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiService.deleteCampaign(id);
      set((state) => ({
        campaigns: state.campaigns.filter((c) => c.id !== id),
        selectedCampaign:
          state.selectedCampaign?.id === id ? null : state.selectedCampaign,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to delete campaign",
        isLoading: false,
      });
      throw error;
    }
  },

  setSelectedCampaign: (campaign: Campaign | null) => {
    set({ selectedCampaign: campaign });
  },

  clearError: () => {
    set({ error: null });
  },
}));
