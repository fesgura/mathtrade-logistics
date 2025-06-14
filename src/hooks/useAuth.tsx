"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useRouter, usePathname } from 'next/navigation';

interface UserDetails {
  id: number | string;
  first_name: string;
  last_name?: string;
  role?: string;
}

interface AuthContextType {
  isAuthenticated: boolean | null;
  userName: string | null;
  userId: string | null;
  userRole: string | null;
  isLoading: boolean;
  isHighContrast: boolean;
  login: (token: string, userDetails: UserDetails) => void;
  logout: () => void;
  toggleHighContrast: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('highContrastEnabled') === 'true';
    }
    return false;
  });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUserName = localStorage.getItem('userName');
    const storedUserId = localStorage.getItem('userId');
    // const storedUserRole = localStorage.getItem('userRole'); // TODO: descomentar

    if (token && storedUserName && storedUserId) {
      setIsAuthenticated(true);
      setUserName(storedUserName);
      setUserId(storedUserId);
      // TODO: descomentar y borrar mock
      // setUserRole(storedUserRole || 'USER');
      setUserRole('ADMIN')
    } else {
      setIsAuthenticated(false);
      setUserName(null);
      setUserId(null);
      setUserRole(null);
      if (pathname !== '/login') {
        router.push('/login');
      }
    }
    setIsLoading(false);
  }, [router, pathname]);

  const toggleHighContrast = useCallback(() => {
    setIsHighContrast(prev => {
      const newState = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('highContrastEnabled', String(newState));
      }
      return newState;
    });
  }, []);

  const login = useCallback((token: string, userDetails: UserDetails) => {
    const name = `${userDetails.first_name} ${userDetails.last_name || ''}`.trim();
    const role = userDetails.role || 'USER';
    const idStr = userDetails.id?.toString() || null;

    localStorage.setItem('authToken', token);
    localStorage.setItem('userName', name);
    if (idStr) {
      localStorage.setItem('userId', idStr);
    } else {
      localStorage.removeItem('userId');
    }
    localStorage.setItem('userRole', role);

    setIsAuthenticated(true);
    setUserName(name);
    setUserRole(role);
    setUserId(idStr);
    router.push('/');
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    setIsAuthenticated(false);
    setUserName(null);
    setUserId(null);
    setUserRole(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userName,
        userId,
        userRole,
        isLoading,
        isHighContrast,
        login,
        logout,
        toggleHighContrast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};