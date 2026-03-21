import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("Missing ANTHROPIC_API_KEY. Add it to apps/api/.env");
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

/** @deprecated Use getAnthropic() instead */
export const anthropic = new Proxy({} as Anthropic, {
  get(_, prop) {
    return (getAnthropic() as Record<string | symbol, unknown>)[prop];
  },
});
