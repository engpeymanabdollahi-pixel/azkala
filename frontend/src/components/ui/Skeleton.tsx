import { cn } from '@/utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'image';
}

export function Skeleton({ className, variant = 'text' }: SkeletonProps) {
  const baseStyles = "animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md";
  
  const variants = {
    text: "h-4 w-full",
    circular: "rounded-full",
    rectangular: "h-20 w-full",
    image: "h-48 w-full object-cover",
  };

  return (
    <div 
      className={cn(baseStyles, variants[variant], className)} 
      aria-hidden="true"
    />
  );
}