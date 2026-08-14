import { useState, useCallback, useRef, useEffect } from 'react';
import { EMAIL_VALIDATION_DELAY } from '../constants';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EmailValidation {
  email: string;
  emailError: string;
  setEmail: (value: string) => void;
  handleEmailChange: (value: string) => void;
  validateEmail: (value: string) => boolean;
}

/**
 * هوک اعتبارسنجی ایمیل
 * با debounce برای بهینه‌سازی
 */
export function useEmailValidation(): EmailValidation {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  /**
   * اعتبارسنجی فرمت ایمیل
   */
  const validateEmail = useCallback((value: string): boolean => {
    if (!value) {
      setEmailError('');
      return false;
    }
    
    if (!EMAIL_REGEX.test(value)) {
      setEmailError('لطفاً ایمیل معتبر وارد کنید');
      return false;
    }
    
    setEmailError('');
    return true;
  }, []);

  /**
   * مدیریت تغییر ایمیل با debounce
   */
  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      validateEmail(value);
    }, EMAIL_VALIDATION_DELAY);
  }, [validateEmail]);

  // پاک کردن timeout هنگام unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { 
    email, 
    emailError, 
    setEmail, 
    handleEmailChange, 
    validateEmail 
  };
}