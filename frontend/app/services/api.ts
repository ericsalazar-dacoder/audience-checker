/**
 * API Service - Handles all HTTP requests to the backend
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data: ApiResponse<T> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || "An error occurred");
      }

      return data.data as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error occurred");
    }
  }

  // Campaign endpoints
  async getCampaigns(): Promise<Campaign[]> {
    return this.request<Campaign[]>("/campaigns");
  }

  async getCampaign(id: string): Promise<Campaign> {
    return this.request<Campaign>(`/campaigns/${id}`);
  }

  async createCampaign(data: CreateCampaignDto): Promise<Campaign> {
    return this.request<Campaign>("/campaigns", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCampaign(id: string, data: UpdateCampaignDto): Promise<Campaign> {
    return this.request<Campaign>(`/campaigns/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCampaign(id: string): Promise<void> {
    return this.request<void>(`/campaigns/${id}`, {
      method: "DELETE",
    });
  }

  // Audience Checker endpoints
  async getCheckersByCampaign(campaignId: string): Promise<AudienceChecker[]> {
    return this.request<AudienceChecker[]>(`/campaigns/${campaignId}/checkers`);
  }

  async getChecker(id: string): Promise<AudienceChecker> {
    return this.request<AudienceChecker>(`/checkers/${id}`);
  }

  async createChecker(data: CreateCheckerDto): Promise<AudienceChecker> {
    return this.request<AudienceChecker>("/checkers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateChecker(
    id: string,
    data: UpdateCheckerDto
  ): Promise<AudienceChecker> {
    return this.request<AudienceChecker>(`/checkers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteChecker(id: string): Promise<void> {
    return this.request<void>(`/checkers/${id}`, {
      method: "DELETE",
    });
  }

  // Rules endpoints
  async addRule(checkerId: string, data: CreateRuleDto): Promise<Rule> {
    return this.request<Rule>(`/checkers/${checkerId}/rules`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteRule(ruleId: string): Promise<void> {
    return this.request<void>(`/rules/${ruleId}`, {
      method: "DELETE",
    });
  }
}

// Types
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  campaignType?: string;
  jbpmId?: string;
  activeFlag: boolean;
  lockedFlag: boolean;
  createdAt: string;
  updatedAt: string;
  checkerCount?: number;
}

export interface AudienceChecker {
  id: string;
  campaignId: string;
  name: string;
  query?: string;
  rules?: Rule[];
  alignmentReport?: AlignmentReportDto;
  status: "pending" | "active" | "inactive" | "completed";
  alignmentStatus?: string;
  lastChecked?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlignmentReportDto {
  alignmentPercentage: number;
  totalConditions: number;
  matched: AlignmentMatchDto[];
  unmatched: AlignmentMatchDto[];
  extra: AlignmentMatchDto[];
}

export interface AlignmentMatchDto {
  table: string;
  column: string;
  condition?: string;
  expected?: string;
}

export interface Rule {
  id: string;
  checkerId: string;
  field: string;
  operator: string;
  value?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignDto {
  name: string;
  description?: string;
  campaignType?: string;
  jbpmId?: string;
}

export interface UpdateCampaignDto {
  name?: string;
  description?: string;
  campaignType?: string;
  jbpmId?: string;
  activeFlag?: boolean;
  lockedFlag?: boolean;
}

export interface CreateCheckerDto {
  campaignId: string;
  name: string;
  query?: string;
  rules?: Rule[];
  alignmentReport?: AlignmentReportDto;
}

export interface UpdateCheckerDto {
  name?: string;
  query?: string;
  rules?: Rule[];
  alignmentReport?: AlignmentReportDto;
  status?: "pending" | "active" | "inactive" | "completed";
  alignmentStatus?: string;
}

export interface CreateRuleDto {
  field: string;
  operator: string;
  value?: string;
}

export const apiService = new ApiService();
