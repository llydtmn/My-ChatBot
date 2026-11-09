import { getCurrentUser, supabase } from "./supabaseClient";

function ensureSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Check your .env file.");
  }
}

export async function createConversation(title = "New Conversation") {
  ensureSupabase();
  const user = await getCurrentUser();

  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: user.id, title })
    .select("id, title, created_at, updated_at")
    .single();

  if (error) throw error;
  return data;
}

export async function getLatestConversation() {
  ensureSupabase();
  await getCurrentUser();

  const { data, error } = await supabase
    .from("conversations")
    .select("id, title, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getConversationMessages(conversationId) {
  ensureSupabase();
  if (!conversationId) return [];

  const { data, error } = await supabase
    .from("messages")
    .select("id, role, content, message_type, metadata, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((message) => ({
    id: message.id,
    role: message.role === "assistant" ? "bot" : message.role,
    type: message.message_type || "text",
    text: message.content,
    ...(message.metadata ?? {}),
    createdAt: message.created_at,
  }));
}

export async function saveChatMessage(conversationId, message) {
  ensureSupabase();
  if (!conversationId) throw new Error("No active conversation.");

  const role =
    message.role === "bot" || message.role === "assistant"
      ? "assistant"
      : "user";

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      role,
      content: String(message.text ?? ""),
      message_type: message.type || "text",
      metadata: {
        ...(message.caption ? { caption: message.caption } : {}),
        ...(message.src ? { src: message.src } : {}),
        ...(message.songIndex !== undefined
          ? { songIndex: message.songIndex }
          : {}),
      },
    })
    .select("id, created_at")
    .single();

  if (error) throw error;

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return data;
}

export async function updateConversationTitle(conversationId, title) {
  ensureSupabase();
  if (!conversationId || !title?.trim()) return;

  const { error } = await supabase
    .from("conversations")
    .update({ title: title.trim().slice(0, 80) })
    .eq("id", conversationId);

  if (error) throw error;
}
