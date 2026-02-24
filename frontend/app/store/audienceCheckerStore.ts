import { create } from "zustand";
import {
  apiService,
  AudienceChecker,
  CreateCheckerDto,
  UpdateCheckerDto,
  Rule,
  CreateRuleDto,
} from "@/app/services/api";

interface AudienceCheckerState {
  checkers: AudienceChecker[];
  selectedChecker: AudienceChecker | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCheckersByCampaign: (campaignId: string) => Promise<void>;
  fetchChecker: (id: string) => Promise<void>;
  createChecker: (data: CreateCheckerDto) => Promise<AudienceChecker>;
  updateChecker: (
    id: string,
    data: UpdateCheckerDto
  ) => Promise<AudienceChecker>;
  deleteChecker: (id: string) => Promise<void>;
  addRule: (checkerId: string, data: CreateRuleDto) => Promise<Rule>;
  deleteRule: (ruleId: string, checkerId: string) => Promise<void>;
  setSelectedChecker: (checker: AudienceChecker | null) => void;
  clearCheckers: () => void;
  clearError: () => void;
}

export const useAudienceCheckerStore = create<AudienceCheckerState>(
  (set, get) => ({
    checkers: [],
    selectedChecker: null,
    isLoading: false,
    error: null,

    fetchCheckersByCampaign: async (campaignId: string) => {
      set({ isLoading: true, error: null });
      try {
        const checkers = await apiService.getCheckersByCampaign(campaignId);
        set({ checkers, isLoading: false });
      } catch (error) {
        set({
          error:
            error instanceof Error ? error.message : "Failed to fetch checkers",
          isLoading: false,
        });
      }
    },

    fetchChecker: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        const checker = await apiService.getChecker(id);
        set({ selectedChecker: checker, isLoading: false });
      } catch (error) {
        set({
          error:
            error instanceof Error ? error.message : "Failed to fetch checker",
          isLoading: false,
        });
      }
    },

    createChecker: async (data: CreateCheckerDto) => {
      set({ isLoading: true, error: null });
      try {
        const checker = await apiService.createChecker(data);
        set((state) => ({
          checkers: [...state.checkers, checker],
          isLoading: false,
        }));
        return checker;
      } catch (error) {
        set({
          error:
            error instanceof Error ? error.message : "Failed to create checker",
          isLoading: false,
        });
        throw error;
      }
    },

    updateChecker: async (id: string, data: UpdateCheckerDto) => {
      set({ isLoading: true, error: null });
      try {
        const checker = await apiService.updateChecker(id, data);
        set((state) => ({
          checkers: state.checkers.map((c) => (c.id === id ? checker : c)),
          selectedChecker:
            state.selectedChecker?.id === id ? checker : state.selectedChecker,
          isLoading: false,
        }));
        return checker;
      } catch (error) {
        set({
          error:
            error instanceof Error ? error.message : "Failed to update checker",
          isLoading: false,
        });
        throw error;
      }
    },

    deleteChecker: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        await apiService.deleteChecker(id);
        set((state) => ({
          checkers: state.checkers.filter((c) => c.id !== id),
          selectedChecker:
            state.selectedChecker?.id === id ? null : state.selectedChecker,
          isLoading: false,
        }));
      } catch (error) {
        set({
          error:
            error instanceof Error ? error.message : "Failed to delete checker",
          isLoading: false,
        });
        throw error;
      }
    },

    addRule: async (checkerId: string, data: CreateRuleDto) => {
      set({ isLoading: true, error: null });
      try {
        const rule = await apiService.addRule(checkerId, data);
        set((state) => ({
          checkers: state.checkers.map((c) =>
            c.id === checkerId ? { ...c, rules: [...(c.rules || []), rule] } : c
          ),
          selectedChecker:
            state.selectedChecker?.id === checkerId
              ? {
                  ...state.selectedChecker,
                  rules: [...(state.selectedChecker.rules || []), rule],
                }
              : state.selectedChecker,
          isLoading: false,
        }));
        return rule;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : "Failed to add rule",
          isLoading: false,
        });
        throw error;
      }
    },

    deleteRule: async (ruleId: string, checkerId: string) => {
      set({ isLoading: true, error: null });
      try {
        await apiService.deleteRule(ruleId);
        set((state) => ({
          checkers: state.checkers.map((c) =>
            c.id === checkerId
              ? { ...c, rules: (c.rules || []).filter((r) => r.id !== ruleId) }
              : c
          ),
          selectedChecker:
            state.selectedChecker?.id === checkerId
              ? {
                  ...state.selectedChecker,
                  rules: (state.selectedChecker.rules || []).filter(
                    (r) => r.id !== ruleId
                  ),
                }
              : state.selectedChecker,
          isLoading: false,
        }));
      } catch (error) {
        set({
          error:
            error instanceof Error ? error.message : "Failed to delete rule",
          isLoading: false,
        });
        throw error;
      }
    },

    setSelectedChecker: (checker: AudienceChecker | null) => {
      set({ selectedChecker: checker });
    },

    clearCheckers: () => {
      set({ checkers: [], selectedChecker: null });
    },

    clearError: () => {
      set({ error: null });
    },
  })
);
