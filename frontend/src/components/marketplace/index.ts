/**
 * AZKALA MARKETPLACE COMPONENTS
 *
 * کامپوننت‌های اختصاصی ازکالا برای Marketplace
 * این کامپوننت‌ها **هویت واقعی Design System ازکالا** هستند
 * و بر اساس سند مرجع طراحی شده‌اند.
 * 
 * مطابق Design System ازکالا (بخش ۸):
 * - Product Components
 * - Seller Components
 * - Device-First Components
 * - Compare Components
 * - Cart Components
 */

// ==================== Device-First Components (هویت اصلی ازکالا) ====================
export { DeviceCompatibility } from './DeviceCompatibility';
export type { CompatibilityVariant } from './DeviceCompatibility';

export { DeviceSelector } from './DeviceSelector';
export type { DeviceSelectorVariant } from './DeviceSelector';

// ==================== Product Components ====================
export { ProductCard } from './ProductCard';
export type { ProductCardProps, ProductCardVariant } from './ProductCard';

export { ProductGallery } from './ProductGallery';

export { ProductPrice } from './ProductPrice';
export type { ProductPriceProps } from './ProductPrice';

export { ProductRating } from './ProductRating';
export type { ProductRatingProps } from './ProductRating';

export { RatingSummary } from './RatingSummary';
export type { RatingSummaryProps, RatingDistributionItem } from './RatingSummary';

export { ProductStock } from './ProductStock';
export type { ProductStockProps } from './ProductStock';

export { RelatedProducts } from './RelatedProducts';
export type { RelatedProductsProps } from './RelatedProducts';

// ==================== Seller Components ====================
export { SellerCard } from './SellerCard';
export type { SellerCardProps, SellerCardVariant, SellerData } from './SellerCard';

export { SellerInfoCard } from './SellerInfoCard';
export type { SellerInfoCardProps, SellerInfoCardData } from './SellerInfoCard';

// ==================== Cart Components ====================
export { QuantitySelector } from './QuantitySelector';
export type { QuantitySelectorProps } from './QuantitySelector';

// ==================== Compare Components ====================
export { CompareBar } from './CompareBar';

export { ProductImage } from './ProductImage';
export type { ProductImageProps } from './ProductImage';