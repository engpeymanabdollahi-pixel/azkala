import {
  Smartphone, Laptop, Gamepad2, Watch, Headphones, Gift
} from 'lucide-react';
import type { Category, SearchCategory, NavItem, MobileMenuItem, SecondaryMenuItem } from './types';

// ==================== Categories ====================

export const CATEGORIES: Category[] = [
  {
    id: 'mobile',
    name: 'موبایل و تبلت',
    icon: <Smartphone className="w-5 h-5" />,
    color: 'from-primary-500 to-primary-600',
    subcategories: [
      { name: 'قاب و کاور', path: '/products?category=case', icon: '🛡️' },
      { name: 'محافظ صفحه', path: '/products?category=screen-protector', icon: '🔲' },
      { name: 'شارژر و کابل', path: '/products?category=charger', icon: '🔌' },
      { name: 'هندزفری و هدفون', path: '/products?category=headphone', icon: '🎧' },
      { name: 'پاوربانک', path: '/products?category=power-bank', icon: '🔋' },
      { name: 'هولدر و پایه', path: '/products?category=holder', icon: '📱' },
    ]
  },
  {
    id: 'laptop',
    name: 'لپ‌تاپ و کامپیوتر',
    icon: <Laptop className="w-5 h-5" />,
    color: 'from-accent-500 to-accent-600',
    subcategories: [
      { name: 'کیف لپ‌تاپ', path: '/products?category=laptop-bag', icon: '💼' },
      { name: 'ماوس و کیبورد', path: '/products?category=keyboard-mouse', icon: '⌨️' },
      { name: 'کول پد', path: '/products?category=cooling-pad', icon: '❄️' },
      { name: 'هاب USB', path: '/products?category=usb-hub', icon: '🔌' },
    ]
  },
  {
    id: 'gaming',
    name: 'گیمینگ',
    icon: <Gamepad2 className="w-5 h-5" />,
    color: 'from-success-500 to-success-600',
    subcategories: [
      { name: 'کنترلر بازی', path: '/products?category=controller', icon: '🎮' },
      { name: 'هدست گیمینگ', path: '/products?category=gaming-headset', icon: '🎧' },
      { name: 'دسته بازی موبایل', path: '/products?category=mobile-controller', icon: '🕹️' },
      { name: 'پایه خنک‌کننده', path: '/products?category=phone-cooler', icon: '🌀' },
    ]
  },
  {
    id: 'wearable',
    name: 'پوشیدنی‌ها',
    icon: <Watch className="w-5 h-5" />,
    color: 'from-warning-500 to-warning-600',
    subcategories: [
      { name: 'بند ساعت هوشمند', path: '/products?category=watch-band', icon: '⌚' },
      { name: 'محافظ صفحه ساعت', path: '/products?category=watch-protector', icon: '🔲' },
      { name: 'شارژر ساعت', path: '/products?category=watch-charger', icon: '⚡' },
    ]
  },
  {
    id: 'audio',
    name: 'صوتی و تصویری',
    icon: <Headphones className="w-5 h-5" />,
    color: 'from-error-500 to-error-600',
    subcategories: [
      { name: 'اسپیکر بلوتوثی', path: '/products?category=speaker', icon: '🔊' },
      { name: 'میکروفون', path: '/products?category=microphone', icon: '🎤' },
      { name: 'دانگل بلوتوث', path: '/products?category=bluetooth-dongle', icon: '📶' },
    ]
  },
  {
    id: 'accessories',
    name: 'لوازم عمومی',
    icon: <Gift className="w-5 h-5" />,
    color: 'from-primary-500 to-accent-500',
    subcategories: [
      { name: 'تمیزکننده', path: '/products?category=cleaner', icon: '🧴' },
      { name: 'کیف و کوله', path: '/products?category=bags', icon: '🎒' },
      { name: 'تبدیل‌ها', path: '/products?category=adapters', icon: '🔄' },
    ]
  },
];

// ==================== Search Categories ====================

export const SEARCH_CATEGORIES: SearchCategory[] = [
  { id: 'all', name: 'همه دسته‌ها' },
  { id: 'mobile', name: 'موبایل و تبلت' },
  { id: 'laptop', name: 'لپ‌تاپ' },
  { id: 'gaming', name: 'گیمینگ' },
  { id: 'wearable', name: 'پوشیدنی' },
  { id: 'audio', name: 'صوتی' },
];

// ==================== Popular Suggestions ====================

export const POPULAR_SUGGESTIONS: string[] = [
  'قاب آیفون 15 پرو مکس',
  'شارژر سریع سامسونگ 65 وات',
  'هندزفری بلوتوثی ایرپادز',
  'گلس محافظ گلکسی S24 اولترا',
  'کابل تایپ سی اورجینال',
  'پاوربانک 20000 میلی آمپر',
];

// ==================== Navigation Items ====================

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'صفحه اصلی', path: '/' },
  { id: 'products', label: 'محصولات', path: '/products' },
  { id: 'brands', label: 'برندها', path: '/brands' },
  { id: 'flash-sale', label: 'تخفیف‌های ویژه', path: '/products?discount=true', badge: 'داغ' },
];

// ==================== Mobile Menu Items ====================

import {
  Home, Package, Store, Flame, Heart, MessageCircle,
  User, Phone, Info, Shield, HelpCircle
} from 'lucide-react';

export const MOBILE_MENU_ITEMS: MobileMenuItem[] = [
  { id: 'home', label: 'صفحه اصلی', path: '/', icon: Home, color: 'from-primary-500 to-primary-600' },
  { id: 'products', label: 'محصولات', path: '/products', icon: Package, color: 'from-accent-500 to-accent-600' },
  { id: 'brands', label: 'برندها', path: '/brands', icon: Store, color: 'from-success-500 to-success-600' },
  { id: 'flash-sale', label: 'تخفیف‌های ویژه', path: '/products?discount=true', icon: Flame, color: 'from-error-500 to-error-600' },
  { id: 'orders', label: 'سفارشات من', path: '/dashboard/orders', icon: Package, color: 'from-warning-500 to-warning-600' },
  { id: 'wishlist', label: 'علاقه‌مندی‌ها', path: '/dashboard/wishlist', icon: Heart, color: 'from-error-500 to-error-600' },
  { id: 'tickets', label: 'تیکت‌های من', path: '/dashboard/tickets', icon: MessageCircle, color: 'from-orange-500 to-red-500' },
];

export const SECONDARY_MENU_ITEMS: SecondaryMenuItem[] = [
  { id: 'profile', label: 'پروفایل', path: '/dashboard/profile', icon: User },
  { id: 'contact', label: 'تماس با ما', path: '/contact', icon: Phone },
  { id: 'about', label: 'درباره ما', path: '/about', icon: Info },
  { id: 'guarantee', label: 'گارانتی', path: '/guarantee', icon: Shield },
  { id: 'help', label: 'راهنما', path: '/help', icon: HelpCircle },
];

// ==================== User Menu Items ====================

export const USER_MENU_ITEMS = [
  { icon: User, label: 'پروفایل من', path: '/dashboard/profile', color: 'text-primary-600 dark:text-primary-400' },
  { icon: Package, label: 'سفارشات من', path: '/dashboard/orders', color: 'text-accent-600 dark:text-accent-400' },
  { icon: Heart, label: 'علاقه‌مندی‌ها', path: '/dashboard/wishlist', color: 'text-error-500 dark:text-error-400' },
  { icon: Shield, label: 'آدرس‌های من', path: '/dashboard/addresses', color: 'text-success-600 dark:text-success-400' },
  { icon: MessageCircle, label: 'تیکت‌های من', path: '/dashboard/tickets', color: 'text-orange-600 dark:text-orange-400' },
];

// ==================== Constants ====================

export const SCROLL_THRESHOLD = 100;
export const SEARCH_HISTORY_LIMIT = 10;
export const SUPPORT_PHONE = '021-12345678';