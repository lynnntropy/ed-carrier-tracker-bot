export type EmbedField = {
  name: string;
  value: string;
  inline?: boolean;
};

export type Embed = {
  title?: string;
  description?: string;
  fields?: EmbedField[];
  color?: number;
};

export type WebhookPayload = {
  username?: string;
  avatar_url?: string;
  embeds: Embed[];
};
