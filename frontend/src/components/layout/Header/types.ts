// ==================== Header Types ====================

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  count: number;
}

export interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  name: string;
  path: string;
  icon: string;
}

export interface SearchCategory {
  id: string;
  name: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: React.ReactNode;
  iconColor: string;
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  badge?: string;
}

export interface MobileMenuItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export interface SecondaryMenuItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface UserData {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'seller' | 'admin';
  avatar?: string;
}

export interface ModelData {
  id: number;
  name: string;
  slug: string;
}

// ==================== Hook Types ====================

export interface UseDarkModeReturn {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export interface UseScrollSpyReturn {
  isScrolled: boolean;
  scrollDirection: 'up' | 'down';
}

export interface UseSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchFocused: boolean;
  setIsSearchFocused: (focused: boolean) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  searchHistory: SearchHistoryItem[];
  smartSuggestions: string[];
  isSearching: boolean;
  performSearch: () => void;
  handleSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleSuggestionClick: (suggestion: string) => void;
  clearSearch: () => void;
}

export interface UseVoiceSearchReturn {
  isListening: boolean;
  isSupported: boolean;
  toggleVoiceSearch: () => void;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
}