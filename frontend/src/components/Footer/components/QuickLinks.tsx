import { QUICK_LINKS } from '../constants';

interface QuickLinksProps {
  onNavigate: (path: string) => void;
}

export function QuickLinks({ onNavigate }: QuickLinksProps) {
  return (
    <div>
      <h3 className="font-bold text-white mb-5 text-lg flex items-center gap-2">
        <span className="w-1 h-6 bg-gradient-to-b from-primary-500 to-accent-500 rounded-full"></span>
        دسترسی سریع
      </h3>
      <ul className="space-y-3">
        {QUICK_LINKS.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => onNavigate(item.id)}
              className="text-sm text-gray-400 hover:text-primary-400 transition-all duration-200 flex items-center gap-2 group"
            >
              <span className="w-1.5 h-1.5 bg-gray-600 rounded-full group-hover:bg-primary-400 group-hover:scale-150 transition-all"></span>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}