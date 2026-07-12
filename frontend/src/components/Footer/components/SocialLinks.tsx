import { SOCIAL_LINKS } from '../constants';

export function SocialLinks() {
  return (
    <div className="flex items-center gap-2">
      {SOCIAL_LINKS.map((social) => (
        <a
          key={social.name}
          href="#"
          aria-label={social.ariaLabel}
          className={`w-10 h-10 bg-gradient-to-br ${social.color} rounded-xl flex items-center justify-center hover:scale-110 hover:shadow-lg transition-all duration-300`}
        >
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d={social.icon} />
          </svg>
        </a>
      ))}
    </div>
  );
}