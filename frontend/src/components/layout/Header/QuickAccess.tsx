import { memo } from 'react';
import { MessageCircle, Phone, ArrowUp, Zap } from 'lucide-react';
import { cn } from '@/utils/cn';
import { SUPPORT_PHONE } from './constants';

interface QuickAccessProps {
  isOpen: boolean;
  onToggle: () => void;
  onChatClick: () => void;
}

export const QuickAccess = memo(({ isOpen, onToggle, onChatClick }: QuickAccessProps) => {
  const handleCallClick = () => {
    window.open(`tel:${SUPPORT_PHONE}`, '_self');
  };

  const handleTopClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed bottom-6 left-6 z-50" role="navigation" aria-label="دسترسی سریع">
      {/* Action Buttons */}
      <div
        className={cn(
          'flex flex-col gap-3 mb-3 transition-all duration-300',
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
        aria-hidden={!isOpen}
      >
        <button
          onClick={onChatClick}
          className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          aria-label="چت آنلاین"
          tabIndex={isOpen ? 0 : -1}
        >
          <MessageCircle className="w-5 h-5" />
        </button>
        
        <button
          onClick={handleCallClick}
          className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-success-500 focus:ring-offset-2"
          aria-label="تماس تلفنی"
          tabIndex={isOpen ? 0 : -1}
        >
          <Phone className="w-5 h-5" />
        </button>
        
        <button
          onClick={handleTopClick}
          className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2"
          aria-label="بازگشت به بالا"
          tabIndex={isOpen ? 0 : -1}
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </div>

      {/* Main Toggle Button */}
      <button
        onClick={onToggle}
        className={cn(
          'w-14 h-14 bg-gradient-to-br from-primary-600 to-accent-600 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          isOpen && 'rotate-45'
        )}
        aria-label={isOpen ? 'بستن دسترسی سریع' : 'باز کردن دسترسی سریع'}
        aria-expanded={isOpen}
      >
        <Zap className="w-6 h-6" />
      </button>
    </div>
  );
});

QuickAccess.displayName = 'QuickAccess';