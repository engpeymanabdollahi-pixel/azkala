import { Helmet } from 'react-helmet-async';

interface DynamicMetaProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
}

export const DynamicMeta = ({ 
  title, 
  description, 
  image = '/images/placeholder.png', 
  url = window.location.href,
  type = 'product'
}: DynamicMetaProps) => {
  // اطمینان از اینکه عنوان همیشه شامل نام برند باشد
  const fullTitle = `${title} | ازکالا`;

  return (
    <Helmet>
      {/* تگ‌های پایه */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
    </Helmet>
  );
};