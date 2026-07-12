import type { ComponentType } from 'react';

// ==================== Enums & Types ====================

export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular';
export type LayoutMode = 'grid' | 'list';
export type FilterMode = 'all' | 'my-devices' | 'header-device';

// ==================== Interfaces ====================

export interface PriceRange {
  label: string;
  min: number;
  max: number;
}

export interface SortOptionConfig {
  value: SortOption;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export interface UserDevice {
  id: number;
  phone_model_id: number;
  nickname?: string;
  phone_model?: {
    id: number;
    name: string;
    brand?: { id: number; name: string };
    series?: { id: number; name: string };
  };
}

export interface ProductFilters {
  selectedCategory: number | null;
  searchQuery: string;
  priceRange: [number, number];
  minRating: number;
  onlyDiscounted: boolean;
  onlyInStock: boolean;
  sortBy: SortOption;
  filterMode: FilterMode;
  selectedDeviceIds: number[];
}

export interface FilterState {
  selectedCategory: number | null;
  searchQuery: string;
  priceRange: [number, number];
  minRating: number;
  onlyDiscounted: boolean;
  onlyInStock: boolean;
  sortBy: SortOption;
}