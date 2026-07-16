import { useState, useCallback } from 'react';
import { cartService, CartResponse } from '@/services/api/cart.service';
import { toast } from 'react-hot-toast';

export function useCart() {
  const [cart, setCart] = useState<CartResponse['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // دریافت اطلاعات سبد خرید
  const fetchCart = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await cartService.getCart();
      if (response.success) {
        setCart(response.data);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'خطا در دریافت سبد خرید';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // افزودن محصول به سبد (با پشتیبانی از deviceModelId)
  const addToCart = async (productId: number, quantity: number = 1, deviceModelId?: number) => {
    setIsLoading(true);
    try {
      const response = await cartService.addToCart(productId, quantity, deviceModelId);
      if (response.success) {
        toast.success(response.message || 'محصول به سبد خرید اضافه شد');
        await fetchCart(); // به‌روزرسانی خودکار سبد پس از افزودن
        return true;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'خطا در افزودن به سبد خرید';
      toast.error(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // به‌روزرسانی تعداد محصول
  const updateQuantity = async (cartItemId: number, quantity: number) => {
    try {
      const response = await cartService.updateQuantity(cartItemId, quantity);
      if (response.success) {
        toast.success('تعداد محصول به‌روزرسانی شد');
        await fetchCart();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'خطا در به‌روزرسانی تعداد';
      toast.error(msg);
    }
  };

  // حذف محصول از سبد
  const removeItem = async (cartItemId: number) => {
    try {
      const response = await cartService.removeItem(cartItemId);
      if (response.success) {
        toast.success('محصول از سبد حذف شد');
        await fetchCart();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'خطا در حذف محصول';
      toast.error(msg);
    }
  };

  return { 
    cart, 
    isLoading, 
    error, 
    fetchCart, 
    addToCart, 
    updateQuantity, 
    removeItem 
  };
}