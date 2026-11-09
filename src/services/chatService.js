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

// Worker returns { error: "string" }, Groq-style returns { error: { message } }.
function extractErrorMessage(errorData) {
  if (typeof errorData?.error === "string") return errorData.error;
  return errorData?.error?.message || null;
}

// history is the list of { role, content } turns, including the latest user turn.
export async function requestBotReply(history) {
  const systemPrompt = await getSystemPrompt();
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-10),
  ];

  let response;
  try {
    response = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        max_tokens: 400,
        temperature: 0.7,
      }),
    });
  } catch (err) {
    // Network failure or CORS block (e.g. origin not in the Worker's allow-list).
    console.error("Chat request failed:", err);
    throw new Error(
      "Can't reach the chat server. Check your connection and try again."
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = extractErrorMessage(errorData);
    console.error("Chat API error:", response.status, message);

    if (response.status === 429) {
      throw new Error("Rate limit reached. Please wait a moment.");
    }
    if (response.status === 403) throw new Error("Access denied.");
    throw new Error(message || `API error ${response.status}`);
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content?.trim();

  if (!reply) throw new Error("No response received. Try again.");
  return reply;
}