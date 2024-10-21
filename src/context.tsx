"use client"

import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { MetadataMapping, MappingStatus } from "./data";
import { 
  getMapping,
  getMappings,
  addMapping as apiAddMapping,
  updateMapping as apiUpdateMapping
} from "./api";

const STATUS_POLL_INTERVAL = 500;

interface AppContextType {
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  mappings: MetadataMapping[];
  setMappings: React.Dispatch<React.SetStateAction<MetadataMapping[]>>;
  refreshMappings: () => Promise<void>;
  addMapping: (description: string, source: string) => Promise<string>;
  updateMapping: (mappingId: string, target: string) => Promise<void>;
  pollMappingId: string | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useMappings(): MetadataMapping[] {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useMappings must be used within a AppContextProvider");
  }
  return context.mappings;
};

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within a AppContextProvider");
  }
  return context;
}

interface AppContextProviderProps {
  children: ReactNode;
}

export const AppContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {
  const [mappings, setMappings] = useState<MetadataMapping[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pollMappingId, setPollMappingId] = useState<string | undefined>(undefined);

  const addMapping = async (description: string, source: string): Promise<string> => {
    return _addMapping(
      refreshMappings,
      setPollMappingId,
      description,
      source,
    );
  }

  const updateMapping = async (mappingId: string, target: string): Promise<void> => {
    return _updateMapping(
      refreshMappings,
      setPollMappingId,
      mappingId,
      target,
    );
  }

  const refreshMappings = async () => {
    try {
      setLoading(true);
      setMappings(await getMappings());
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch mappings:", error);
    }
  };

  useEffect(() => {
    refreshMappings();
  }, []);

  const contextValue = {
    mappings,
    setMappings,
    refreshMappings,
    loading,
    setLoading,
    addMapping,
    updateMapping,
    pollMappingId,
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};


async function _addMapping(
  refreshMappings: () => Promise<void>,
  setPollMappingId: React.Dispatch<React.SetStateAction<string | undefined>>,
  description: string,
  source: string,
): Promise<string> {
  const mappingId = await apiAddMapping(description, source);

  // Poll until mapping is created. The initial status should be "pending".
  let mapping: MetadataMapping | undefined;
  while (true) {
    mapping = await getMapping(mappingId);
    if (mapping) {
      break;
    }
  }
  // Refresh the table so the pending mapping can show up.
  await refreshMappings();

  if (!mapping) {
    throw new Error("Mapping not found");
  }
  
  // Wait until the status has been updated to either ask for input or
  // indicate that the mapping was auto-mapped.
  const expectedStatuses: MappingStatus[] = ["ask-for-input", "auto-mapped"];

  // don't block while polling for mapping status updates so the UI can update
  _pollForMappingStatus(
    refreshMappings,
    setPollMappingId,
    mapping,
    expectedStatuses,
  );
  return mappingId;
}

async function _updateMapping(
  refreshMappings: () => Promise<void>,
  setPollMappingId: React.Dispatch<React.SetStateAction<string | undefined>>,
  mappingId: string,
  target: string,
) {
  await apiUpdateMapping(mappingId, target);
  const mapping = await getMapping(mappingId);
  if (!mapping) {
    throw new Error("Mapping not found");
  }
  // Wait until the status reports as updated by the user
  const expectedStatuses: MappingStatus[] = ["user-mapped"];
  _pollForMappingStatus(
    refreshMappings,
    setPollMappingId,
    mapping,
    expectedStatuses,
  );
}

async function _pollForMappingStatus(
  refreshMappings: () => Promise<void>,
  setPollMappingId: React.Dispatch<React.SetStateAction<string | undefined>>,
  mapping: MetadataMapping,
  expectedStatuses: MappingStatus[] = [],
  
) {
  console.log("Polling for mapping status", mapping, expectedStatuses);
  setPollMappingId(mapping.mapping_id);

  let status = mapping.status;
  while (!expectedStatuses.includes(status)) {
    const updatedMapping = await getMapping(mapping.mapping_id);
    if (!updatedMapping) {
      throw new Error("Mapping not found");
    }
    status = updatedMapping.status;
    await new Promise((resolve) => setTimeout(resolve, STATUS_POLL_INTERVAL));
  }
  console.log("Mapping status updated", status, expectedStatuses);
  setPollMappingId(undefined);
  refreshMappings();
}