import { sql } from "@vercel/postgres";
import { v4 as uuid } from "uuid";
import { inngest } from "@/inngest/client";

export const revalidate = 0;
export async function GET() {
  const { rows } = await sql`SELECT * FROM Mappings ORDER BY id DESC;`;
  return Response.json({ mappings: rows });
}

export async function POST(req: Request) {
  const data = await req.json();
  console.log("Adding mapping", data);
  const { description, source } = data;
  if (!description || !source) {
    throw new Error("Missing description or source");
  }

  console.log("Adding mapping", description, source);
  const mappingId: string = uuid();

  await inngest.send({
    name: "app/mapping.add",
    data: {
      mappingId,
      description,
      source,
    },
  });

  // Poll database until the mapping has been added. A websocket to notify the frontend would be nicer,
  // but this works for a demo.
  let attempts = 0;
  while (attempts < 30) {
    const { rows } = await sql`
      SELECT * FROM Mappings WHERE mapping_id = ${mappingId} 
      AND status IN ('ask-for-input', 'user-mapped', 'auto-mapped');
    `;
    if (rows.length > 0) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
    attempts++;
  }

  return Response.json({ mappingId });
}
