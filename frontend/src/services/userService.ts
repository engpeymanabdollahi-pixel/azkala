const USE_MOCK = true;

// داده mock برای کاربر
const mockUser = {
  id: 1,
  name: 'کاربر تست',
  email: 'user@test.com',
  phone: '09123456789',
  avatar: '',
};

export const userService = {
  getProfile: async () => {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300));
      return { data: mockUser };
    }
    throw new Error('API not implemented');
  },
  updateProfile: async (data: any) => {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 500));
      return { data: { ...mockUser, ...data } };
    }
    throw new Error('API not implemented');
  },
  changePassword: async (oldPassword: string, newPassword: string) => { /* ... */ },
};