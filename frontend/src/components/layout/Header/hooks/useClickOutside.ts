import { useEffect, type RefObject } from 'react';

export function useClickOutside(
  refs: RefObject<HTMLElement | null>[],
  handler: () => void
): void {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      const isOutsideAll = refs.every(ref => 
        !ref.current || !ref.current.contains(target)
      );

      if (isOutsideAll) {
        handler();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [refs, handler]);
}