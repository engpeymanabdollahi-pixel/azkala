import apiClient from './client';
import { fetchCsrfCookie } from './client';

export interface AiGenerateRequest {
  topic: string;
  category?: 'news' | 'review' | 'comparison' | 'guide' | 'rumor';
}

export interface AiGenerateResponse {
  success: boolean;
  data: {
    title: string;
    excerpt: string;
    content: string;
    suggested_category: string;
    mock?: boolean;
  };
  message: string;
}

export interface AiRewriteRequest {
  content: string;
}

export interface AiRewriteResponse {
  success: boolean;
  data: {
    content: string;
    is_rewritten: boolean;
    mock?: boolean;
  };
  message: string;
}

export interface AiSuggestTitleRequest {
  content: string;
}

export interface AiSuggestTitleResponse {
  success: boolean;
  data: {
    titles: string[];
    mock?: boolean;
  };
  message: string;
}

export const aiArticleService = {
  async generate(data: AiGenerateRequest): Promise<AiGenerateResponse> {
    await fetchCsrfCookie();
    const response = await apiClient.post<AiGenerateResponse>('/admin/magazine/ai/generate', data);
    return response.data;
  },

  async rewrite(data: AiRewriteRequest): Promise<AiRewriteResponse> {
    await fetchCsrfCookie();
    const response = await apiClient.post<AiRewriteResponse>('/admin/magazine/ai/rewrite', data);
    return response.data;
  },

  async suggestTitle(data: AiSuggestTitleRequest): Promise<AiSuggestTitleResponse> {
    await fetchCsrfCookie();
    const response = await apiClient.post<AiSuggestTitleResponse>('/admin/magazine/ai/suggest-title', data);
    return response.data;
  },
};