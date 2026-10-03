"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { User, RegisterInput, AuthResponse, MeResponse } from "@/types";
import { toast } from "sonner";

interface UserResponse {
  success: boolean;
  data: User;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string; email?: string; password?: string }) => Promise<User>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    setUser(null);
    toast.info("Logged out successfully");
    router.push("/login");
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get<MeResponse>("/auth/me");
        if (!cancelled) {
          setUser(response.data.data.user);
        }
      } catch {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
        }
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await api.post<AuthResponse>("/auth/login", {
          email,
          password,
        });

        const { token, user } = response.data.data;

        if (typeof window !== "undefined") {
          localStorage.setItem("token", token);
        }

        setUser(user);
        toast.success(`Welcome back, ${user.name}`);
        router.push("/");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Login failed";
        toast.error(message);
        throw err;
      }
    },
    [router]
  );

  const register = useCallback(
    async (data: RegisterInput) => {
      try {
        await api.post<AuthResponse>("/auth/register", data);
        toast.success("Account created successfully. Please log in.");
        router.push("/login");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Registration failed";
        toast.error(message);
        throw err;
      }
    },
    [router]
  );

  const updateProfile = useCallback(
    async (data: { name?: string; email?: string; password?: string }) => {
      if (!user) {
        throw new Error("Not authenticated");
      }

      try {
        const response = await api.put<UserResponse>(`/users/${user.id}`, data);
        const updatedUser = response.data.data;
        setUser(updatedUser);
        toast.success("Profile updated successfully");
        return updatedUser;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update profile";
        toast.error(message);
        throw err;
      }
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      login,
      register,
      logout,
      updateProfile,
      loading,
    }),
    [user, login, register, logout, updateProfile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
