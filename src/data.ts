export interface Mapping {
  id: string;
  description: string;
  source: string;
  target: string;
  status: string;
}

export type MappingStatus = "pending" | "prompt-for-input" | "auto-mapped" | "user-mapped";

export interface MetadataMapping {
  description: string;
  source: string;
  target: string;
  id: string;
  mappingId: string;
  status: MappingStatus;
}


// Add mapping to table with pending status
// Call OpenAI to get a target value and see if we need to ask user
// Update table with status and target value
