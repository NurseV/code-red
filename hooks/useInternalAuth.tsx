import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';
import * as api from '../services/api';

interface InternalAuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string) => Promise<boolean>;
  logout: () => void;
}

const InternalAuthContext = createContext<InternalAuthContextType | undefined>(undefined);

export const InternalAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (username: string): Promise<boolean> => {
    const loggedInUser = await api.loginInternalUser(username);
    if (loggedInUser) {
        setUser(loggedInUser);
        return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const value = {
    isAuthenticated: !!user,
    user,
    login,
    logout,
  };

  return <InternalAuthContext.Provider value={value}>{children}</InternalAuthContext.Provider>;
};

export const useInternalAuth = (): InternalAuthContextType => {
  const context = useContext(InternalAuthContext);
  if (context === undefined) {
    throw new Error('useInternalAuth must be used within an InternalAuthProvider');
  }
  return context;
};
