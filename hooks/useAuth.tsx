
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Role } from '../types';
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

  // In a real app, this would involve a token, session storage, and API calls.
  // Here, we simulate it with a simple state.
  const login = async (username: string): Promise<boolean> => {
    // Simulate network delay
    await new Promise(res => setTimeout(res, 500));
    
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
