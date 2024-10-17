import { exists } from "@std/fs";
import { debounce } from "@std/async/debounce";
import * as path from "@std/path";

import {
  isJournalFile,
  readAllJournalEntries,
  readJournalEntriesSinceTimestamp,
  readLastJournalEntry,
  readLatestJournalEntryOfType,
} from "./elite/journal.ts";

import {
  type JournalEntry,
  JournalEntryCarrierStats,
  SupportedJournalEntry,
} from "./elite/types.ts";
import { config } from "./config.ts";
import type { Embed } from "./discord/types.ts";
import { buildWebhookPayload, executeWebhook } from "./discord/webhooks.ts";
import { resolveDefaultJournalDirectoryPath } from "./utils.ts";
import { warn } from "./logging.ts";

if (!import.meta.main) {
  throw new Error("This module must be the main entrypoint.");
}

const journalDirectoryPath = config.journalDirectoryPath ??
  resolveDefaultJournalDirectoryPath();

if (!(await exists(journalDirectoryPath))) {
  throw new Error(
    `Configured journal directory (${journalDirectoryPath}) does not exist.`,
  );
}

const journalDirectoryInfo = await Deno.stat(journalDirectoryPath);

if (!journalDirectoryInfo.isDirectory) {
  throw new Error(
    `Configured journal directory (${journalDirectoryPath}) is not a directory.`,
  );
}

console.log(`Using journal directory: ${journalDirectoryPath}`);

const lastSeenEntryTimestamps: Record<string, Date | undefined> = {};

for await (const dirEntry of Deno.readDir(journalDirectoryPath)) {
  if (!dirEntry.isFile) {
    continue;
  }

  if (!isJournalFile(dirEntry.name)) {
    continue;
  }

  const filePath = path.join(journalDirectoryPath, dirEntry.name);
  const lastEntry = await readLastJournalEntry(filePath);

  lastSeenEntryTimestamps[dirEntry.name] = lastEntry
    ? new Date(lastEntry.timestamp)
    : undefined;
}

let carrierStats = JournalEntryCarrierStats.nullable().parse(
  await readLatestJournalEntryOfType(
    journalDirectoryPath,
    "CarrierStats",
  ),
);

if (!carrierStats) {
  warn(
    "No `CarrierStats` found. This should fix itself if you open the Carrier Management menu in-game.",
  );
} else {
  console.log(`Found carrier: ${carrierStats.Name} (${carrierStats.Callsign})`);
}

const processJournalEntry = async (entry: JournalEntry) => {
  const supported = SupportedJournalEntry.safeParse(entry);

  if (!supported.success) {
    return;
  }

  const data = supported.data;

  if (data.event === "CarrierStats") {
    carrierStats = data;
    console.log(
      `Found carrier: ${carrierStats.Name} (${carrierStats.Callsign})`,
    );

    return;
  }

  if (data.event === "CarrierJumpRequest") {
    if (!carrierStats) {
      warn(
        "Carrier stats not found, ignoring `CarrierJumpRequest` event.",
      );
      return;
    }

    const embed: Embed = {
      title:
        `${carrierStats.Name} (${carrierStats.Callsign}) is preparing to jump!`,
      fields: [
        {
          name: "Destination System",
          value: data.SystemName,
        },
        {
          name: "Destination Body",
          value: data.Body,
        },
        {
          name: "Departure Time",
          value: `<t:${new Date(data.DepartureTime).getTime() / 1000}:t> ` +
            `(<t:${new Date(data.DepartureTime).getTime() / 1000}:R>)`,
        },
      ],
      color: 0x22c55e,
    };

    await executeWebhook(config.webhookUrl, buildWebhookPayload(embed));

    return;
  }

  if (data.event === "CarrierJumpCancelled") {
    if (!carrierStats) {
      warn(
        "Carrier stats not found, ignoring `CarrierJumpCancelled` event.",
      );
      return;
    }

    const embed: Embed = {
      title:
        `Jump cancelled for ${carrierStats.Name} (${carrierStats.Callsign}).`,
      color: 0xef4444,
    };

    await executeWebhook(config.webhookUrl, buildWebhookPayload(embed));

    return;
  }
};

const handleFsEvent = async (event: Deno.FsEvent) => {
  if (event.kind === "modify" || event.kind === "create") {
    for (const eventPath of event.paths) {
      const filename = path.basename(eventPath);

      if (!isJournalFile(filename)) {
        continue;
      }

      if (lastSeenEntryTimestamps[filename] === undefined) {
        const entries = await readAllJournalEntries(
          eventPath,
        );

        for (const entry of entries) {
          processJournalEntry(entry);
        }

        if (entries.length > 0) {
          lastSeenEntryTimestamps[filename] = new Date(
            entries[entries.length - 1].timestamp,
          );
        }

        continue;
      }

      const lastSeenTimestamp = lastSeenEntryTimestamps[filename];

      const entries = await readJournalEntriesSinceTimestamp(
        eventPath,
        lastSeenTimestamp,
      );

      for (const entry of entries) {
        processJournalEntry(entry);
      }

      if (entries.length > 0) {
        lastSeenEntryTimestamps[filename] = new Date(
          entries[entries.length - 1].timestamp,
        );
      }
    }

    return;
  }
};

const handleFsEventDebounced = debounce(handleFsEvent, 200);

const watcher = Deno.watchFs(journalDirectoryPath);

console.log("Watching journal directory for relevant events.");

for await (const event of watcher) {
  if (event.kind !== "modify" && event.kind !== "create") {
    continue;
  }

  handleFsEventDebounced(event);
}
