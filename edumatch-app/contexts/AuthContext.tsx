// import { authService } from '@/api/services/authServicr';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import React, { createContext, useContext, useEffect, useState } from 'react';

// export type UserRole = 'candidate' | 'recruiter';

// interface User {
//   role: UserRole;
//   name: string;
//   email: string;
//   title: string;
//   institution: string;
//   matchScore: number;
//   profileInitials: string;
//   organization?: string;
//   recruiterTitle?: string;
//   phoneNumber?: string;
//   location?: string;
//   linkedinProfileLink?: string;
//   personalWebsiteLink?: string;
//   skills?: string[];
//   professionalBio?: string;
//   experience?: Array<{ title?: string; company?: string; duration?: string }>;
//   education?: Array<{ degree?: string; institution?: string; year?: string }>;
//   preferredRole?: string;
//   preferredType?: string;
//   expectedSalary?: number;
//   pdfUrl?: string;
//   imageUrl?: string;
//   profileId?: string;

//   // recruiter profile fields
//   companyName?: string;
//   companyWebsite?: string;
//   companySize?: string;
//   industry?: string;
//   designation?: string;
// }

// interface AuthContextType {
//   user: User | null;
//   isLoading: boolean;
//   signIn: (email: string, password: string) => Promise<any>;
//   forgotPassword: (email: string) => Promise<void>;
//   resetPassword: (password: string, passwordConfirm: string) => Promise<any>;
//   signUp: (
//     name: string,
//     email: string,
//     password: string,
//     role?: UserRole,
//     extra?: { organization?: string },
//   ) => Promise<void>;
//   signOut: () => Promise<void>;
//   updateUser: (updates: Partial<User>) => Promise<void>;
//   updateUserLocally: (updates: Partial<User>) => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | null>(null);

// // ── shared helper: fetch /users/me and return merged user ──────────
// const fetchFullProfile = async (): Promise<User | null> => {
//   try {
//     const response = await authService.getCurrentUser();
//     return response?.data?.user ?? null;
//   } catch (_) {
//     return null;
//   }
// };

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [resetToken, setResetToken] = useState<string | null>(null);

//   // ── restore session on app launch ──────────────────────────────
//   useEffect(() => {
//     const restore = async () => {
//       const storedUser = await AsyncStorage.getItem('auth_user');
//       const storedToken = await AsyncStorage.getItem('authToken');

//       if (storedUser && storedToken) {
//         setUser(JSON.parse(storedUser)); // show cached immediately

//         // silently refresh full profile from backend
//         const freshUser = await fetchFullProfile();
//         if (freshUser) {
//           await AsyncStorage.setItem('auth_user', JSON.stringify(freshUser));
//           setUser(freshUser);
//         }
//       }

//       setIsLoading(false);
//     };
//     restore();
//   }, []);

//   // ── sign in ─────────────────────────────────────────────────────
//   const signIn = async (_email: string, _password: string) => {
//     try {
//       const response = await authService.loginUser(_email, _password);
//       const token = response.token;

//       // store token first so fetchFullProfile can use it
//       await AsyncStorage.setItem('authToken', token);

//       // fetch full merged profile immediately after login
//       const fullUser = await fetchFullProfile();
//       const userToStore = fullUser ?? response.data?.user;

//       setUser(userToStore);
//       await AsyncStorage.setItem('auth_user', JSON.stringify(userToStore));

//       return userToStore;
//     } catch (error: any) {
//       throw error;
//     }
//   };

//   // ── sign up ─────────────────────────────────────────────────────
//   const signUp = async (
//     name: string,
//     email: string,
//     _password: string,
//     role: UserRole = 'candidate',
//   ) => {
//     try {
//       const response = await authService.signUpUser(
//         name,
//         email,
//         _password,
//         role,
//       );
//       const token = response.token;

//       await AsyncStorage.setItem('authToken', token);

//       // fetch full merged profile immediately after signup
//       const fullUser = await fetchFullProfile();
//       const userToStore = fullUser ?? response.data?.user;

//       setUser(userToStore);
//       await AsyncStorage.setItem('auth_user', JSON.stringify(userToStore));
//     } catch (error: any) {
//       console.log('Signup Context Error =>', error?.response?.data?.message);
//     }
//   };

//   // ── forgot password ─────────────────────────────────────────────
//   const forgotPassword = async (email: string) => {
//     try {
//       if (!email) return { success: false, message: 'Email is required' };

//       const response = await authService.forgetPassword(email);
//       if (response.resetToken) {
//         setResetToken(response.resetToken);
//       }

//       return response;
//     } catch (error: any) {
//       const message =
//         error?.response?.data?.message ||
//         error?.message ||
//         'Something went wrong';
//       return { success: false, message };
//     }
//   };

//   // ── reset password ──────────────────────────────────────────────
//   const resetPassword = async (password: string, passwordConfirm: string) => {
//     try {
//       if (!password || !passwordConfirm)
//         return { success: false, message: 'Both fields are required!' };

//       if (!resetToken)
//         return {
//           success: false,
//           message: 'Reset token missing. Please request a new one.',
//         };

//       const response = await authService.resetPassword(
//         resetToken,
//         password,
//         passwordConfirm,
//       );

//       setResetToken(null);

//       return {
//         success: response.status === 'success',
//         message: response.message,
//       };
//     } catch (error: any) {
//       const message =
//         error?.response?.data?.message ||
//         error?.message ||
//         'Something went wrong';
//       return { success: false, message };
//     }
//   };

//   // ── sign out ────────────────────────────────────────────────────
//   const signOut = async () => {
//     setUser(null);
//     await AsyncStorage.multiRemove(['auth_user', 'authToken']);
//   };

//   // ── update user (calls backend then re-fetches full profile) ────
//   // const updateUser = async (payload: Partial<User>) => {
//   //   if (!user) return;
//   //   try {
//   //     await authService.updateUser(payload);

//   //     // re-fetch full merged profile so everything is in sync
//   //     const freshUser = await fetchFullProfile();
//   //     if (freshUser) {
//   //       setUser((cur) => {
//   //         const merged = {
//   //           ...freshUser,
//   //           imageUrl: freshUser.imageUrl ?? cur?.imageUrl, // preserve imageUrl
//   //         } as User;
//   //         AsyncStorage.setItem('auth_user', JSON.stringify(merged));
//   //         return merged;
//   //       });
//   //     }
//   //   } catch (error) {
//   //     console.error('Failed to update user profile:', error);
//   //   }
//   // };
//   const updateUser = async (payload: Partial<User>) => {
//     if (!user) return;
//     try {
//       const response = await authService.updateUser(payload);

//       // Use the merged user the backend just returned
//       const updatedUser = response?.data?.user;

//       if (updatedUser) {
//         const merged = {
//           ...updatedUser,
//           imageUrl: updatedUser.imageUrl ?? user.imageUrl, // preserve imageUrl
//         } as User;
//         setUser(merged);
//         await AsyncStorage.setItem('auth_user', JSON.stringify(merged));
//       } else {
//         // Fallback: re-fetch if backend didn't return merged user
//         const freshUser = await fetchFullProfile();
//         if (freshUser) {
//           setUser(freshUser);
//           await AsyncStorage.setItem('auth_user', JSON.stringify(freshUser));
//         }
//       }
//     } catch (error) {
//       console.error('Failed to update user profile:', error);
//       throw error; // re-throw so the edit screen can show an error alert
//     }
//   };
//   // ── update user locally only (no API call) ──────────────────────
//   const updateUserLocally = async (updates: Partial<User>) => {
//     setUser((currentUser) => {
//       if (!currentUser) return currentUser;
//       const merged = { ...currentUser, ...updates } as User;
//       AsyncStorage.setItem('auth_user', JSON.stringify(merged));
//       return merged;
//     });
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         isLoading,
//         signIn,
//         forgotPassword,
//         resetPassword,
//         signUp,
//         signOut,
//         updateUser,
//         updateUserLocally,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error('useAuth must be used within AuthProvider');
//   return ctx;
// }

import { authService } from '@/api/services/authServicr';
import { recruiterServices } from '@/api/services/recruiterService'; // adjust path if needed
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type UserRole = 'candidate' | 'recruiter';

interface User {
  role: UserRole;
  name: string;
  email: string;
  title: string;
  institution: string;
  matchScore: number;
  profileInitials: string;
  organization?: string;
  recruiterTitle?: string;
  phoneNumber?: string;
  location?: string;
  linkedinProfileLink?: string;
  personalWebsiteLink?: string;
  skills?: string[];
  professionalBio?: string;
  experience?: Array<{ title?: string; company?: string; duration?: string }>;
  education?: Array<{ degree?: string; institution?: string; year?: string }>;
  preferredRole?: string;
  preferredType?: string;
  expectedSalary?: number;
  pdfUrl?: string;
  imageUrl?: string;
  profileId?: string;

  // recruiter-specific fields
  companyName?: string;
  companyWebsite?: string;
  companySize?: string;
  industry?: string;
  designation?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string, passwordConfirm: string) => Promise<any>;
  signUp: (
    name: string,
    email: string,
    password: string,
    role?: UserRole,
    extra?: { organization?: string },
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  updateUserLocally: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ── shared helper: fetch /users/me and return merged user ──────────────────
const fetchFullProfile = async (): Promise<User | null> => {
  try {
    const response = await authService.getCurrentUser();
    // getCurrentUser returns response.data (axios), which is the full body:
    // { status: 'success', data: { user: mergedUser } }
    return response?.data?.user ?? null;
  } catch (_) {
    return null;
  }
};

// ── shared helper: persist user to storage ────────────────────────────────
const persistUser = async (user: User) => {
  await AsyncStorage.setItem('auth_user', JSON.stringify(user));
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resetToken, setResetToken] = useState<string | null>(null);

  // ── restore session on app launch ─────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      const storedUser = await AsyncStorage.getItem('auth_user');
      const storedToken = await AsyncStorage.getItem('authToken');

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser)); // show cached immediately

        // silently refresh full profile from backend
        const freshUser = await fetchFullProfile();
        if (freshUser) {
          await persistUser(freshUser);
          setUser(freshUser);
        }
      }

      setIsLoading(false);
    };
    restore();
  }, []);

  // ── sign in ──────────────────────────────────────────────────────────
  const signIn = async (_email: string, _password: string) => {
    try {
      const response = await authService.loginUser(_email, _password);
      const token = response.token;

      await AsyncStorage.setItem('authToken', token);

      const fullUser = await fetchFullProfile();
      const userToStore = fullUser ?? response.data?.user;

      setUser(userToStore);
      await persistUser(userToStore);

      return userToStore;
    } catch (error: any) {
      throw error;
    }
  };

  // ── sign up ──────────────────────────────────────────────────────────
  const signUp = async (
    name: string,
    email: string,
    _password: string,
    role: UserRole = 'candidate',
  ) => {
    try {
      const response = await authService.signUpUser(
        name,
        email,
        _password,
        role,
      );
      const token = response.token;

      await AsyncStorage.setItem('authToken', token);

      const fullUser = await fetchFullProfile();
      const userToStore = fullUser ?? response.data?.user;

      setUser(userToStore);
      await persistUser(userToStore);
    } catch (error: any) {
      console.log('Signup Context Error =>', error?.response?.data?.message);
    }
  };

  // ── forgot password ──────────────────────────────────────────────────
  const forgotPassword = async (email: string) => {
    try {
      if (!email) return { success: false, message: 'Email is required' };
      const response = await authService.forgetPassword(email);
      if (response.resetToken) setResetToken(response.resetToken);
      return response;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Something went wrong';
      return { success: false, message };
    }
  };

  // ── reset password ───────────────────────────────────────────────────
  const resetPassword = async (password: string, passwordConfirm: string) => {
    try {
      if (!password || !passwordConfirm)
        return { success: false, message: 'Both fields are required!' };
      if (!resetToken)
        return {
          success: false,
          message: 'Reset token missing. Please request a new one.',
        };

      const response = await authService.resetPassword(
        resetToken,
        password,
        passwordConfirm,
      );
      setResetToken(null);

      return {
        success: response.status === 'success',
        message: response.message,
      };
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Something went wrong';
      return { success: false, message };
    }
  };

  // ── sign out ─────────────────────────────────────────────────────────
  const signOut = async () => {
    setUser(null);
    await AsyncStorage.multiRemove(['auth_user', 'authToken']);
  };

  // ── update user ──────────────────────────────────────────────────────
  //
  // Root cause of the bug:
  //
  //   recruiterServices.updateRecruiterProfile() returns response.data
  //   which in axios is the FULL response body:
  //     { status: 'success', data: { user: mergedUser } }
  //
  //   So the merged user is at:  response.data.data.user   ← two .data levels
  //   NOT at:                    response.data.user        ← this was undefined
  //
  //   Because updatedUser was always undefined, the code fell through to
  //   fetchFullProfile() which was also not merging profile fields, so
  //   the UI never updated.
  //
  const updateUser = async (payload: Partial<User>) => {
    if (!user) return;
    try {
      let mergedUser: User | null = null;

      if (user.role === 'recruiter') {
        const res = await recruiterServices.updateRecruiterProfile(payload);

        mergedUser = res?.data?.user ?? null;
      } else {
        // ── Candidate path ───────────────────────────────────────────
        // authService.updateUser returns response.data
        // Full shape: { status, data: { user, userProfile } }
        const res = await authService.updateUser(payload);

        // Merge user + userProfile into one flat object
        const baseUser = res?.data?.user ?? null;
        const profile = res?.data?.userProfile ?? {};
        if (baseUser) {
          const {
            _id: profileId,
            user: _,
            createdAt,
            updatedAt,
            __v,
            ...profileFields
          } = profile;
          mergedUser = { ...baseUser, ...profileFields, profileId } as User;
        }
      }

      if (mergedUser) {
        // Preserve imageUrl if backend didn't return one
        const final = {
          ...mergedUser,
          imageUrl: mergedUser.imageUrl ?? user.imageUrl,
        } as User;
        setUser(final); // ✅ UI updates instantly
        await persistUser(final); // ✅ persists across restarts
      } else {
        // Last-resort fallback: re-fetch full profile from /users/me
        // (only hits if backend returns unexpected shape)
        console.warn(
          'updateUser: no mergedUser in response, falling back to fetchFullProfile',
        );
        const freshUser = await fetchFullProfile();
        if (freshUser) {
          const final = {
            ...freshUser,
            imageUrl: freshUser.imageUrl ?? user.imageUrl,
          } as User;
          setUser(final);
          await persistUser(final);
        }
      }
    } catch (error: any) {
      console.error('updateUser error =>', error?.response?.data ?? error);
      throw error; // re-throw so edit screens can show an error alert
    }
  };

  // ── update user locally only (no API call) ───────────────────────────
  const updateUserLocally = async (updates: Partial<User>) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;
      const merged = { ...currentUser, ...updates } as User;
      AsyncStorage.setItem('auth_user', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        forgotPassword,
        resetPassword,
        signUp,
        signOut,
        updateUser,
        updateUserLocally,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
