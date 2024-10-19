import { inngest } from "./client";
import { sql } from "@vercel/postgres";
import { openai } from "@/openai";

export const addMapping = inngest.createFunction(
  { id: "add-mapping" },
  { event: "app/mapping.add" },
  async ({ event, step }) => {
    const description = event.data.description;
    const source = event.data.source;
    const mappingId = event.data.mappingId;

    const { rows } = await sql`SELECT * FROM Mappings;`;

    // Call OpenAI to figure out the target mapping and check 
    // if we need to ask the user for confirmation.
    const result = await step.run("map-value-to-target", async () => {
      const systemPrompt = `
      You are a helpful bot that helps users map metadata values for EPM systems
        to target values in other systems. You'll be given existing mappings and a source
        value and asked to map the source value to a target given the patterns in the existing
        mappings.

        You should follow a few rules:
        1. If the source value is already mapped to a target, return an error ALREADY_MAPPED
        2. If the source value follows a pattern where the target can be inferred, return the target
        3. If the source value matches an existing source, but the targets is ambiguous, ask the user for input
          * For example, cost center mappings like CC101, or custom dimensions of the form CHN002
        4. If the source falls into the following categories, automatically map it to the target:
          * A product identifier like P100, P200, etc.
          * A chart of accounts identifier like 4001-Sales, 5001-Expenses, etc.
        5. Periods can be automatically mapped to the target
          * For example, 202401 maps to Jan 2024
        6. If the source value matches none of the above, ask the user for input
        
        You should return a JSON dictionary with a few keys:
        1. "target": optional target value that the source should be mapped to if it can be automatically mapped
        2. "ask": a boolean that indicates whether the user should be asked to input a target
        3. "error": optional error message if the source value is already mapped or if there's an error

        If there was an error, return a JSON dict with a single key "error" and a value that
        describes the error. "ask" must only be true if "target" is not provided.

        Don't include the "json" string and backticks around your response.
        `;
      const userPrompt = `
        Here are the existing mappings: ${JSON.stringify(rows)}
        Here is this value to map to a target: ${source}
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        // Reduce randomness for consistent JSON responses
        temperature: 0,
      });
      // TODO: better validate data and handle errors
      const result = JSON.parse(completion.choices[0].message.content as string);

      // Insert the pending record into the database
      const status = result.ask ? "ask-for-input" : "pending";
      await sql`INSERT INTO Mappings (description, source, status, mapping_id) VALUES (${description}, ${source}, ${status}, ${mappingId});`;

      // TODO: would probably need to check the result to see if this needs to be retried?
      return result;
    });

    // TODO: maybe retry?
    if (result.error) {
      console.log("Error from OpenAI", result.error);
      return { event, body: result.error };
    }

    let target = result.target;
    let didAutoMap = true;
    if (result.ask) {
      // Wait for input from the user for one day
      const userInput = await step.waitForEvent("wait-for-user-input", {
        event: "app/mapping.update",
        timeout: "1d",
        if: "event.data.mappingId == async.data.mappingId",
      });
      if (!userInput) {
        throw new Error("No user input");
      }
      target = userInput.data.target;
      didAutoMap = false;
    }

    if (!target) {
      // Shouldn't happen
      throw new Error("No target");
    }

    // Add mapping to db and update status
    await step.run("add-target-to-db", async () => {
      await sql`UPDATE Mappings SET target=${target}, status=${didAutoMap ? 'auto-mapped' : 'user-mapped'} WHERE mapping_id=${mappingId};`;
    });

    // What happens to this return value?
    // Maybe it's used if this function is called by another function?
    return { event, body: "foo" };
  }
);
