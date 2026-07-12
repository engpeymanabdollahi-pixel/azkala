import apiClient from './client';

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      name: string;
      email: string;
      phone: string;
      role: string;
    };
  };
}

export const profileService = {
  /**
   * به‌روزرسانی اطلاعات پروفایل
   */
  async updateProfile(data: UpdateProfileRequest): Promise<ProfileResponse> {
    const response = await apiClient.put<ProfileResponse>('/user', data);
    return response.data;
  },

  /**
 * تغییر رمز عبور
 */
async changePassword(data: { 
  current_password: string; 
  password: string; 
  password_confirmation: string; 
}): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post('/user/change-password', data);
  return response.data;
},
};