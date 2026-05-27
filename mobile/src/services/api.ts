import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      // Navigation to login will be handled by auth store
    }
    return Promise.reject(error);
  }
);

// Helper to extract data from API response
export function extractData<T>(response: { data: { success: boolean; data: T } }): T {
  return response.data.data;
}

export function extractPaginatedData<T>(
  response: {
    data: {
      success: boolean;
      data: T;
      meta: { page: number; limit: number; total: number; totalPages: number };
    };
  }
) {
  return {
    data: response.data.data,
    meta: response.data.meta,
  };
}
