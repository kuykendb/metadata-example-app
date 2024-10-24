import { MetadataMapping } from "./data";

export async function getMappings(): Promise<MetadataMapping[]> {
  const response = await fetch("/api/mappings");
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.mappings;
}


export async function addMapping(description: string, source: string): Promise<string> {
  const response = await fetch("/api/mappings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      description,
      source,
    }),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.mappingId;
}

export async function updateMapping(mappingId: string, target: string): Promise<void> {
  const response = await fetch(`/api/mappings/${mappingId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      target,
    }),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
}

export async function getMapping(mappingId: string): Promise<MetadataMapping | undefined> {
  const response = await fetch(`/api/mappings/${mappingId}`, {
    method: "GET",
  });

  if (!response.ok) {
    if (response.status === 404) {
      return undefined;
    }
    throw new Error(`Request failed with status ${response.status}`);
  }
  const data = await response.json();
  if (!data || !data.mapping) {
    throw new Error("Error fetching mapping", data);
  }
  return await data.mapping as MetadataMapping;
}