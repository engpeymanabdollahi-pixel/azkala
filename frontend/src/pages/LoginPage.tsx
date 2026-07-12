import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) => authService.login(data),
    onSuccess: (response) => {
      toast.success(response.message);
      navigate('/');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'خطا در ورود');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">ورود به ازکالا</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">ایمیل</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">رمز عبور</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loginMutation.isPending ? 'در حال ورود...' : 'ورود'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          حساب کاربری ندارید؟{' '}
          <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold">
            ثبت‌نام کنید
          </Link>
        </p>
      </div>
    </div>
  );
};