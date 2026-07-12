import type { User, PhoneModel, PhoneSeries, Brand, CartItem, Category } from './models';
// ==================== Auth Store ====================

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  updateProfile: (data: Partial<User>) => void;
}

export type AuthStore = AuthState & AuthActions;

// ==================== Model Store ====================

export interface ModelState {
  selectedBrand: Brand | null;
  selectedSeries: PhoneSeries | null;
  selectedModel: PhoneModel | null;
  selectedCategory: Category | null;
  isModalOpen: boolean;
}

export interface ModelActions {
  setSelectedBrand: (brand: Brand | null) => void;
  setSelectedSeries: (series: PhoneSeries | null) => void;
  setSelectedModel: (model: PhoneModel | null) => void;
  setCurrentCategory: (category: Category | null) => void;
  clearSelection: () => void;
  openModal: () => void;
  closeModal: () => void;
  hasSelectedModel: () => boolean;
}

export type ModelStore = ModelState & ModelActions;

// ==================== Cart Store ====================

export interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
  isLoading: boolean;
}

export interface CartActions {
  addItem: (product: CartItem['product'], quantity: number) => void;
  removeItem: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  getItemsCount: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
}

export type CartStore = CartState & CartActions;

// ==================== UI Store ====================

export interface UIState {
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  theme: 'light' | 'dark';
}

export interface UIActions {
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleSearch: () => void;
  closeSearch: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export type UIStore = UIState & UIActions;
