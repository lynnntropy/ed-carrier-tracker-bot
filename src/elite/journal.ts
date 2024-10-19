import { TextLineStream } from "@std/streams";
import * as path from "@std/path";
import { JournalEntry } from "./types.ts";

const JOURNAL_FILENAME_REGEX = /^Journal\..+\.log$/;

export const isJournalFile = (filename: string) =>
  JOURNAL_FILENAME_REGEX.test(filename);

export const resolveDefaultJournalDirectoryPath = () => {
  if (Deno.build.os !== "windows") {
    throw new Error(
      "Non-Windows environment detected. You need to configure the `journalDirectoryPath` field manually in config.json.",
    );
  }

  const userProfileDirectoryPath = Deno.env.get("USERPROFILE");

  if (userProfileDirectoryPath === undefined) {
    throw new Error("`USERPROFILE` environment variable must be set.");
  }

  return path.join(
    userProfileDirectoryPath,
    "Saved Games",
    "Frontier Developments",
    "Elite Dangerous",
  );
};

export const readLastJournalEntry = async (filePath: string) => {
  const lines: string[] = [];
  const file = await Deno.open(filePath);

  const stream = file.readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream());

  for await (const line of stream) {
    lines.push(line);
  }

  if (lines.length === 0) {
    return null;
  }

  const lastLine = lines[lines.length - 1];

  const journalEntry = JournalEntry.parse(JSON.parse(lastLine));
  return journalEntry;
};

export const readJournalEntriesSinceTimestamp = async (
  filePath: string,
  sinceTimestamp: Date,
) => {
  const lines: string[] = [];
  const file = await Deno.open(filePath);

  const stream = file.readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream());

  for await (const line of stream) {
    lines.push(line);
  }

  const journalEntries = lines
    .map((line) => JournalEntry.parse(JSON.parse(line)))
    .filter((entry) => new Date(entry.timestamp) > sinceTimestamp);

  return journalEntries;
};

export const readAllJournalEntries = async (filePath: string) => {
  const lines: string[] = [];
  const file = await Deno.open(filePath);

  const stream = file.readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream());

  for await (const line of stream) {
    lines.push(line);
  }

  const journalEntries = lines.map((line) =>
    JournalEntry.parse(JSON.parse(line))
  );

  return journalEntries;
};

export const readLatestJournalEntryOfType = async (
  journalDirectoryPath: string,
  event: string,
) => {
  const dir = await Array.fromAsync(Deno.readDir(journalDirectoryPath));

  const journalFiles = dir.filter((entry) => isJournalFile(entry.name));

  if (journalFiles.length === 0) {
    return null;
  }

  let latest: JournalEntry | null = null;

  for (const journalFile of journalFiles) {
    const entries = await readAllJournalEntries(
      path.join(journalDirectoryPath, journalFile.name),
    );

    const latestEntryForFile = entries
      .reverse()
      .find((entry) => entry.event === event);

    if (!latestEntryForFile) {
      continue;
    }

    if (
      !latest ||
      new Date(latestEntryForFile.timestamp) > new Date(latest.timestamp)
    ) {
      latest = latestEntryForFile;
      continue;
    }
  }

  return latest;
};
