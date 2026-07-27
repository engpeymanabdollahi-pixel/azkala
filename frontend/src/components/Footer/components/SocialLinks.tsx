export function SocialLinks({ settings }: { settings?: any }) {
  const links = [
    {
      // آیکون اینستاگرام (SVG مستقیم - بدون نیاز به lucide-react)
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
        </svg>
      ),
      url: settings?.instagram_url || '#',
      label: 'اینستاگرام',
      active: !!settings?.instagram_url
    },
    {
      // آیکون تلگرام (SVG مستقیم)
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m22 2-7 20-4-9-9-4Z"/>
          <path d="M22 2 11 13"/>
        </svg>
      ),
      url: settings?.telegram_url || '#',
      label: 'تلگرام',
      active: !!settings?.telegram_url
    },
    {
      // آیکون توییتر/X (SVG مستقیم)
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
        </svg>
      ),
      url: settings?.twitter_url || '#',
      label: 'توییتر (X)',
      active: !!settings?.twitter_url
    },
  ];

  return (
    <div className="flex items-center gap-3">
      {links.map((link, idx) =>
        link.active ? (
          <a
            key={idx}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 bg-gray-800 hover:bg-primary-600 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300 hover:-translate-y-1"
            aria-label={link.label}
          >
            {link.icon}
          </a>
        ) : null
      )}
    </div>
  );
}