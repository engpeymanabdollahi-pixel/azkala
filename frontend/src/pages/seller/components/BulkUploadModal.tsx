import { useState, useCallback, useRef, useMemo } from 'react';
import {
  X, Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle,
  Loader2, Package, ArrowLeft, ArrowRight, RefreshCw, Trash2, Check
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  useDownloadBulkTemplate,
  useValidateBulkFile,
  useCommitBulkProducts,
} from '@/hooks/api/useBulkProductUpload';
// ✅ این دو تایپ واقعاً در sellerBulkProduct.service.ts export می‌شوند، نه
// در useBulkProductUpload.ts (که فقط برای استفاده‌ی داخلی خودش ایمپورت
// می‌کرد و دوباره export نمی‌کرد).
import type { BulkValidateResponse } from '@/services/sellerBulkProduct.service';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

// ==================== Types ====================
type Step = 1 | 2 | 3 | 4;

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ==================== Main Component ====================
export function BulkUploadModal({ isOpen, onClose, onSuccess }: BulkUploadModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<BulkValidateResponse | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadMutation = useDownloadBulkTemplate();
  const validateMutation = useValidateBulkFile();
  const commitMutation = useCommitBulkProducts();

  // ==================== Handlers ====================
  const handleClose = useCallback(() => {
    // اگر commit در حال انجام است، اجازه بستن نده
    if (commitMutation.isPending) return;

    // Reset state
    setCurrentStep(1);
    setSelectedFile(null);
    setValidationResult(null);
    setSelectedRows(new Set());
    setIsDragging(false);

    // اگر commit موفق بود، refresh کن
    if (commitMutation.isSuccess) {
      onSuccess();
    }

    onClose();
  }, [onClose, onSuccess, commitMutation.isPending, commitMutation.isSuccess]);

  const handleDownloadTemplate = useCallback(async () => {
    await downloadMutation.mutateAsync();
  }, [downloadMutation]);

  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'text/csv', // csv
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('فقط فایل‌های Excel (.xlsx, .xls) و CSV مجاز هستند');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('حجم فایل نباید بیشتر از ۱۰ مگابایت باشد');
      return;
    }

    setSelectedFile(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleValidate = useCallback(async () => {
    if (!selectedFile) return;

    try {
      const result = await validateMutation.mutateAsync(selectedFile);
      setValidationResult(result);

      // Select all valid rows by default
      const allValidRows = new Set(result.valid.map((row) => row.row));
      setSelectedRows(allValidRows);

      // Go to step 3
      setCurrentStep(3);
    } catch {
      // Error handled in hook
    }
  }, [selectedFile, validateMutation]);

  const toggleRowSelection = useCallback((rowNumber: number) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowNumber)) {
        newSet.delete(rowNumber);
      } else {
        newSet.add(rowNumber);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAllValid = useCallback(() => {
    if (!validationResult) return;

    setSelectedRows((prev) => {
      const allValidRows = new Set(validationResult.valid.map((row) => row.row));
      // If all are selected, deselect all. Otherwise select all.
      if (prev.size === allValidRows.size) {
        return new Set();
      }
      return allValidRows;
    });
  }, [validationResult]);

  const handleCommit = useCallback(async () => {
    if (!validationResult) return;

    const rowsToCommit = validationResult.valid.filter((row) => selectedRows.has(row.row));

    if (rowsToCommit.length === 0) {
      toast.error('حداقل یک ردیف را برای import انتخاب کنید');
      return;
    }

    try {
      await commitMutation.mutateAsync(rowsToCommit);
      setCurrentStep(4);
    } catch {
      // Error handled in hook
    }
  }, [validationResult, selectedRows, commitMutation]);

  const handleRestart = useCallback(() => {
    setCurrentStep(1);
    setSelectedFile(null);
    setValidationResult(null);
    setSelectedRows(new Set());
    downloadMutation.reset();
    validateMutation.reset();
    commitMutation.reset();
  }, [downloadMutation, validateMutation, commitMutation]);

  // ==================== Computed ====================
  const selectedCount = useMemo(() => selectedRows.size, [selectedRows]);
  const allValidSelected = useMemo(() => {
    if (!validationResult) return false;
    return selectedRows.size === validationResult.valid.length;
  }, [validationResult, selectedRows]);

  // ==================== Render Helpers ====================
  const renderStepIndicator = () => {
    const steps = [
      { num: 1, label: 'دانلود قالب' },
      { num: 2, label: 'آپلود فایل' },
      { num: 3, label: 'بررسی و انتخاب' },
      { num: 4, label: 'تکمیل' },
    ];

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-4 right-0 left-0 h-0.5 bg-gray-200 dark:bg-slate-700 -z-0" />
          <div
            className="absolute top-4 right-0 h-0.5 bg-primary-500 transition-all duration-500 -z-0"
            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          />

          {steps.map((step) => {
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;

            return (
              <div key={step.num} className="relative z-10 flex flex-col items-center gap-2">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all',
                    isCompleted && 'bg-primary-500 text-white',
                    isActive && 'bg-primary-500 text-white ring-4 ring-primary-500/20',
                    !isActive && !isCompleted && 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.num}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium',
                    (isActive || isCompleted) ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ==================== Step 1: Download Template ====================
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center mx-auto">
          <FileSpreadsheet className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">دانلود قالب Excel</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
          ابتدا قالب آماده‌شده را دانلود کنید و اطلاعات محصولات خود را طبق ستون‌های مشخص‌شده وارد کنید.
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-2">
        <h3 className="font-bold text-blue-900 dark:text-blue-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> ستون‌های الزامی:
        </h3>
        <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside mr-2">
          <li><code className="bg-blue-100 dark:bg-blue-950 px-1.5 py-0.5 rounded">name</code> - نام محصول</li>
          <li><code className="bg-blue-100 dark:bg-blue-950 px-1.5 py-0.5 rounded">price</code> - قیمت</li>
          <li><code className="bg-blue-100 dark:bg-blue-950 px-1.5 py-0.5 rounded">stock</code> - موجودی</li>
          <li><code className="bg-blue-100 dark:bg-blue-950 px-1.5 py-0.5 rounded">category_id</code> - شناسه دسته‌بندی</li>
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          onClick={handleDownloadTemplate}
          disabled={downloadMutation.isPending}
          className="gap-2 w-full"
          size="lg"
        >
          {downloadMutation.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> در حال دانلود...</>
          ) : (
            <><Download className="w-4 h-4" /> دانلود قالب Excel</>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={() => setCurrentStep(2)}
          className="gap-2 w-full"
          size="lg"
        >
          قالب را دارم، مرحله بعد <ArrowLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  // ==================== Step 2: Upload File ====================
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center mx-auto">
          <Upload className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">آپلود فایل پر شده</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
          فایل Excel یا CSV پر شده را اینجا رها کنید یا انتخاب کنید.
        </p>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-slate-800/50',
          selectedFile && 'border-green-500 bg-green-50 dark:bg-green-900/20'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          className="hidden"
        />

        {selectedFile ? (
          <div className="space-y-2">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <p className="font-bold text-green-700 dark:text-green-400">{selectedFile.name}</p>
            <p className="text-xs text-green-600 dark:text-green-400">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
              }}
              className="text-xs text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> حذف و انتخاب مجدد
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="font-bold text-gray-700 dark:text-gray-300">
              فایل را اینجا رها کنید
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              یا کلیک کنید برای انتخاب • xlsx, xls, csv • حداکثر ۱۰MB
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(1)}
          className="gap-2 flex-1"
        >
          <ArrowRight className="w-4 h-4" /> مرحله قبل
        </Button>
        <Button
          onClick={handleValidate}
          disabled={!selectedFile || validateMutation.isPending}
          className="gap-2 flex-1"
        >
          {validateMutation.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> در حال بررسی...</>
          ) : (
            <>بررسی فایل <ArrowLeft className="w-4 h-4" /></>
          )}
        </Button>
      </div>
    </div>
  );

  // ==================== Step 3: Validation Results ====================
  const renderStep3 = () => {
    if (!validationResult) return null;

    const { valid, errors } = validationResult;

    return (
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">نتیجه بررسی فایل</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            فایل شما با موفقیت پردازش شد. لطفاً ردیف‌های مورد نظر را برای import انتخاب کنید.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-green-700 dark:text-green-400">{valid.length}</p>
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">ردیف معتبر</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-red-700 dark:text-red-400">{errors.length}</p>
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">ردیف خطادار</p>
          </div>
        </div>

        {/* Select All + Selected Count */}
        {valid.length > 0 && (
          <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
            <button
              onClick={toggleSelectAllValid}
              className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-2"
            >
              <div
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                  allValidSelected
                    ? 'bg-primary-500 border-primary-500'
                    : 'border-gray-300 dark:border-slate-600'
                )}
              >
                {allValidSelected && <Check className="w-3 h-3 text-white" />}
              </div>
              انتخاب همه ردیف‌های معتبر
            </button>
            <Badge variant="primary">{selectedCount} انتخاب شده</Badge>
          </div>
        )}

        {/* Valid Rows List */}
        {valid.length > 0 && (
          <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
            <div className="bg-gray-50 dark:bg-slate-800 px-4 py-2 border-b border-gray-200 dark:border-slate-700 sticky top-0">
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300">ردیف‌های معتبر</p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              {valid.map((row) => (
                <label
                  key={row.row}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedRows.has(row.row)}
                    onChange={() => toggleRowSelection(row.row)}
                    className="w-4 h-4 accent-primary-500"
                  />
                  <div className="flex-1 text-sm">
                    <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">ردیف {row.row}:</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {row.data.name || row.data.title || '(بدون نام)'}
                    </span>
                  </div>
                  {row.data.price && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {Number(row.data.price).toLocaleString('fa-IR')} ت
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Errors List */}
        {errors.length > 0 && (
          <details className="border border-red-200 dark:border-red-800 rounded-xl overflow-hidden">
            <summary className="bg-red-50 dark:bg-red-900/20 px-4 py-3 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
              <p className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> مشاهده {errors.length} خطا
              </p>
            </summary>
            <div className="max-h-48 overflow-y-auto divide-y divide-red-100 dark:divide-red-900/30">
              {errors.map((err, idx) => (
                <div key={idx} className="px-4 py-2.5 text-sm">
                  <p className="text-red-700 dark:text-red-400 font-medium">
                    ردیف {err.row}{err.field ? ` (${err.field})` : ''}:
                  </p>
                  <p className="text-red-600 dark:text-red-400/80 text-xs mt-0.5">{err.message}</p>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(2)}
            className="gap-2 flex-1"
          >
            <ArrowRight className="w-4 h-4" /> مرحله قبل
          </Button>
          <Button
            onClick={handleCommit}
            disabled={selectedCount === 0 || commitMutation.isPending}
            className="gap-2 flex-1"
          >
            {commitMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> در حال ایجاد...</>
            ) : (
              <>ایجاد {selectedCount} محصول <CheckCircle className="w-4 h-4" /></>
            )}
          </Button>
        </div>
      </div>
    );
  };

  // ==================== Step 4: Success ====================
  const renderStep4 = () => (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-12 h-12" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">عملیات با موفقیت انجام شد!</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
          محصولات شما با موفقیت به فروشگاه اضافه شدند. می‌توانید آن‌ها را در لیست محصولات مشاهده کنید.
        </p>
      </div>

      {commitMutation.data && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-right space-y-1">
          <p className="text-sm text-green-800 dark:text-green-300">
            <span className="font-bold">{commitMutation.data.created?.length || 0}</span> محصول ایجاد شد
          </p>
          {(commitMutation.data.failed?.length || 0) > 0 && (
            <p className="text-sm text-red-600 dark:text-red-400">
              <span className="font-bold">{commitMutation.data.failed?.length}</span> مورد ناموفق
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleRestart}
          className="gap-2 flex-1"
        >
          <RefreshCw className="w-4 h-4" /> آپلود مجدد
        </Button>
        <Button
          onClick={handleClose}
          className="gap-2 flex-1"
        >
          <Package className="w-4 h-4" /> مشاهده محصولات
        </Button>
      </div>
    </div>
  );

  // ==================== Main Render ====================
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="افزودن دسته‌ای محصولات"
      size="lg"
      closeOnOverlayClick={!commitMutation.isPending}
    >
      <div className="p-2">
        {renderStepIndicator()}

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>
    </Modal>
  );
}