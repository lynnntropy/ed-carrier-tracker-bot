import * as path from "@std/path";

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
