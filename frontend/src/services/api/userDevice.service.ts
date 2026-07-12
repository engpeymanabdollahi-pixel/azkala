import apiClient from './client';

export interface UserDevice {
  id: number;
  user_id: number;
  phone_model_id: number;
  nickname?: string;
  created_at: string;
  phone_model?: {
    id: number;
    name: string;
    brand?: { id: number; name: string };
    series?: { id: number; name: string };
  };
}

export interface UserDevicesResponse {
  success: boolean;
  data: UserDevice[];
}

export const userDeviceService = {
  /**
   * دریافت لیست دستگاه‌های کاربر
   */
  async getMyDevices(): Promise<UserDevicesResponse> {
    const response = await apiClient.get<UserDevicesResponse>('/user/devices');
    return response.data;
  },
};