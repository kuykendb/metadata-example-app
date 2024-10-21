"use server";
import { deleteMapping as _deleteMapping } from "@/data";

// Why not try a server action? Kinda neat.
export async function deleteMapping(id: string) {
  await _deleteMapping(id);
}
