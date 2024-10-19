import { z } from "zod";

const ConfigSchema = z.object({
  journalDirectoryPath: z.optional(z.string()),
  webhookUrl: z.string().url(),
});

const configUnparsed = await Deno.readTextFile("./config.json");

export const config = ConfigSchema.parse(JSON.parse(configUnparsed));
