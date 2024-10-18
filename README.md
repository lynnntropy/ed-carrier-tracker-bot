# Elite: Dangerous Carrier Tracker Bot

This is a simple utility that monitors the [Elite: Dangerous](https://www.elitedangerous.com/) [player journal](https://elite-journal.readthedocs.io/en/latest/) and sends messages to a Discord channel announcing movements of the player's [fleet carrier](https://elite-dangerous.fandom.com/wiki/Drake-Class_Carrier).

Messages will be sent:

- When the player requests a carrier jump
- At the expected departure time of a previously-requested carrier jump
- When the player cancels a carrier jump

Unfortunately, there isn't currently an event that (reliably) gets written to the journal when a carrier actually jumps, so the bot _does_ send a message when the carrier is expected to be jumping, but the timing of said message relies on the assumption that the scheduled departure time didn't change since the jump was requested (which can happen under some circumstances).

## Usage

This bot requires [Deno](https://deno.com/) to run.

You can run `deno task compile` to build a standalone Windows (x86_64) executable, or just run the bot from source with `deno task run`.

The bot expects to find a `config.json` file in the current working directory. This should be a JSON file containing the following fields:

- `webhookUrl` (required): The [Discord webhook](https://discord.com/developers/docs/resources/webhook) URL to send messages to.
- `journalDirectoryPath` (optional): The absolute path to the directory to look for journal files in. You should only need to specify this if you're not on Windows, and/or you're not using the default journal directory (`%USERPROFILE%\Saved Games\Frontier Developments\Elite Dangerous`).

## License

Distributed under the MIT License. See the [`LICENSE`](/LICENSE) for more information.
