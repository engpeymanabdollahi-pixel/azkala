import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UseSearchReturn, SearchHistoryItem } from '../types';
import { POPULAR_SUGGESTIONS, SEARCH_HISTORY_LIMIT } from '../constants';

const SEARCH_HISTORY_KEY = 'searchHistory';

export function useSearch(): UseSearchReturn {
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Sync localStorage when history changes
  useEffect(() => {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));
  }, [searchHistory]);

  // Smart suggestions based on history
  const smartSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchHistory
      .filter(item => item.query.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 5)
      .map(item => item.query);
  }, [searchQuery, searchHistory]);

  // Save search to history (with functional update to avoid stale state)
  const saveSearchToHistory = useCallback((query: string) => {
    if (!query.trim()) return;

    setSearchHistory(prev => {
      const existingIndex = prev.findIndex(item => item.query === query);
      
      let updated: SearchHistoryItem[];
      
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          count: updated[existingIndex].count + 1,
          timestamp: Date.now()
        };
      } else {
        const newItem: SearchHistoryItem = {
          query,
          timestamp: Date.now(),
          count: 1
        };
        updated = [newItem, ...prev].slice(0, SEARCH_HISTORY_LIMIT);
      }
      
      return updated;
    });
  }, []);

  // Core search function (separated from keyboard handler)
  const performSearch = useCallback(() => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    saveSearchToHistory(searchQuery);
    
    const categoryParam = selectedCategory !== 'all' ? `&category=${selectedCategory}` : '';
    navigate(`/products?search=${encodeURIComponent(searchQuery)}${categoryParam}`);
    
    setSearchQuery('');
    setIsSearchFocused(false);
    
    setTimeout(() => setIsSearching(false), 500);
  }, [searchQuery, selectedCategory, navigate, saveSearchToHistory]);

  // Keyboard handler
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  }, [performSearch]);

  // Suggestion click handler
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setSearchQuery(suggestion);
    saveSearchToHistory(suggestion);
    
    const categoryParam = selectedCategory !== 'all' ? `&category=${selectedCategory}` : '';
    navigate(`/products?search=${encodeURIComponent(suggestion)}${categoryParam}`);
    
    setSearchQuery('');
    setIsSearchFocused(false);
  }, [selectedCategory, navigate, saveSearchToHistory]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // ✅ قبلاً searchHistory محاسبه و در localStorage ذخیره می‌شد ولی هیچ
  // کامپوننتی آن را واقعاً نمایش نمی‌داد (فقط نسخه‌ی فیلترشده‌اش،
  // smartSuggestions، که فقط وقتی کاربر چیزی تایپ کرده باشد پر می‌شود) —
  // یعنی کاربر با فوکوس روی جستجوی خالی هیچ‌وقت تاریخچه‌ی واقعی خودش را
  // نمی‌دید. حالا که SearchBar آن را نمایش می‌دهد، یک راه برای پاک کردنش
  // هم لازم است.
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    isSearchFocused,
    setIsSearchFocused,
    selectedCategory,
    setSelectedCategory,
    searchHistory,
    smartSuggestions,
    isSearching,
    performSearch,
    handleSearchKeyDown,
    handleSuggestionClick,
    clearSearch,
    clearSearchHistory
  };
}

// Export popular suggestions separately
export { POPULAR_SUGGESTIONS };