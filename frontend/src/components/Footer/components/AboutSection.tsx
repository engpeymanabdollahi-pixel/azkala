import { Smartphone } from 'lucide-react';
import { SocialLinks } from './SocialLinks';

export function AboutSection() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
          <Smartphone className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-2xl font-black text-primary-400">از</span>
            <span className="text-2xl font-black text-white">کالا</span>
          </div>
          <p className="text-[10px] text-gray-500 font-medium">مارکت‌پلیس لوازم جانبی</p>
        </div>
      </div>
      <p className="text-sm text-gray-400 leading-relaxed mb-5">
        اولین مارکت‌پلیس تخصصی لوازم جانبی موبایل با رویکرد Model-First. فقط محصولات سازگار با گوشی شما را نمایش می‌دهیم.
      </p>
      
      <SocialLinks />
    </div>
  );
}