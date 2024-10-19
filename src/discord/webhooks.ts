import ky from "ky";
import type { Embed, WebhookPayload } from "./types.ts";

const BOT_USERNAME = "Elite: Dangerous Carrier Tracker";
const BOT_AVATAR_URL =
  "https://cdn.discordapp.com/attachments/161167668131397642/1296579131726626836/carrier_bot.png";

export const executeWebhook = async (url: string, payload: WebhookPayload) => {
  await ky.post(url, {
    json: payload,
  });
};

export const buildWebhookPayload = (embed: Embed): WebhookPayload => ({
  username: BOT_USERNAME,
  avatar_url: BOT_AVATAR_URL,
  embeds: [embed],
});
