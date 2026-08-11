/**
 * AZKALA MARKETPLACE COMPONENTS
 *
 * کامپوننت‌های اختصاصی ازکالا برای Marketplace
 * این کامپوننت‌ها **هویت واقعی Design System ازکالا** هستند
 * و بر اساس سند مرجع طراحی شده‌اند.
 */

// Device-First Components (هویت اصلی ازکالا)
export { DeviceCompatibility } from './DeviceCompatibility';
export type { CompatibilityVariant } from './DeviceCompatibility';

export { DeviceSelector } from './DeviceSelector';
export type { DeviceSelectorVariant } from './DeviceSelector';

// Marketplace Core
export { ProductCard } from './ProductCard';
export type { ProductCardProps, ProductCardVariant } from './ProductCard';
// Seller Components
export { SellerCard } from './SellerCard';
export type { SellerCardProps, SellerCardVariant, SellerData } from './SellerCard';