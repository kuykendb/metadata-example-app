'use client'

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { MetadataMapping } from './data';
import { getMappings } from './api';

interface AppContextType {
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  mappings: MetadataMapping[];
  setMappings: React.Dispatch<React.SetStateAction<MetadataMapping[]>>;
  refreshMappings: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useMappings(): MetadataMapping[] {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useMappings must be used within a AppContextProvider');
  }
  return context.mappings;
};

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within a AppContextProvider');
  }
  return context;
}

interface AppContextProviderProps {
  children: ReactNode;
}

export const AppContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {
  const [mappings, setMappings] = useState<MetadataMapping[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshMappings = async () => {
    try {
      setLoading(true);
      setMappings(await getMappings());
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch mappings:', error);
    }
  };

  useEffect(() => {
    refreshMappings();
  }, []);

  return (
    <AppContext.Provider value={{ mappings, setMappings, refreshMappings, loading, setLoading }}>
      {children}
    </AppContext.Provider>
  );
};
