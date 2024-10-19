"use server";
import { sql } from "@vercel/postgres";

export async function deleteMapping(id: string) {
  await sql`DELETE FROM Mappings WHERE id = ${id};`;
}
