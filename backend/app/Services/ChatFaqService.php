<?php

namespace App\Services;

use App\Models\ChatFaq;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Events\MessageSent;

class ChatFaqService
{
    /**
     * پردازش پیام ورودی و پاسخ خودکار در صورت تطابق
     */
    public function processIncomingMessage(Message $message, Conversation $conversation): ?Message
    {
        // فقط برای پیام‌های خریدار (نه فروشنده)
        if ($message->sender_id === $conversation->seller_id) {
            return null;
        }

        $sellerId = $conversation->seller_id;
        $userMessage = $message->content;

        // پیدا کردن FAQ های فعال فروشنده
        $faqs = ChatFaq::where('seller_id', $sellerId)
            ->where('is_active', true)
            ->orderByDesc('priority')
            ->get();

        foreach ($faqs as $faq) {
            if ($faq->matches($userMessage)) {
                // ایجاد پاسخ خودکار
                $autoReply = Message::create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $sellerId,
                    'content' => $faq->answer,
                    'type' => 'system',
                ]);

                // افزایش تعداد استفاده
                $faq->incrementUsage();

                // بروزرسانی last_message_at
                $conversation->update(['last_message_at' => now()]);

                // Broadcast
                $seller = User::find($sellerId);
                broadcast(new MessageSent($conversation, $autoReply, $seller))->toOthers();

                return $autoReply;
            }
        }

        return null;
    }

    /**
     * Seed FAQ های پیش‌فرض برای یک فروشنده
     */
    public function seedDefaultFaqs(int $sellerId): void
    {
        $defaultFaqs = [
            [
                'question_pattern' => 'قیمت|چند|هزینه|تومان',
                'answer' => "💰 قیمت محصول در صفحه محصول قابل مشاهده است. برای اطلاعات بیشتر می‌توانید به صفحه محصول مراجعه کنید.",
                'category' => 'product',
                'priority' => 10,
            ],
            [
                'question_pattern' => 'ارسال|پست|پیک|چند روز|زمان ارسال',
                'answer' => "🚚 ارسال سفارشات ۲ تا ۳ روز کاری زمان می‌برد. برای شهرهای بزرگ ۱ تا ۲ روز.",
                'category' => 'shipping',
                'priority' => 10,
            ],
            [
                'question_pattern' => 'ضمانت|گارانتی|مرجوعی|بازگشت',
                'answer' => "✅ تمامی محصولات دارای ۷ روز ضمانت بازگشت هستند. در صورت عدم رضایت، می‌توانید محصول را مرجوع کنید.",
                'category' => 'general',
                'priority' => 10,
            ],
            [
                'question_pattern' => 'موجود|دارید|داره|موجودی',
                'answer' => "✅ بله، این محصول موجود است. می‌توانید با خیال راحت سفارش دهید.",
                'category' => 'product',
                'priority' => 10,
            ],
            [
                'question_pattern' => 'تخفیف|ارزان|کد تخفیف|کوپن',
                'answer' => "🎁 برای دریافت کد تخفیف، می‌توانید در خبرنامه سایت عضو شوید یا صفحه اینستاگرام ما را دنبال کنید.",
                'category' => 'payment',
                'priority' => 8,
            ],
            [
                'question_pattern' => 'سلام|درود|وقت بخیر|خسته نباشید',
                'answer' => "👋 سلام! خوش آمدید. چطور می‌توانم کمکتان کنم؟",
                'category' => 'general',
                'priority' => 15,
            ],
            [
                'question_pattern' => 'ممنون|مرسی|تشکر|سپاس',
                'answer' => "🙏 خواهش می‌کنم! خوشحالیم که توانستیم کمکتان کنیم. روز خوبی داشته باشید!",
                'category' => 'general',
                'priority' => 15,
            ],
            [
                'question_pattern' => 'رنگ|سایز|اندازه|مشخصات',
                'answer' => "📋 تمام مشخصات محصول (رنگ، سایز، ابعاد) در بخش توضیحات محصول موجود است.",
                'category' => 'product',
                'priority' => 8,
            ],
            [
                'question_pattern' => 'پرداخت|کارت|آنلاین|درگاه',
                'answer' => "💳 پرداخت به صورت آنلاین از طریق درگاه امن بانکی امکان‌پذیر است. تمامی کارت‌های شتاب پذیرفته می‌شوند.",
                'category' => 'payment',
                'priority' => 8,
            ],
            [
                'question_pattern' => 'اصل|اورجینال|فیک|تقلبی',
                'answer' => "✅ تمامی محصولات ما ۱۰۰٪ اورجینال و با ضمانت اصالت هستند. در صورت هرگونه مشکل، وجه شما بازگردانده می‌شود.",
                'category' => 'product',
                'priority' => 10,
            ],
        ];

        foreach ($defaultFaqs as $faq) {
            ChatFaq::create([
                'seller_id' => $sellerId,
                'question_pattern' => $faq['question_pattern'],
                'answer' => $faq['answer'],
                'category' => $faq['category'],
                'priority' => $faq['priority'],
                'is_active' => true,
            ]);
        }
    }
}