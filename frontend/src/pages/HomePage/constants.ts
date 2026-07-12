import {
  Smartphone, ArrowLeft, Info, Gift, Package, Store, Award, Crown,
  Truck, Shield, Headphones, Gem, BadgeCheck, RefreshCw
} from 'lucide-react';
import type {
  HeroSlide, Review, PlatformStat, Feature, TrustBadge,
  PaymentMethod, ShippingPartner
} from './types';

// ==================== Hero Slides ====================

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    badge: '🔥 پیشنهاد ویژه',
    title: 'تا ۵۰٪ تخفیف',
    subtitle: 'روی لوازم جانبی موبایل',
    description: 'بهترین محصولات با بهترین قیمت، فقط در ازکالا',
    gradient: 'from-primary-700 via-primary-600 to-accent-600',
    image: '📱',
    cta: {
      primary: { text: 'مشاهده تخفیف‌ها', icon: ArrowLeft },
      secondary: { text: 'انتخاب مدل گوشی', icon: Smartphone },
    },
  },
  {
    id: 2,
    badge: '⚡ ارسال رایگان',
    title: 'تحویل سریع',
    subtitle: 'برای خریدهای بالای ۵۰۰ هزار تومان',
    description: 'به سراسر ایران در کمتر از ۷۲ ساعت',
    gradient: 'from-success-700 via-success-600 to-primary-600',
    image: '🚚',
    cta: {
      primary: { text: 'شروع خرید', icon: ArrowLeft },
      secondary: { text: 'مشاهده شرایط', icon: Info },
    },
  },
  {
    id: 3,
    badge: '🎁 هدیه ویژه',
    title: 'با هر خرید یک هدیه',
    subtitle: 'محصولات الکترونیکی رایگان',
    description: 'فقط تا پایان این هفته',
    gradient: 'from-accent-700 via-accent-600 to-primary-600',
    image: '🎉',
    cta: {
      primary: { text: 'دریافت هدیه', icon: Gift },
      secondary: { text: 'شرایط شرکت', icon: Info },
    },
  },
];

// ==================== Reviews ====================

export const REVIEWS: Review[] = [
  {
    id: 1,
    name: 'علی رضایی',
    text: 'خرید لوازم جانبی موبایل دیگه استرس نداره. با انتخاب مدل گوشی، فقط محصولات سازگار رو می‌بینم.',
    rating: 5,
    model: 'iPhone 15 Pro Max',
    avatar: '👨',
    verified: true,
    date: '۲ روز پیش',
    helpful: 24,
  },
  {
    id: 2,
    name: 'فاطمه احمدی',
    text: 'از لوازم خانگی گرفته تا الکترونیک، همه چیز تو یه جا. قیمت‌ها خیلی مناسبه و ارسال سریع.',
    rating: 5,
    model: 'Galaxy S24 Ultra',
    avatar: '👩',
    verified: true,
    date: '۱ هفته پیش',
    helpful: 18,
  },
  {
    id: 3,
    name: 'محمد کریمی',
    text: 'پاوربانک و هدفون بلوتوثی خریدم. کیفیت عالی، قیمت مناسب و ارسال خیلی سریع.',
    rating: 5,
    model: 'محصولات الکترونیکی',
    avatar: '🧑',
    verified: true,
    date: '۳ روز پیش',
    helpful: 32,
  },
];

// ==================== Platform Stats ====================

export const PLATFORM_STATS: PlatformStat[] = [
  { value: 10000, label: 'محصول', icon: Package, color: 'from-primary-500 to-primary-600', suffix: '+' },
  { value: 500, label: 'فروشنده', icon: Store, color: 'from-accent-500 to-accent-600', suffix: '+' },
  { value: 98, label: 'رضایت', icon: Award, color: 'from-success-500 to-success-600', suffix: '٪' },
  { value: 50000, label: 'مشتری', icon: Crown, color: 'from-warning-500 to-warning-600', suffix: '+' },
];

// ==================== Features ====================

export const FEATURES: Feature[] = [
  {
    icon: Truck,
    title: 'ارسال رایگان',
    desc: 'ارسال رایگان برای خریدهای بالای ۵۰۰ هزار تومان',
    gradient: 'from-primary-500 to-primary-600',
  },
  {
    icon: Shield,
    title: 'ضمانت اصالت',
    desc: 'تمام محصولات با گارانتی اصالت و کیفیت ۱۰۰٪',
    gradient: 'from-success-500 to-success-600',
  },
  {
    icon: Headphones,
    title: 'پشتیبانی ۲۴/۷',
    desc: 'پاسخگویی در تمام ساعات شبانه‌روز',
    gradient: 'from-accent-500 to-accent-600',
  },
  {
    icon: Gem,
    title: 'بهترین قیمت',
    desc: 'تضمین بهترین قیمت با امکان مقایسه',
    gradient: 'from-warning-500 to-warning-600',
  },
];

// ==================== Trust Badges ====================

export const TRUST_BADGES: TrustBadge[] = [
  { icon: Shield, title: 'ضمانت اصالت', description: '۱۰۰٪ اصل' },
  { icon: Truck, title: 'ارسال سریع', description: '۷۲ ساعته' },
  { icon: RefreshCw, title: '۷ روز بازگشت', description: 'بدون قید و شرط' },
  { icon: Headphones, title: 'پشتیبانی ۲۴/۷', description: 'همیشه در کنار شما' },
  { icon: Award, title: 'بهترین قیمت', description: 'تضمین قیمت' },
  { icon: BadgeCheck, title: 'نماد اعتماد', description: 'مجوز رسمی' },
];

// ==================== Payment & Shipping ====================

export const PAYMENT_METHODS: PaymentMethod[] = [
  { name: 'زرین‌پال', icon: '💳' },
  { name: 'پرداخت آنلاین', icon: '🏦' },
  { name: 'کارت به کارت', icon: '💰' },
  { name: 'پرداخت در محل', icon: '🚚' },
];

export const SHIPPING_PARTNERS: ShippingPartner[] = [
  { name: 'پست پیشتاز', icon: '📮' },
  { name: 'تیپاکس', icon: '📦' },
  { name: 'چاپار', icon: '🚚' },
  { name: 'اسنپ‌باکس', icon: '🛵' },
];

// ==================== Timing Constants ====================

export const HERO_AUTOPLAY_INTERVAL = 6000;
export const REVIEW_AUTOPLAY_INTERVAL = 5000;
export const BACK_TO_TOP_THRESHOLD = 500;
export const RECENTLY_VIEWED_STORAGE_KEY = 'recentlyViewed';
export const RECENTLY_VIEWED_MAX_ITEMS = 10;
export const RECENTLY_VIEWED_DISPLAY_ITEMS = 6;
export const EMAIL_VALIDATION_DELAY = 500;