import { v4 as uuid } from "uuid";
import { inngest } from "@/inngest/client";
import { ADD_MAPPING_EVENT } from "@/inngest/functions";
import { getMappings } from "@/data";

export const revalidate = 0;

export async function GET() {
  // Sort them by id so the newest ones are at the top so the user can
  // see any mappings they need to update.
  return Response.json({ mappings: await getMappings() });
}

export async function POST(req: Request) {
  const { description, source } = await req.json();
  if (!description || !source) {
    return Response.json({ error: "Missing required input" }, { status: 400 });
  }

  console.log("Sending add mapping event", description, source);
  const mappingId: string = uuid();

  await inngest.send({
    name: ADD_MAPPING_EVENT,
    data: {
      mappingId,
      description,
      source,
    },
  });

  return Response.json({ mappingId });
}
