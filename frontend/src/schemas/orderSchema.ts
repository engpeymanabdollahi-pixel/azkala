import { z } from 'zod';

export const shippingAddressSchema = z.object({
  receiver_name: z.string().min(3, 'نام گیرنده باید حداقل ۳ کاراکتر باشد'),
  phone: z.string().regex(/^09\d{9}$/, 'شماره موبایل نامعتبر است (مثال: 09123456789)'),
  province: z.string().min(2, 'لطفاً استان را انتخاب کنید'),
  city: z.string().min(2, 'لطفاً شهر را انتخاب کنید'),
  address: z.string().min(10, 'آدرس دقیق باید حداقل ۱۰ کاراکتر باشد'),
  postal_code: z.string().regex(/^\d{10}$/, 'کد پستی باید دقیقاً ۱۰ رقم باشد'),
});

export type ShippingAddressFormData = z.infer<typeof shippingAddressSchema>;