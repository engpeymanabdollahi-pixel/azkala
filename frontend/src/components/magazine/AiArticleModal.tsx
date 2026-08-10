import { useState } from 'react';
import { Sparkles, Wand2, RefreshCw, X, Loader2, Lightbulb, AlertCircle } from 'lucide-react';
import { aiArticleService } from '@/services/api/aiArticle.service';
import type { AiGenerateResponse } from '@/services/api/aiArticle.service';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

interface AiArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: AiGenerateResponse['data']) => void;
}

const CATEGORIES = [
  { key: 'news', label: 'اخبار', icon: '📰' },
  { key: 'review', label: 'بررسی', icon: '🔍' },
  { key: 'comparison', label: 'مقایسه', icon: '⚖️' },
  { key: 'guide', label: 'راهنما', icon: '📚' },
  { key: 'rumor', label: 'شایعات', icon: '🔮' },
];

export default function AiArticleModal({ isOpen, onClose, onGenerate }: AiArticleModalProps) {
  const [mode, setMode] = useState<'generate' | 'rewrite'>('generate');
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('news');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AiGenerateResponse['data'] | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('موضوع مقاله را وارد کنید');
      return;
    }

    setIsLoading(true);
    try {
      const response = await aiArticleService.generate({
        topic: topic.trim(),
        category: category as any,
      });
      setResult(response.data);
      toast.success(response.message);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'خطا در تولید مقاله');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRewrite = async () => {
    if (!content.trim()) {
      toast.error('محتوایی برای بازنویسی وارد کنید');
      return;
    }

    setIsLoading(true);
    try {
      const response = await aiArticleService.rewrite({ content });
      setContent(response.data.content);
      toast.success(response.message);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'خطا در بازنویسی');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestTitle = async () => {
    const sourceContent = content || result?.content || '';
    if (!sourceContent.trim()) {
      toast.error('ابتدا محتوایی وارد کنید');
      return;
    }

    setIsLoading(true);
    try {
      const response = await aiArticleService.suggestTitle({ content: sourceContent });
      toast.success(`${response.data.titles.length} عنوان پیشنهادی آماده شد`);
      // نمایش عنوان‌ها در alert ساده
      const titlesText = response.data.titles
        .map((t: string, i: number) => `${i + 1}. ${t}`)
        .join('\n');
      alert('عنوان‌های پیشنهادی:\n\n' + titlesText);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'خطا در پیشنهاد عنوان');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseResult = () => {
    if (result) {
      onGenerate(result);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full my-8 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                تولید محتوا با هوش مصنوعی
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                تولید و بازنویسی مقاله با AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
          <button
            onClick={() => { setMode('generate'); setResult(null); }}
            disabled={isLoading}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50',
              mode === 'generate'
                ? 'text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-800 border-b-2 border-purple-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            <Wand2 className="w-4 h-4" />
            تولید مقاله جدید
          </button>
          <button
            onClick={() => { setMode('rewrite'); setResult(null); }}
            disabled={isLoading}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50',
              mode === 'rewrite'
                ? 'text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-800 border-b-2 border-purple-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            <RefreshCw className="w-4 h-4" />
            بازنویسی محتوا
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {mode === 'generate' ? (
            <>
              {/* Topic Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  موضوع مقاله *
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="مثلاً: بررسی آیفون ۱۵ پرو مکس یا مقایسه گلکسی S24 با S23"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isLoading}
                />
              </div>

              {/* Category Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  دسته‌بندی
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isLoading}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isLoading || !topic.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    در حال تولید مقاله...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    تولید مقاله
                  </>
                )}
              </button>

              {/* Mock Mode Warning */}
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                  <b>Mock Mode:</b> فعلاً با داده‌های نمونه کار می‌کند. برای تولید واقعی، API Key را در <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">.env</code> تنظیم کنید.
                </p>
              </div>

              {/* Result Preview */}
              {result && (
                <div className="mt-6 p-5 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      پیش‌نمایش مقاله تولید شده
                    </h3>
                    {result.mock && (
                      <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 rounded-full font-medium">
                        Mock Mode
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{result.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-relaxed border-r-2 border-purple-400 pr-3">
                    {result.excerpt}
                  </p>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg text-sm text-gray-700 dark:text-gray-300 max-h-60 overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: result.content }} />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    دسته‌بندی پیشنهادی: <b>{CATEGORIES.find(c => c.key === result.suggested_category)?.label || result.suggested_category}</b>
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Content Textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  محتوای فعلی (برای بازنویسی)
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="محتوای مقاله را اینجا paste کنید تا با سبک ازکالا بازنویسی شود..."
                  rows={12}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {content.length} کاراکتر
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleRewrite}
                  disabled={isLoading || !content.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      در حال بازنویسی...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      بازنویسی با AI
                    </>
                  )}
                </button>
                <button
                  onClick={handleSuggestTitle}
                  disabled={isLoading || !content.trim()}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-900 dark:text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Lightbulb className="w-5 h-5" />
                  پیشنهاد عنوان
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer - Only show when result exists in generate mode */}
        {result && mode === 'generate' && (
          <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-900 dark:text-white rounded-xl text-sm font-medium transition-colors"
            >
              انصراف
            </button>
            <button
              onClick={handleUseResult}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              استفاده از این محتوا
            </button>
          </div>
        )}
      </div>
    </div>
  );
}