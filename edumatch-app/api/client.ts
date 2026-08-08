import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ROUTES } from '.';

function isFormDataLike(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  if (data instanceof FormData) return true;

  const maybe = data as { append?: unknown; _parts?: unknown };
  return typeof maybe.append === 'function' || Array.isArray(maybe._parts);
}

// Create axios instance with base configuration
// Default timeout 10s; use per-request timeout for long ops (e.g. image upload)
export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_ROUTES.BASE_URL}${API_ROUTES.API_VERSION}`,
  timeout: 200000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // FormData must use multipart/form-data with boundary; axios sets it only if we don't override
    if (isFormDataLike(config.data) && config.headers) {
      // React Native Android can fail to infer multipart if JSON content-type leaks from defaults.
      // Use explicit multipart for FormData-like payloads.
      (config.headers as any)['Content-Type'] = 'multipart/form-data';
      (config.headers as any).Accept = 'application/json';
      console.log(`[Request] FormData upload to ${config.url}`, {
        method: config.method,
        timeout: config.timeout,
        headers: { ...config.headers },
        formDataParts: (config.data as any)._parts?.length ?? 'unknown',
      });
    } else {
      console.log(`[Request] ${config.method?.toUpperCase()} ${config.url}`, {
        timeout: config.timeout,
      });
    }

    const token = await AsyncStorage.getItem('authToken');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('[Request] Interceptor error:', error.message);
    return Promise.reject(error);
  },
);

// Response interceptor – reject with full error so callers can read response.data (e.g. isSuccess)
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`[Response] ${response.status} ${response.config.url}`, {
      dataSize: JSON.stringify(response.data).length,
    });
    return response;
  },
  (error) => {
    const message = error.response?.data?.message ?? error.message;
    if (message) console.error('API Error:', message);

    // Log detailed error info for debugging network issues
    if (!error.response) {
      console.error('Network Error Details:', {
        code: error.code,
        message: error.message,
        baseURL: error.config?.baseURL,
        url: error.config?.url,
        method: error.config?.method,
        isNetworkError: !error.response && error.message === 'Network Error',
        errno: error.errno,
        syscall: error.syscall,
      });
    } else {
      console.error('HTTP Error:', {
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method,
      });
    }

    return Promise.reject(error);
  },
);
