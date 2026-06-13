'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface CustomUser {
  id: string | number;
  nama: string;
  username: string;
  level: 'Admin' | 'User';
}

interface AuthContextType {
  user: CustomUser | null;
  role: 'admin' | 'user' | null;
  loading: boolean;
  signIn: (userData: CustomUser) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  signIn: () => {},
  signOut: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [role, setRole] = useState<'admin' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Muat session dari localStorage saat inisialisasi
    const storedSession = typeof window !== 'undefined' ? localStorage.getItem('custom_session_user') : null;
    if (storedSession) {
      try {
        const userData = JSON.parse(storedSession) as CustomUser;
        setUser(userData);
        setRole(userData.level.toLowerCase() as 'admin' | 'user');
      } catch (err) {
        console.error('Failed to parse user session:', err);
      }
    }
    setLoading(false);
  }, []);

  const signIn = (userData: CustomUser) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('custom_session_user', JSON.stringify(userData));
    }
    setUser(userData);
    setRole(userData.level.toLowerCase() as 'admin' | 'user');
  };

  const signOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('custom_session_user');
    }
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
