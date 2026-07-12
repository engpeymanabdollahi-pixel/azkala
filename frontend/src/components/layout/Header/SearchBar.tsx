import { memo, useRef } from 'react';
import { Search, X, Mic, MicOff, Clock, TrendingUp, ArrowLeft, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useSearch, POPULAR_SUGGESTIONS } from './hooks/useSearch';
import { useVoiceSearch } from './hooks/useVoiceSearch';
import { SEARCH_CATEGORIES } from './constants';
import type { ModelData } from './types';

interface SearchBarProps {
  isScrolled: boolean;
  selectedModel: ModelData | null;
  isMobile?: boolean;
}

export const SearchBar = memo(({ isScrolled, selectedModel, isMobile = false }: SearchBarProps) => {
  const {
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
    clearSearch
  } = useSearch();

  const { isListening, isSupported, toggleVoiceSearch } = useVoiceSearch(setSearchQuery);
  const searchRef = useRef<HTMLDivElement>(null);

  const placeholder = selectedModel
    ? `جستجو در لوازم جانبی ${selectedModel.name}...`
    : 'جستجو در هزاران محصول...';

  return (
    <div ref={searchRef} className={cn('relative', isMobile ? 'w-full' : 'hidden md:flex flex-1 max-w-3xl mx-4')}>
      <div
        className={cn(
          'relative w-full flex items-stretch transition-all duration-300 rounded-2xl overflow-hidden',
          'border-2 bg-gray-50 dark:bg-slate-800',
          isSearchFocused
            ? 'border-primary-500 ring-4 ring-primary-100 dark:ring-primary-900 scale-[1.01]'
            : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
        )}
      >
        {/* Category Select - Desktop Only */}
        {!isScrolled && !isMobile && (
          <div className="relative flex-shrink-0 hidden lg:block">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={cn(
                'h-full bg-transparent dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:outline-none appearance-none cursor-pointer border-l-2 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white',
                isScrolled ? 'px-3 text-xs min-w-[100px]' : 'px-4 text-sm min-w-[140px]'
              )}
              aria-label="انتخاب دسته‌بندی جستجو"
            >
              {SEARCH_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        )}

        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden="true" />
          
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onKeyDown={handleSearchKeyDown}
            className={cn(
              'w-full bg-transparent focus:bg-white dark:focus:bg-slate-700 focus:outline-none transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500',
              isScrolled || isMobile ? 'pr-12 pl-20 py-2 text-sm' : 'pr-12 pl-12 py-3 text-sm'
            )}
            aria-label="جستجوی محصول"
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            aria-expanded={isSearchFocused}
            autoComplete="off"
          />

          {/* Clear Button */}
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute left-16 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="پاک کردن جستجو"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Voice Search Button */}
          {isSupported && (
            <button
              onClick={toggleVoiceSearch}
              className={cn(
                'absolute left-10 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary-500',
                isListening
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse'
                  : 'hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              )}
              aria-label={isListening ? 'توقف جستجوی صوتی' : 'شروع جستجوی صوتی'}
              aria-pressed={isListening}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}

          {/* Search Suggestions Dropdown */}
          {isSearchFocused && (
            <div
              id="search-suggestions"
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 py-2 z-30 animate-slide-down overflow-hidden"
              role="listbox"
              aria-label="پیشنهادات جستجو"
            >
              {/* Smart Suggestions */}
              {smartSuggestions.length > 0 && (
                <>
                  <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-primary-50 to-white dark:from-primary-900/20 dark:to-slate-800 flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary-500" />
                      جستجوهای قبلی شما
                    </p>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {smartSuggestions.map((suggestion, index) => (
                      <button
                        key={`history-${index}`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-2.5 text-right text-sm text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-3 group focus:outline-none focus:bg-primary-50 dark:focus:bg-primary-900/20"
                        role="option"
                        aria-selected={false}
                      >
                        <div className="w-8 h-8 bg-gray-100 dark:bg-slate-700 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 rounded-lg flex items-center justify-center transition-colors flex-shrink-0">
                          <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                        </div>
                        <span className="flex-1 text-right">{suggestion}</span>
                        <ArrowLeft className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Popular Suggestions */}
              {searchQuery.length === 0 && (
                <>
                  <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-primary-50 to-white dark:from-primary-900/20 dark:to-slate-800 flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-primary-500" />
                      جستجوهای پرطرفدار
                    </p>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">این هفته</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {POPULAR_SUGGESTIONS.map((suggestion, index) => (
                      <button
                        key={`popular-${index}`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-2.5 text-right text-sm text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-3 group focus:outline-none focus:bg-primary-50 dark:focus:bg-primary-900/20"
                        role="option"
                        aria-selected={false}
                      >
                        <div className="w-8 h-8 bg-gray-100 dark:bg-slate-700 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 rounded-lg flex items-center justify-center transition-colors flex-shrink-0">
                          <span className="text-xs font-black text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                            {index + 1}
                          </span>
                        </div>
                        <span className="flex-1 text-right">{suggestion}</span>
                        <ArrowLeft className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Search Button */}
        <button
          onClick={performSearch}
          className="px-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 transition-all flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
          aria-label="انجام جستجو"
          disabled={isSearching}
        >
          {isSearching ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" role="status">
              <span className="sr-only">در حال جستجو...</span>
            </div>
          ) : (
            <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>
    </div>
  );
});

SearchBar.displayName = 'SearchBar';