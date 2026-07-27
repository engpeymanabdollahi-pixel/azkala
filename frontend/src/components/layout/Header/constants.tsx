import {
  Home, Package, Store, Flame, Heart, MessageCircle,
  User, Phone, Info, Shield, HelpCircle
} from 'lucide-react';
import type { NavItem, MobileMenuItem, SecondaryMenuItem } from './types';

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