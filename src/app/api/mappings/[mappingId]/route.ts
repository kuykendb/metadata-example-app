import { sql } from "@vercel/postgres";
import { inngest } from "@/inngest/client";

export const revalidate = 0;

export async function PUT(
  req: Request,
  { params }: { params: { mappingId: string } }
) {
  const data = await req.json();
  const { target } = data;
  const { mappingId } = params;

  if (!target) {
    throw new Error("Missing target");
  }
  console.log("Updating mapping", mappingId, target);
  await inngest.send({
    name: "app/mapping.update",
    data: {
      mappingId,
      target,
    },
  });

  // Poll database until the status has been updated. A websocket to notify the frontend would be nicer,
  // but this works for a demo.
  let attempts = 0;
  while (attempts < 10) {
    const { rows } = await sql`SELECT status FROM Mappings WHERE mapping_id = ${mappingId} AND status IN ('user-mapped');`;
    if (rows.length > 0) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
    attempts++;
  }

  return Response.json({ mappingId });
}
