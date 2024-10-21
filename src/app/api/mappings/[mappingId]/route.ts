import { inngest } from "@/inngest/client";
import { UPDATE_MAPPING_EVENT } from "@/inngest/functions";
import { getMapping } from "@/data";

export const revalidate = 0;

export async function GET(
  req: Request,
  { params: { mappingId } }: { params: { mappingId: string } }
) {
  const mapping = await getMapping(mappingId);
  if (!mapping) {
    return Response.json({ error: "Mapping not found" }, { status: 404 });
  }
  return Response.json({ mapping });
}

export async function PUT(
  req: Request,
  { params: { mappingId } }: { params: { mappingId: string } }
) {
  const { target } = await req.json();

  if (!target) {
    return Response.json({ error: "Missing required input" }, { status: 400 });
  }

  console.log("Sending update mapping event", mappingId, target);
  await inngest.send({
    name: UPDATE_MAPPING_EVENT,
    data: {
      mappingId,
      target,
    },
  });

  return Response.json({ mappingId });
}
