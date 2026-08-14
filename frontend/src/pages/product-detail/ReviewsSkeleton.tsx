/**
 * ReviewsSkeleton - Skeleton loading برای ReviewsTab
 * مطابق Design System ازکالا (بخش ۱: Skeleton)
 * 
 * نمایش لودینگ هنگام بارگذاری lazy ReviewsTab
 */

export default function ReviewsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse font-sans">
      {/* Rating Summary Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl h-32" />
        <div className="md:col-span-2 bg-gray-100 dark:bg-gray-800 rounded-xl h-32" />
      </div>

      {/* Reviews List Skeleton */}
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="flex-1">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1" />
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            </div>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1.5" />
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}