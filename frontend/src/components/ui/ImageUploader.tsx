import { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { uploadImages } from '@/services/upload.service';
import { cn } from '@/utils/cn';

interface ImageUploaderProps {
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  existingImages?: string[]; // تصاویر موجود برای حالت ویرایش
}

export function ImageUploader({
  onUploadComplete,
  maxFiles = 5,
  maxSizeMB = 4,
  existingImages = [],
}: ImageUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ترکیب تصاویر موجود و پیش‌نمایش‌های جدید برای نمایش
  const allImages = [...existingImages, ...previews];

  // اگر تصاویر موجود تغییر کرد، پیش‌نمایش‌ها را ریست کن تا تداخل ایجاد نشود
  // (اختیاری: بستگی به منطق شما دارد، اما معمولاً بهتر است جدا باشند)
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // بررسی حجم
    const oversizedFiles = selectedFiles.filter(file => file.size > maxSizeMB * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`حجم هر تصویر باید کمتر از ${maxSizeMB} مگابایت باشد`);
      return;
    }

    // بررسی تعداد کل (موجود + جدید)
    if (allImages.length + selectedFiles.length > maxFiles) {
      setError(`حداکثر ${maxFiles} تصویر مجاز است`);
      return;
    }

    setFiles(prev => [...prev, ...selectedFiles]);
    
    // ایجاد پیش‌نمایش محلی
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
    setError(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      // آپلود تصاویر جدید به سرور
      const newUrls = await uploadImages(files);
      
      // ✅ فراخوانی onUploadComplete با تمام URLها (قدیمی + جدید)
      // نکته: در اینجا ما فقط URLهای جدید را برمی‌گردانیم و کامپوننت والد مسئول ادغام است
      // یا می‌توانیم همه را برگردانیم. بسته به طراحی AddProduct.tsx
      onUploadComplete(newUrls);
      
      // پاک کردن فایل‌های انتخاب شده (نه پیش‌نمایش‌ها اگر بخواهیم نگه داریم)
      setFiles([]);
      // پیش‌نمایش‌ها را هم پاک می‌کنیم چون دیگر "جدید" نیستند و تبدیل به URL شده‌اند
      // اما چون onUploadComplete فقط URLهای جدید را داد، والد باید مدیریت کند.
      // برای سادگی، اینجا پیش‌نمایش‌ها را پاک می‌کنیم تا کاربر بداند آپلود شده‌اند.
      setPreviews([]);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.message || 'خطا در آپلود تصاویر');
    } finally {
      setIsUploading(false);
    }
  };

  // حذف تصویر از لیست پیش‌نمایش‌ها (قبل از آپلود)
  const removePreview = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* ناحیه Drag & Drop */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add('border-primary-500', 'bg-primary-50');
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove('border-primary-500', 'bg-primary-50');
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('border-primary-500', 'bg-primary-50');
          const droppedFiles = Array.from(e.dataTransfer.files);
          
          const oversizedFiles = droppedFiles.filter(file => file.size > maxSizeMB * 1024 * 1024);
          if (oversizedFiles.length > 0) {
            setError(`حجم هر تصویر باید کمتر از ${maxSizeMB} مگابایت باشد`);
            return;
          }

          if (allImages.length + droppedFiles.length > maxFiles) {
            setError(`حداکثر ${maxFiles} تصویر مجاز است`);
            return;
          }

          setFiles(prev => [...prev, ...droppedFiles]);
          const newPreviews = droppedFiles.map(file => URL.createObjectURL(file));
          setPreviews(prev => [...prev, ...newPreviews]);
          setError(null);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'w-full aspect-square border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center gap-2 cursor-pointer',
          'border-gray-300 hover:border-primary-500 hover:bg-primary-50'
        )}
      >
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
          <Upload className="w-7 h-7 text-gray-500" />
        </div>
        <span className="text-sm text-gray-600">
          تصاویر را اینجا بکشید یا کلیک کنید
        </span>
        <span className="text-xs text-gray-400">
          PNG, JPG, WebP تا {maxSizeMB}MB | حداکثر {maxFiles} تصویر
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* نمایش تمام تصاویر (موجود + جدید) */}
      {allImages.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {allImages.map((imgSrc, index) => {
            // تشخیص اینکه آیا این تصویر در حال آپلود است (در previews هست) یا خیر
            const isPending = previews.includes(imgSrc);
            
            return (
              <div key={index} className="relative group">
                <img
                  src={imgSrc}
                  alt={`تصویر ${index + 1}`}
                  className="w-full aspect-square object-cover rounded-xl"
                />
                
                {/* اگر در حال آپلود است، لودر نشان بده */}
                {isPending && (
                  <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}

                {/* دکمه حذف فقط برای تصاویر هنوز آپلود نشده ظاهر شود (یا همیشه اگر منطق حذف از سرور داشته باشیم) */}
                {!isPending && (
                   <button
                    type="button"
                    // در حالت ویرایش، حذف تصویر ممکن است نیاز به API داشته باشد.
                    // فعلاً فقط از لیست پیش‌نمایش حذف می‌کنیم.
                    onClick={() => removePreview(index)} 
                    className="absolute top-1 right-1 w-6 h-6 bg-error-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* دکمه آپلود */}
      {files.length > 0 && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading}
          className={cn(
            'w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
            'bg-gradient-to-r from-primary-500 to-primary-600 text-white',
            'hover:from-primary-600 hover:to-primary-700',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              در حال آپلود...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              آپلود {files.length} تصویر
            </>
          )}
        </button>
      )}

      {/* نمایش خطا */}
      {error && (
        <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
          <p className="text-error-600 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}