import { z } from "zod";

export const JournalEntry = z.object({
    timestamp: z.string().datetime(),
}).passthrough();

export type JournalEntry = z.infer<typeof JournalEntry>;

export const JournalEntryCarrierStats = JournalEntry.extend({
    event: z.literal("CarrierStats"),
    CarrierID: z.number(),
    Callsign: z.string(),
    Name: z.string(),
});

export type JournalEntryCarrierStats = z.infer<typeof JournalEntryCarrierStats>;

export const JournalEntryCarrierJumpRequest = JournalEntry.extend({
    event: z.literal("CarrierJumpRequest"),
    CarrierID: z.number(),
    SystemName: z.string(),
    Body: z.string(),
    DepartureTime: z.string().datetime(),
});

export type JournalEntryCarrierJumpRequest = z.infer<
    typeof JournalEntryCarrierJumpRequest
>;

export const JournalEntryCarrierJumpCancelled = JournalEntry.extend({
    event: z.literal("CarrierJumpCancelled"),
    CarrierID: z.number(),
});

export type JournalEntryCarrierJumpCancelled = z.infer<
    typeof JournalEntryCarrierJumpCancelled
>;

export const SupportedJournalEntry = z.discriminatedUnion("event", [
    JournalEntryCarrierStats,
    JournalEntryCarrierJumpRequest,
    JournalEntryCarrierJumpCancelled,
]);

export type SupportedJournalEntry = z.infer<typeof SupportedJournalEntry>;
