import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ModelStore } from '@/types/store';

export const useModelStore = create<ModelStore>()(
  persist(
    (set, get) => ({
      selectedBrand: null,
      selectedSeries: null,
      selectedModel: null,
      selectedCategory: null, // ✅ اضافه شد
      isModalOpen: false,

      setSelectedBrand: (brand) => {
        set({
          selectedBrand: brand,
          selectedSeries: null,
          selectedModel: null,
        });
      },

      setSelectedSeries: (series) => {
        set({
          selectedSeries: series,
          selectedModel: null,
        });
      },

      setSelectedModel: (model) => {
        set({
          selectedModel: model,
          isModalOpen: false,
        });
      },

      // ✅ تابع جدید اضافه شد
      setCurrentCategory: (category) => {
        set({ selectedCategory: category });
      },

      clearSelection: () => {
        set({
          selectedBrand: null,
          selectedSeries: null,
          selectedModel: null,
          selectedCategory: null, // ✅ اضافه شد
        });
      },

      openModal: () => set({ isModalOpen: true }),
      closeModal: () => set({ isModalOpen: false }),

      hasSelectedModel: () => get().selectedModel !== null,
    }),
    {
      name: 'azkala-model-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedBrand: state.selectedBrand,
        selectedSeries: state.selectedSeries,
        selectedModel: state.selectedModel,
        selectedCategory: state.selectedCategory, // ✅ اضافه شد
      }),
    }
  )
);