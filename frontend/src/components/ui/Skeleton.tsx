import { cn } from '@/utils/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circle' | 'rect' | 'image' | 'title';
  width?: string;
  height?: string;
  delay?: number;
}

export function Skeleton({ 
  variant = 'text',
  width,
  height,
  delay = 0,
  className,
  ...props 
}: SkeletonProps) {
  const baseStyles = 'overflow-hidden bg-gray-200 dark:bg-gray-700 animate-pulse';
  
  const variants = {
    text: 'rounded-md h-4',
    circle: 'rounded-full',
    rect: 'rounded-md',
    image: 'rounded-lg',
    title: 'rounded-lg h-6',
  };

  const style: React.CSSProperties = {
    width,
    height: !height && variant === 'text' ? undefined : height,
    animationDelay: `${delay}ms`,
  };

  return (
    <div
      className={cn(baseStyles, variants[variant], className)}
      style={style}
      {...props}
    />
  );
}
