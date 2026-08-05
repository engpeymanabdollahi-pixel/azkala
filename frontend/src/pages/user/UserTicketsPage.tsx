import { TicketsSection } from '@/pages/dashboard/TicketsSection';

/**
 * ✅ این صفحه (روت مستقل /user/tickets، بدون چیدمان داشبورد) قبلاً یک کپی
 * کامل و جداگانه‌ی ~۶۰۰ خطیِ TicketsSection.tsx بود که به‌مرور از نسخه‌ی
 * اصلی عقب افتاده بود و باگ خودش را هم داشت: در مودال جزئیات تیکت،
 * تشخیص «پیام از طرف خودِ کاربر» با msg.user_id === selectedTicket.id
 * (یعنی مقایسه با آی‌دی خودِ تیکت، نه کاربر لاگین‌کرده) انجام می‌شد — پس
 * پیام‌های کاربر تقریباً هیچ‌وقت به‌درستی به‌عنوان «شما» علامت‌گذاری
 * نمی‌شدند. علاوه بر این، دارک‌مود نداشت و چند any در تایپ‌ها بود.
 *
 * به‌جای نگه‌داشتن دو پیاده‌سازیِ موازی از یک ویژگی که به‌مرور از هم عقب
 * می‌افتند، همان TicketsSection واقعی و اصلاح‌شده (که در /dashboard/tickets
 * هم استفاده می‌شود) اینجا هم استفاده می‌شود.
 */
export function UserTicketsPage() {
  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <TicketsSection />
      </div>
    </div>
  );
}
export default UserTicketsPage;
