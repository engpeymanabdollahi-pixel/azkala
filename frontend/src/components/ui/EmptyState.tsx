import React from 'react';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in',
      className
    )}>
      {icon && (
        <div className="w-24 h-24 bg-gradient-to-br from-primary-50 to-primary-100 rounded-full flex items-center justify-center mb-6 text-primary-500 animate-float">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 text-sm max-w-md mb-8 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div className="animate-slide-up">
          {action}
        </div>
      )}
    </div>
  );
}