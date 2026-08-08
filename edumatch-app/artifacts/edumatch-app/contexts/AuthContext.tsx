import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type UserRole = "candidate" | "recruiter";

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
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string, role?: UserRole) => Promise<void>;
  signUp: (name: string, email: string, password: string, role?: UserRole, extra?: { organization?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_CANDIDATE: User = {
  role: "candidate",
  name: "Dr. Aisha Raza",
  email: "aisha.raza@iisat.edu.pk",
  title: "Assistant Professor",
  institution: "IISAT University",
  matchScore: 87,
  profileInitials: "AR",
};

const MOCK_RECRUITER: User = {
  role: "recruiter",
  name: "Sarah Mitchell",
  email: "sarah@stanford.edu",
  title: "HR Director",
  institution: "Stanford University",
  organization: "Stanford University",
  recruiterTitle: "HR Director",
  matchScore: 0,
  profileInitials: "SM",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("auth_user").then((stored) => {
      if (stored) setUser(JSON.parse(stored));
      setIsLoading(false);
    });
  }, []);

  const signIn = async (_email: string, _password: string, role: UserRole = "candidate") => {
    const mock = role === "recruiter" ? MOCK_RECRUITER : MOCK_CANDIDATE;
    setUser(mock);
    await AsyncStorage.setItem("auth_user", JSON.stringify(mock));
  };

  const signUp = async (name: string, email: string, _password: string, role: UserRole = "candidate", extra?: { organization?: string }) => {
    const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    const base = role === "recruiter" ? MOCK_RECRUITER : MOCK_CANDIDATE;
    const newUser: User = {
      ...base,
      name,
      email,
      profileInitials: initials,
      matchScore: role === "candidate" ? 42 : 0,
      organization: extra?.organization ?? base.organization,
    };
    setUser(newUser);
    await AsyncStorage.setItem("auth_user", JSON.stringify(newUser));
  };

  const signOut = async () => {
    setUser(null);
    await AsyncStorage.removeItem("auth_user");
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...updates };
      setUser(updated);
      AsyncStorage.setItem("auth_user", JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
