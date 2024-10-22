import { inngest } from "./client";
import { openai } from "@/openai";
import {
  addMapping,
  getMappings,
  updateMapping,
  MetadataMapping,
} from "@/data";

export const ADD_MAPPING_EVENT = "app/mapping.add";
export const UPDATE_MAPPING_EVENT = "app/mapping.update";

const WAIT_FOR_INPUT_TIMEOUT = "1d";

export const newMappingWorkflow = inngest.createFunction(
  { id: "new-mapping-workflow" },
  { event: ADD_MAPPING_EVENT },
  async ({ event, step }) => {
    if (!isAddEvent(event)) {
      console.error("Invalid add event", event);
      throw new Error("Invalid add event");
    }

    const { description, source, mappingId } = event.data;

    console.log("Starting new mapping workflow", mappingId);
    const existingMappings = await getMappings();

    // Call OpenAI to figure out the target mapping and check
    // if we need to ask the user for input.
    const mapValueStepResult = await step.run("map-value-to-target", async () => {
      const response = await getGPTCompletion(existingMappings, source);

      // Insert the pending record into the database
      const status = response.didAutoMap ? "pending" : "ask-for-input";

      // TODO: these are not idempotent as written. In a real env we'd need to
      // check the openai response, make sure the db has appropriate uniqueness constraints,
      // etc to appropriately allow retries.
      await addMapping(description, source, status, mappingId);
      return response;
    });

    if (mapValueStepResult.error) {
      // TODO: maybe retry? Or handle that above?
      console.log("Error from map value step", mapValueStepResult);
      return { event, body: mapValueStepResult.error };
    }

    let target = mapValueStepResult.target;
    if (!mapValueStepResult.didAutoMap) {
      // Wait for input from the user in the browser. In a real workflow, we'd notify the
      // user via email or some notification mechanism and they'd open some app to input
      // the necessary data. For this demo, this is simulated in the browser.
      console.log("Waiting for user input", mappingId);
      const updateEvent = await step.waitForEvent("wait-for-user-input", {
        event: UPDATE_MAPPING_EVENT,
        timeout: WAIT_FOR_INPUT_TIMEOUT,
        match: "data.mappingId",
      });
      if (!updateEvent || !isUpdateEvent) {
        throw new Error("Invalid update event");
      }
      target = updateEvent.data.target;
    }

    if (!target) {
      throw new Error("Target value not determined");
    }

    // Add mapping to db and update status
    await step.run("add-target-to-db", async () => {
      console.log("Updating mapping", mappingId);
      await updateMapping(
        mappingId,
        target,
        mapValueStepResult.didAutoMap ? "auto-mapped" : "user-mapped"
      );
    });

    // What happens to this return value?
    // Maybe it's used if this function is called by another function?
    console.log("Finished new mapping workflow", mappingId);
    return { event, body: mappingId };
  }
);

function getGPTSystemPrompt() {
  return `
    You are a helpful bot that helps users map metadata values for EPM systems
    to target values in other systems. You'll be given existing mappings and a source
    value and asked to map the source value to a target given the patterns in the existing
    mappings.

    You should follow a few rules:
    1. If the source value follows a pattern where the target can be inferred, return the target
    2. If the source value matches an existing source, but the targets is ambiguous, ask the user for input
      * For example, cost center mappings like CC101, or custom dimensions of the form CHN002
    3. If the source falls into the following categories, automatically map it to the target:
      * A product identifier like P100, P200, etc.
      * A chart of accounts identifier like 4001-Sales, 5001-Expenses, etc.
    4. Periods can be automatically mapped to the target
      * For example, 202401 maps to Jan 2024
    5. If the source value matches none of the above, ask the user for input
    
    You should return a JSON dictionary with a few keys:
    1. "target": optional target value that the source should be mapped to if it can be automatically mapped
    2. "didAutoMap": a boolean that indicates if the source was automatically mapped

    "didAutoMap" must only be true if "target" is provided. Don't include the "json" string and backticks around your response.
  `;
}

function getGPTUserPrompt(
  existingMappings: MetadataMapping[],
  source: string
): string {
  return `
    Here are the existing mappings: ${JSON.stringify(existingMappings)}
    Here is this value to map to a target: ${source}
  `;
}

interface GPTResponse {
  target?: string;
  didAutoMap: boolean;
  error?: string;
}

async function getGPTCompletion(
  existingMappings: MetadataMapping[],
  source: string
): Promise<GPTResponse> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: getGPTSystemPrompt() },
      { role: "user", content: getGPTUserPrompt(existingMappings, source) },
    ],
    // Reduce randomness for consistent JSON responses
    temperature: 0,
  });
  // TODO: in a real app handle validation and error checking in a more robust way
  return JSON.parse(
    completion.choices[0].message.content as string
  ) as GPTResponse;
}

interface UpdateEvent {
  id: string;
  data: {
    mappingId: string;
    target: string;
  };
}

interface AddEvent {
  id: string;
  data: {
    mappingId: string;
    description: string;
    source: string;
  };
}

function isAddEvent(event: any): event is AddEvent {
  return (
    typeof event === "object" &&
    event !== null &&
    event.name === ADD_MAPPING_EVENT &&
    typeof event.data === "object" &&
    typeof event.data.description === "string" &&
    typeof event.data.source === "string" &&
    typeof event.data.mappingId === "string"
  );
}

function isUpdateEvent(event: any): event is UpdateEvent {
  return (
    typeof event === "object" &&
    event !== null &&
    event.name === UPDATE_MAPPING_EVENT &&
    typeof event.data === "object" &&
    typeof event.data.mappingId === "string" &&
    typeof event.data.target === "string"
  );
}
