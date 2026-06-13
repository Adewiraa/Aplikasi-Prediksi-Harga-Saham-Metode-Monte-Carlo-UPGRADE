'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: 'admin' | 'user' | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInDemo: (email: string, name: string, role: 'admin' | 'user') => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  loading: true,
  signOut: async () => {},
  signInDemo: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<'admin' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cek apakah ada sesi demo offline di localStorage
    const localUser = typeof window !== 'undefined' ? localStorage.getItem('mock_user') : null;
    const localRole = typeof window !== 'undefined' ? localStorage.getItem('mock_role') : null;

    if (localUser) {
      setUser(JSON.parse(localUser));
      setRole((localRole as 'admin' | 'user') || 'admin');
      setLoading(false);
    } else {
      // 1. Ambil session saat ini dari Supabase
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setRole(session.user.user_metadata?.role || 'admin');
        }
        setLoading(false);
      });
    }

    // 2. Dengarkan perubahan auth state Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Jika ada user mock offline, abaikan perubahan auth state Supabase
        if (typeof window !== 'undefined' && localStorage.getItem('mock_user')) {
          return;
        }
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setRole(session.user.user_metadata?.role || 'admin');
        } else {
          setRole(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mock_user');
      localStorage.removeItem('mock_role');
    }
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // Abaikan jika offline/error
    }
    setUser(null);
    setSession(null);
    setRole(null);
    setLoading(false);
  };

  const signInDemo = (email: string, name: string, role: 'admin' | 'user') => {
    const mockUser = {
      id: 'mock-id-12345',
      email,
      user_metadata: {
        full_name: name,
        role: role
      }
    } as any;

    if (typeof window !== 'undefined') {
      localStorage.setItem('mock_user', JSON.stringify(mockUser));
      localStorage.setItem('mock_role', role);
    }

    setUser(mockUser);
    setRole(role);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signOut, signInDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
