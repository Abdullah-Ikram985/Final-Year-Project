import { API_ROUTES } from '..';
import { apiClient } from '../client';

export const authService = {
  loginUser: async (
    email: string,
    password: string,
  ): Promise<{ token: string; user: any }> => {
    const response = await apiClient.post<{ token: string; user: any }>(
      `${API_ROUTES.LOGIN}`,
      {
        email,
        password,
      },
    );
    return response.data;
  },
  signUpUser: async (
    name: string,
    email: string,
    password: string,
    role: string,
  ) => {
    const response = await apiClient.post<{ token: string; user: any }>(
      `${API_ROUTES.SIGNUP}`,
      {
        name,
        email,
        password,
        role,
      },
    );
    // console.log('Services Signup ', response.data);
    return response.data;
  },
  loginWithGoogle: async (
    googleToken: string,
  ): Promise<{ token: string; user: User }> => {
    const response = await apiClient.post<{ token: string; user: User }>(
      `${API_ROUTES.AUTH.AUTH}`,
      {
        token: googleToken,
      },
    );
    return response.data;
  },
  // Create new user
  createUser: async (userData: CreateUserData): Promise<User> => {
    const response = await apiClient.post<User>(
      `${API_ROUTES.AUTH.SIGN_UP}`,
      userData,
    );
    return response.data;
  },

  forgetPassword: async (email: string) => {
    const response = await apiClient.post(`${API_ROUTES.FORGOTPASSWORD}`, {
      email,
    });

    return response.data;
  },

  resetPassword: async (
    token: string | null,
    password: string,
    passwordConfirm: string,
  ) => {
    console.log('Auth Services Api Call');
    if (!token) {
      return {
        success: false,
        message: 'Reset token missing. Please request a new one.',
      };
    }
    const route = API_ROUTES.RESETPASSWORD.replace(':token', token);
    const response = await apiClient.patch(route, {
      password,
      passwordConfirm,
    });
    // const response = await apiClient.patch(`${API_ROUTES.RESETPASSWORD}`, {
    //   password,
    //   passwordConfirm,
    // });
    console.log('Reset Password Api =>', response.data);
    return response.data;
  },

  // Update user
  updateUser: async (userData: any): Promise<any> => {
    const response = await apiClient.patch<any>(
      `${API_ROUTES.UPDATE_PROFILE}`,
      userData,
    );
    return response.data;
  },
  profileUpdate: async (profile: FormData): Promise<any> => {
    const response = await apiClient.post<User>(
      `${API_ROUTES.PROFILE.UPDATE_PROFILE}`,
      profile,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get(API_ROUTES.GET_ME);
    return response.data;
  },
  // Get all users
  getAllUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>(
      `${API_ROUTES.USERS.ALL_USERS}`,
    );
    return response.data;
  },
  // Delete user
  deleteUser: async (userId: number): Promise<void> => {
    await apiClient.delete(`/users/${userId}`);
  },
};
