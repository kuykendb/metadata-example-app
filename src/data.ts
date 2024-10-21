import { sql } from "@vercel/postgres";

export type MappingStatus =
  "pending"
  | "ask-for-input"
  | "auto-mapped"
  | "user-mapped";

export interface MetadataMapping {
  description: string;
  source: string;
  target: string;
  id: string;
  mapping_id: string;
  status: MappingStatus;
}

export async function addMapping(
  description: string,
  source: string,
  status: MappingStatus,
  mappingId: string
): Promise<void> {
  // In a real env make sure there's a unique constraint on the mapping_id
  await sql`
    INSERT INTO mappings (description, source, status, mapping_id)
    VALUES (${description}, ${source}, ${status}, ${mappingId});
  `;
}

export async function getMappings(): Promise<MetadataMapping[]> {
  const { rows } = await sql`SELECT * FROM mappings ORDER BY id DESC`;
  return rows as MetadataMapping[];
}

export async function updateMapping(
  mappingId: string,
  target: string,
  status: MappingStatus
): Promise<void> {
  await sql`
        UPDATE mappings SET target=${target}, status=${status}
        WHERE mapping_id=${mappingId};
      `;
}

export async function getMapping(
  mappingId: string,
): Promise<MetadataMapping | undefined> {
  const { rows } = await sql`
    SELECT * FROM mappings 
    WHERE mapping_id = ${mappingId}
  `;
  if (rows.length === 0) {
    return undefined;
  }
  if (rows.length > 1) {
    // Shouldn't happen
    throw new Error("More than one mapping found for id");
  }
  return rows[0] as MetadataMapping;
}

export async function deleteMapping(id: string): Promise<void> {
  await sql`DELETE FROM mappings WHERE id = ${id};`;
}