import { Helmet } from 'react-helmet-async';
import { SITE_CONFIG, SEO_DEFAULTS, getFullUrl } from '@/lib/seo-config';

export interface SeoProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  noindex?: boolean;
  nofollow?: boolean;
  keywords?: string[];
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  // Open Graph
  ogTitle?: string;
  ogDescription?: string;
  // Twitter
  twitterCard?: 'summary' | 'summary_large_image';
  // JSON-LD
  jsonLd?: Record<string, any> | Record<string, any>[];
  // Prev/Next برای pagination
  prev?: string;
  next?: string;
}

export default function Seo({
  title,
  description = SEO_DEFAULTS.defaultDescription,
  canonical,
  image = SITE_CONFIG.defaultImage,
  type = 'website',
  noindex = false,
  nofollow = false,
  keywords = [],
  publishedTime,
  modifiedTime,
  author,
  section,
  tags = [],
  ogTitle,
  ogDescription,
  twitterCard = 'summary_large_image',
  jsonLd,
  prev,
  next,
}: SeoProps) {
  const fullTitle = title 
    ? `${title} | ازکالا` 
    : SEO_DEFAULTS.defaultTitle;
  
  const fullDescription = description || SEO_DEFAULTS.defaultDescription;
  const fullImage = image.startsWith('http') ? image : getFullUrl(image);
  const canonicalUrl = canonical ? getFullUrl(canonical) : undefined;

  // ساخت JSON-LD ترکیبی
  const jsonLdArray = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
  
  // همیشه Organization schema را اضافه کن
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: getFullUrl('/icons/icon-512.png'),
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+98-21-00000000',
      contactType: 'customer service',
      availableLanguage: ['Persian', 'English'],
    },
  };

  const allJsonLd = [organizationSchema, ...jsonLdArray];

  return (
    <Helmet>
      {/* Basic Meta */}
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      
      {/* Robots */}
      <meta 
        name="robots" 
        content={`${noindex ? 'noindex' : 'index'},${nofollow ? 'nofollow' : 'follow'}`} 
      />

      {/* Canonical */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Pagination */}
      {prev && <link rel="prev" href={getFullUrl(prev)} />}
      {next && <link rel="next" href={getFullUrl(next)} />}

      {/* Language */}
      <html lang="fa" dir="rtl" />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={ogTitle || fullTitle} />
      <meta property="og:description" content={ogDescription || fullDescription} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:alt" content={title || SITE_CONFIG.name} />
      <meta property="og:site_name" content={SITE_CONFIG.name} />
      <meta property="og:locale" content={SITE_CONFIG.locale} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      
      {/* Article-specific OG */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      {type === 'article' && section && (
        <meta property="article:section" content={section} />
      )}
      {tags.map((tag) => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={ogTitle || fullTitle} />
      <meta name="twitter:description" content={ogDescription || fullDescription} />
      <meta name="twitter:image" content={fullImage} />
      {SITE_CONFIG.twitterHandle && (
        <meta name="twitter:site" content={SITE_CONFIG.twitterHandle} />
      )}

      {/* JSON-LD Structured Data */}
      {allJsonLd.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}