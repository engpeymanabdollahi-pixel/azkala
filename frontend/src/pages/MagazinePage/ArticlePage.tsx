import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import Seo from '@/components/Seo';
import {
  generateArticleSchema,
  generateBreadcrumbSchema,
} from '@/lib/seo-schemas';
import {
  Clock, Eye, ExternalLink, ChevronLeft, Smartphone,
  User, ArrowRight, Newspaper,
} from 'lucide-react';
import { useMagazineArticle } from '@/hooks/api/useMagazineApi';
import ArticleCard from '@/components/magazine/ArticleCard';
import { MAGAZINE_CATEGORY_COLORS } from '@/types/magazine.types';
import { cn } from '@/utils/cn';

/**
 * صفحه جزئیات مقاله مجله
 * 
 * Route: /magazine/:slug
 * 
 * Features:
 * - محتوای کامل مقاله
 * - نمایش منبع خارجی
 * - دستگاه‌های مرتبط
 * - مقالات مرتبط
 * - افزایش view_count (در backend)
 */
export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useMagazineArticle(slug);

  const article = data?.data;
  const related = data?.related ?? [];

  // 🧹 حذف تصاویر تکراری از محتوا (تصویر شاخص + اولین تصویر محتوا)
  const cleanContent = useMemo(() => {
    if (!article?.content) return '';
    let html = article.content;
    if (article.featured_image) {
      const escaped = article.featured_image.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      html = html.replace(new RegExp('<img[^>]*src=["\']?' + escaped + '["\']?[^>]*>', 'gi'), '');
      // حذف اولین تصویر باقی‌مانده (معمولاً همان تصویر شاخص تکراری است)
      html = html.replace(/<img[^>]*>/i, '');
    }
    return html;
  }, [article]);

  // Scroll to top when article changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // ============ Loading State ============
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
          <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded w-full" />
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
          <div className="aspect-video bg-gray-200 dark:bg-slate-700 rounded-2xl" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============ Error / Not Found State ============
  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-7xl mb-4">😕</div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
            مقاله یافت نشد
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            ممکن است این مقاله حذف شده یا آدرس اشتباه باشد
          </p>
          <Link
            to="/magazine"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            بازگشت به مجله
          </Link>
        </div>
      </div>
    );
  }

  const categoryColorClass = MAGAZINE_CATEGORY_COLORS[article.category.key];

  // ============ Schema.org (JSON-LD) ============
  const articleJsonLd = [
    generateArticleSchema(article),
    generateBreadcrumbSchema([
      { name: 'خانه', url: '/' },
      { name: 'مجله', url: '/magazine' },
      ...(article.category?.label
        ? [{ name: article.category.label, url: `/magazine?category=${article.category.key}` }]
        : []),
      { name: article.title, url: `/magazine/${article.slug}` },
    ]),
  ];

  // ============ Main Render ============
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Seo
        title={article.title}
        description={article.excerpt || `مقاله ${article.title} در مجله ازکالا`}
        canonical={`/magazine/${article.slug}`}
        image={article.featured_image || undefined}
        type="article"
        publishedTime={article.published_at}
        author={article.author?.name}
        section={article.category?.label}
        keywords={[
          article.title,
          article.category?.label,
          article.source?.name,
          'مجله ازکالا',
          'اخبار فناوری',
        ].filter(Boolean) as string[]}
        jsonLd={articleJsonLd}
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6 flex-wrap">
          <Link to="/" className="hover:text-primary-600 transition-colors">خانه</Link>
          <ChevronLeft className="w-4 h-4" />
          <Link to="/magazine" className="hover:text-primary-600 transition-colors">مجله</Link>
          <ChevronLeft className="w-4 h-4" />
          <Link
            to={`/magazine?category=${article.category.key}`}
            className="hover:text-primary-600 transition-colors"
          >
            {article.category.label}
          </Link>
        </nav>

        {/* Category Badge & Meta */}
        <div className="flex items-center flex-wrap gap-3 mb-4">
          <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-bold', categoryColorClass)}>
            {article.category.label}
          </span>

          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {article.published_at_human}
            </span>
            {article.stats.view_count > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {article.stats.view_count} بازدید
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight mb-4">
          {article.title}
        </h1>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6 border-r-4 border-primary-500 pr-4">
            {article.excerpt}
          </p>
        )}

        {/* Author & Source Info */}
        <div className="flex items-center flex-wrap gap-4 pb-6 border-b border-gray-200 dark:border-slate-700 mb-8">
          {article.author && (
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              </div>
              <span>{article.author.name}</span>
            </div>
          )}

          {article.source.name && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>منبع:</span>
              {article.source.is_external && article.source.url ? (
                <a
                  href={article.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {article.source.name}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span>{article.source.name}</span>
              )}
            </div>
          )}
        </div>

        {/* Featured Image */}
        {article.featured_image && (
          <div className="rounded-2xl overflow-hidden mb-8 shadow-sm">
            <img
              src={article.featured_image}
              alt={article.title}
              className="w-full object-cover max-h-[500px]"
            />
          </div>
        )}

        {/* Content */}
        {article.content && (
          <article
            className="prose prose-lg dark:prose-invert max-w-none 
                       prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
                       prose-p:leading-relaxed prose-p:text-gray-700 dark:prose-p:text-gray-300
                       prose-a:text-primary-600 dark:prose-a:text-primary-400
                       prose-img:rounded-xl prose-img:shadow-sm prose-strong:text-gray-900 dark:prose-strong:text-white"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        )}

        {/* Devices Tags */}
        {article.devices && article.devices.length > 0 && (
          <div className="mt-10 pt-8 border-t border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              دستگاه‌های مرتبط
            </h3>
            <div className="flex flex-wrap gap-2">
              {article.devices.map((device) => (
                <span
                  key={device.id}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-primary-400 transition-colors"
                >
                  <Smartphone className="w-4 h-4 text-primary-500" />
                  {device.name}
                  {device.relevance_score !== undefined && device.relevance_score >= 90 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full font-bold">
                      مرتبط
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

               {/* منبع - نمایش ظریف */}
        {article.source?.is_external && article.source?.url && (
          <div className="mt-8 flex items-center justify-between gap-3 p-4 bg-gray-100 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              این خبر به‌صورت خودکار از <b className="text-gray-700 dark:text-gray-200">{article.source.name}</b> جمع‌آوری شده است.
            </span>
            <a
              href={article.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline whitespace-nowrap font-medium"
            >
              مشاهده در منبع اصلی
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>

      {/* Related Articles */}
      {related.length > 0 && (
        <div className="bg-white dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Newspaper className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              مقالات مرتبط
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.slice(0, 4).map((relArticle) => (
                <ArticleCard key={relArticle.id} article={relArticle} showExcerpt={false} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}