import { serve } from "inngest/next";
import { inngest } from "../../../lib/inngest/client";
import { helloWorld } from "../../../lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    helloWorld, // <-- This is where you'll always add all your functions
  ],
});