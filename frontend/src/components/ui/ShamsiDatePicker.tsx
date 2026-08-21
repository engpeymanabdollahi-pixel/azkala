import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as jalaali from 'jalaali-js';
import { ChevronRight, ChevronLeft, CalendarDays, X } from 'lucide-react';

/**
 * Date Picker شمسی با تقویم popup واقعی.
 *
 * 🔑 نکته کلیدی: popup با createPortal به document.body رندر می‌شود
 * تا از clipping توسط overflow-hidden والدین (Card/Section) جلوگیری شود.
 *
 * قرارداد: ورودی/خروجی همیشه میلادی 'Y-m-d' (قرارداد backend).
 * مطابق Design System ازکالا: RTL-first، Light/Dark، Lucide، token های موجود.
 */

const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
] as const;

const WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] as const;

const POPUP_WIDTH = 288;
const POPUP_HEIGHT = 368;

interface ShamsiDatePickerProps {
  value: string;
  onChange: (gregorian: string) => void;
  placeholder?: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function gregorianToJalaali(gregorian: string) {
  const d = new Date(`${gregorian}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function toJalaaliDisplay(gregorian: string): string {
  const d = new Date(`${gregorian}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('fa-IR-u-nu-latn-ca-persian', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return gregorian;
  }
}

export default function ShamsiDatePicker({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
}: ShamsiDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'days' | 'months'>('days');
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const todayJ = useMemo(() => {
    const n = new Date();
    return jalaali.toJalaali(n.getFullYear(), n.getMonth() + 1, n.getDate());
  }, []);

  const selectedJ = useMemo(() => (value ? gregorianToJalaali(value) : null), [value]);

  const [viewJy, setViewJy] = useState(selectedJ?.jy ?? todayJ.jy);
  const [viewJm, setViewJm] = useState(selectedJ?.jm ?? todayJ.jm);

  useEffect(() => {
    if (selectedJ) {
      setViewJy(selectedJ.jy);
      setViewJm(selectedJ.jm);
    }
  }, [selectedJ?.jy, selectedJ?.jm]);

  // ✅ موقعیت‌یابی popup نسبت به trigger (با clamp به viewport)
  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();

    // راست‌چین: لبه راست popup روی لبه راست trigger (RTL)
    let left = rect.right - POPUP_WIDTH;
    left = Math.max(8, Math.min(left, window.innerWidth - POPUP_WIDTH - 8));

    // پیش‌فرض: زیر trigger؛ اگر جا نبود، بالای trigger
    let top = rect.bottom + 8;
    if (top + POPUP_HEIGHT > window.innerHeight - 8) {
      top = rect.top - POPUP_HEIGHT - 8;
    }
    top = Math.max(8, top);

    setPos({ top, left });
  };

  useLayoutEffect(() => {
    if (open) updatePosition();
  }, [open, view]);

  // ✅ با scroll/resize موقعیت را به‌روز کن
  useEffect(() => {
    if (!open) return;
    const handler = () => updatePosition();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [open]);

  // ✅ بستن با کلیک بیرون + ESC
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popupRef.current?.contains(t)) return;
      if (triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const monthLength = jalaali.jalaaliMonthLength(viewJy, viewJm);

  const grid = useMemo(() => {
    const firstGreg = jalaali.toGregorian(viewJy, viewJm, 1);
    const firstDate = new Date(firstGreg.gy, firstGreg.gm - 1, firstGreg.gd);
    const startOffset = (firstDate.getDay() + 1) % 7; // هفته ایرانی: شنبه=۰
    const cells: Array<number | null> = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= monthLength; d++) cells.push(d);
    return cells;
  }, [viewJy, viewJm, monthLength]);

  const yearOptions = useMemo(() => {
    const list: number[] = [];
    for (let y = todayJ.jy + 1; y >= todayJ.jy - 8; y--) list.push(y);
    return list;
  }, [todayJ]);

  const prevMonth = () => {
    if (viewJm === 1) {
      setViewJm(12);
      setViewJy((y) => y - 1);
    } else setViewJm((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewJm === 12) {
      setViewJm(1);
      setViewJy((y) => y + 1);
    } else setViewJm((m) => m + 1);
  };

  const selectDay = (d: number) => {
    const g = jalaali.toGregorian(viewJy, viewJm, d);
    onChange(`${g.gy}-${pad2(g.gm)}-${pad2(g.gd)}`);
    setOpen(false);
    setView('days');
  };

  const goToday = () => {
    setViewJy(todayJ.jy);
    setViewJm(todayJ.jm);
    const g = jalaali.toGregorian(todayJ.jy, todayJ.jm, todayJ.jd);
    onChange(`${g.gy}-${pad2(g.gm)}-${pad2(g.gd)}`);
    setOpen(false);
    setView('days');
  };

  const clear = () => {
    onChange('');
    setOpen(false);
    setView('days');
  };

  const isSelected = (d: number) =>
    selectedJ !== null && selectedJ.jy === viewJy && selectedJ.jm === viewJm && selectedJ.jd === d;

  const isToday = (d: number) =>
    todayJ.jy === viewJy && todayJ.jm === viewJm && todayJ.jd === d;

  // ✅ popup به body رندر می‌شود → هرگز clip نمی‌شود
  const popup = open
    ? createPortal(
        <div
          ref={popupRef}
          dir="rtl"
          style={{ top: pos.top, left: pos.left, width: POPUP_WIDTH }}
          className="fixed z-[100] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl p-3"
        >
          {view === 'days' ? (
            <>
              {/* هدر: ناوبری ماه + کلیک روی عنوان → نمای انتخاب ماه/سال */}
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-colors"
                  aria-label="ماه قبل"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setView('months')}
                  className="text-sm font-bold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                  title="انتخاب ماه و سال"
                >
                  {PERSIAN_MONTHS[viewJm - 1]} {viewJy.toLocaleString('fa-IR')}
                </button>

                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-colors"
                  aria-label="ماه بعد"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* روزهای هفته */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAYS.map((wd) => (
                  <div
                    key={wd}
                    className="text-center text-[11px] font-semibold text-gray-400 dark:text-gray-500 py-1"
                  >
                    {wd}
                  </div>
                ))}
              </div>

              {/* grid روزها */}
              <div className="grid grid-cols-7 gap-1">
                {grid.map((d, idx) =>
                  d === null ? (
                    <div key={`empty-${idx}`} />
                  ) : (
                    <button
                      key={d}
                      type="button"
                      onClick={() => selectDay(d)}
                      className={`h-8 w-full rounded-lg text-sm font-medium transition-colors ${
                        isSelected(d)
                          ? 'bg-primary-500 text-white shadow-sm'
                          : isToday(d)
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 ring-1 ring-primary-300 dark:ring-primary-700'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {d.toLocaleString('fa-IR')}
                    </button>
                  )
                )}
              </div>

              {/* footer */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={goToday}
                  className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  امروز
                </button>
                <button
                  type="button"
                  onClick={clear}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  پاک کردن
                </button>
              </div>
            </>
          ) : (
            <>
              {/* نمای انتخاب سال + ماه */}
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => setViewJy((y) => y - 1)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-colors"
                  aria-label="سال قبل"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* ✅ انتخاب مستقیم سال */}
                <select
                  value={viewJy}
                  onChange={(e) => setViewJy(Number(e.target.value))}
                  className="text-sm font-bold text-gray-900 dark:text-white bg-transparent border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                  aria-label="انتخاب سال"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y.toLocaleString('fa-IR')}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setViewJy((y) => y + 1)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-colors"
                  aria-label="سال بعد"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* ✅ grid ماه‌ها */}
              <div className="grid grid-cols-3 gap-2">
                {PERSIAN_MONTHS.map((name, i) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setViewJm(i + 1);
                      setView('days');
                    }}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                      viewJm === i + 1
                        ? 'bg-primary-500 text-white shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>

              <div className="flex justify-end mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setView('days')}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  بازگشت
                </button>
              </div>
            </>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 border rounded-xl text-sm transition-colors text-right ${
          value
            ? 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white'
            : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-400 dark:text-gray-500'
        } hover:border-primary-400 dark:hover:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500`}
      >
        <span className="truncate">{value ? toJalaaliDisplay(value) : placeholder}</span>
        <span className="flex items-center gap-1 flex-shrink-0">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                clear();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  clear();
                }
              }}
              className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="پاک کردن تاریخ"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <CalendarDays className="w-4 h-4 text-gray-400" />
        </span>
      </button>

      {popup}
    </div>
  );
}