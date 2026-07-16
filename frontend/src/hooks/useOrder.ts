import { useState, useCallback } from 'react';
import { orderService, CreateOrderRequest, OrdersResponse } from '@/services/api/order.service';
import { toast } from 'react-hot-toast';

export function useOrder() {
  const [orders, setOrders] = useState<OrdersResponse['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // دریافت لیست سفارشات کاربر
  const fetchOrders = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await orderService.getOrders(page);
      if (response.success) {
        setOrders(response.data);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'خطا در دریافت لیست سفارشات';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ثبت سفارش جدید
  const createOrder = async (data: CreateOrderRequest) => {
    setIsLoading(true);
    try {
      const response = await orderService.createOrder(data);
      if (response.success) {
        toast.success(response.message || 'سفارش شما با موفقیت ثبت شد');
        return response.data; // شامل order_number و payment_url می‌شود
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'خطا در ثبت سفارش';
      toast.error(msg);
      throw err; // خطا را پرتاب می‌کنیم تا کامپوننت بتواند ریدایرکت یا منطق خاص خود را اجرا کند
    } finally {
      setIsLoading(false);
    }
  };

  // لغو سفارش
  const cancelOrder = async (orderId: number) => {
    try {
      const response = await orderService.cancelOrder(orderId);
      if (response.success) {
        toast.success('سفارش با موفقیت لغو شد');
        await fetchOrders(); // به‌روزرسانی لیست سفارشات
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'خطا در لغو سفارش';
      toast.error(msg);
    }
  };

  return { 
    orders, 
    isLoading, 
    error, 
    fetchOrders, 
    createOrder, 
    cancelOrder 
  };
}