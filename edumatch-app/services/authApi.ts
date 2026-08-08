import axios from 'axios';
import { BASE_URL } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/api/services/authServicr';

export const handleLogin = async (
  email: string,
  password: string,
): Promise<string> => {
  if (!email || !password) {
    throw new Error('Please enter email and password');
  }
  try {
    console.log('response', response.data);

    const token: string = response.data.token;

    if (!token) throw new Error('Token not received');

    await AsyncStorage.setItem('token', token);

    return token;
  } catch (err: any) {
    console.log('ERROR DATA:', err?.response?.data);
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      'Login failed Please Enter Correct Password and Email.';
    throw new Error(message);
  }
};
