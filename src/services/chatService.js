import { BASE_SYSTEM_PROMPT } from "../data/systemPrompt";
import { getExtraInfoBlock } from "./extraInfoService";

// Requests continue to use the existing Worker proxy. The API key stays server-side.
const CHAT_API_URL =
  import.meta.env.VITE_CHAT_API_URL ||
  "https://llyd-bot-proxy.llydai-201001.workers.dev";

async function getSystemPrompt() {
  const extraInfo = await getExtraInfoBlock();
  return BASE_SYSTEM_PROMPT + extraInfo;
}

// history is the list of { role, content } turns, including the latest user turn.
export async function requestBotReply(history) {
  const systemPrompt = await getSystemPrompt();
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-10),
  ];

  const response = await fetch(CHAT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      max_tokens: 400,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 429) {
      throw new Error("Rate limit reached. Please wait a moment.");
    }
    if (response.status === 403) throw new Error("Access denied.");
    throw new Error(
      errorData?.error?.message || `API error ${response.status}`
    );
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content?.trim();

  if (!reply) throw new Error("No response received. Try again.");
  return reply;
}
