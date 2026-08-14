import { z } from 'zod';
import { toLatinDigits } from '@/utils/digits';

// فیلدهای عددی پیش از بررسی الگو یکسان‌سازی می‌شوند: \d فقط ارقام لاتین را
// می‌گیرد، پس بدون این، کاربری که با کیبورد فارسی تایپ می‌کند پیام «نامعتبر»
// می‌گرفت در حالی که مقدار درستی وارد کرده بود.

export const shippingAddressSchema = z.object({
  receiver_name: z.string()
    .min(3, 'نام گیرنده باید حداقل ۳ کاراکتر باشد')
    .max(100, 'نام گیرنده نباید بیشتر از ۱۰۰ کاراکتر باشد'),
  
  phone: z.string()
    .transform(toLatinDigits)
    .refine((value) => /^09\d{9}$/.test(value), 'شماره موبایل نامعتبر است (مثال: 09123456789)'),
  
  province: z.string()
    .min(2, 'لطفاً استان را انتخاب کنید'),
  
  city: z.string()
    .min(2, 'لطفاً شهر را انتخاب کنید'),
  
  address: z.string()
    .min(10, 'آدرس دقیق باید حداقل ۱۰ کاراکتر باشد')
    .max(500, 'آدرس نباید بیشتر از ۵۰۰ کاراکتر باشد'),
  
  postal_code: z.string()
    .transform(toLatinDigits)
    .refine((value) => /^\d{10}$/.test(value), 'کد پستی باید دقیقاً ۱۰ رقم باشد'),
  
  notes: z.string()
    .max(1000, 'یادداشت نباید بیشتر از ۱۰۰۰ کاراکتر باشد')
    .optional(),
});

export const checkoutFormSchema = z.object({
  shipping_address: shippingAddressSchema,
  // ✅ zod نصب‌شده نسخه‌ی ۴ است — errorMap در z.enum حذف شده و به‌جایش error
  // آمده. errorMap قدیمی چون فقط یک آبجکت params معمولی است (نه چیزی که
  // zod در runtime آن را اعتبارسنجی کند)، بی‌صدا نادیده گرفته می‌شد و
  // پیام سفارشی هرگز نمایش داده نمی‌شد — کاربر پیام پیش‌فرض عمومی zod را
  // می‌دید، نه پیام فارسی واقعی.
  payment_method: z.enum(['online', 'wallet'], {
    error: 'لطفاً روش پرداخت را انتخاب کنید',
  }),
});

export type ShippingAddressFormData = z.infer<typeof shippingAddressSchema>;
export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;