import { cn } from '@/utils/cn';

interface ProductCardSkeletonProps {
  variant?: 'grid' | 'list';
  className?: string;
}

export function ProductCardSkeleton({ 
  variant = 'grid',
  className 
}: ProductCardSkeletonProps) {
  if (variant === 'list') {
    return (
      <div className={cn(
        'flex bg-white rounded-2xl border border-gray-200 overflow-hidden',
        className
      )}>
        <div className="w-32 h-32 skeleton flex-shrink-0" />
        <div className="flex-1 p-3 flex flex-col gap-2">
          <div className="h-3 skeleton w-20" />
          <div className="h-4 skeleton w-full" />
          <div className="h-3 skeleton w-16" />
          <div className="flex items-center justify-between mt-2">
            <div className="h-5 skeleton w-24" />
            <div className="h-8 skeleton w-20 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200',
      className
    )}>
      <div className="aspect-square skeleton" />
      <div className="p-4 flex flex-col gap-2">
        <div className="h-3 skeleton w-24" />
        <div className="h-4 skeleton w-full" />
        <div className="h-4 skeleton w-3/4" />
        <div className="h-3 skeleton w-20" />
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-3.5 h-3.5 skeleton rounded-full" />
          ))}
        </div>
        <div className="h-6 skeleton w-32 mt-2" />
        <div className="flex items-end justify-between gap-2 pt-3 border-t border-gray-100">
          <div className="flex flex-col gap-1">
            <div className="h-3 skeleton w-16" />
            <div className="h-5 skeleton w-24" />
          </div>
          <div className="h-9 skeleton w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}