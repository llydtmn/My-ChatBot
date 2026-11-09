import { useCallback, useEffect, useRef, useState } from "react";
import { WELCOME_MESSAGE, PLAYLIST_MESSAGE } from "../data/mockData";
import { requestBotReply } from "../services/chatService";
import { addExtraInfo } from "../services/extraInfoService";
import {
  createConversation,
  getLatestConversation,
  getConversationMessages,
  saveChatMessage,
  updateConversationTitle,
} from "../services/chatHistoryService";
import {
  getImageForMessage,
  getMusicIntent,
  isDevTrigger,
} from "../utils/chatIntents";

export default function useChat({ playSong }) {
  const [messages, setMessages] = useState([
    { id: 0, role: "bot", type: "text", text: WELCOME_MESSAGE },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [storageError, setStorageError] = useState("");

  const loadingRef = useRef(false);
  const historyRef = useRef([]);
  const devRef = useRef({ awaitingCode: false, awaitingInfo: false });
  const conversationIdRef = useRef(null);
  const idRef = useRef(1);
  const mountedRef = useRef(true);

  const setLoading = useCallback((value) => {
    loadingRef.current = value;
    if (mountedRef.current) setIsLoading(value);
  }, []);

  const persistMessage = useCallback(async (message) => {
    if (!conversationIdRef.current) return;
    try {
      const saved = await saveChatMessage(conversationIdRef.current, message);
      return saved;
    } catch (error) {
      console.error("Could not save chat message:", error);
      if (mountedRef.current) {
        setStorageError(`Message could not be saved: ${error.message}`);
      }
    }
  }, []);

  const addMessage = useCallback((message) => {
    const normalized = {
      id: idRef.current++,
      role: "bot",
      type: "text",
      ...message,
    };

    if (mountedRef.current) {
      setMessages((previous) => [...previous, normalized]);
    }
    void persistMessage(normalized);
    return normalized;
  }, [persistMessage]);

  const addUserMessage = useCallback((text) => {
    const message = {
      id: idRef.current++,
      role: "user",
      type: "text",
      text,
    };

    if (mountedRef.current) {
      setMessages((previous) => [...previous, message]);
    }
    void persistMessage(message);
    return message;
  }, [persistMessage]);

  // Restore the latest conversation or create one for this anonymous/authenticated user.
  useEffect(() => {
    mountedRef.current = true;

    const initialize = async () => {
      try {
        let conversation = await getLatestConversation();
        if (!conversation) conversation = await createConversation();

        conversationIdRef.current = conversation.id;
        const savedMessages = await getConversationMessages(conversation.id);

        if (!mountedRef.current) return;

        if (savedMessages.length) {
          setMessages(savedMessages);
          idRef.current = savedMessages.length + 1;
          historyRef.current = savedMessages
            .filter((item) => item.type === "text" && item.text)
            .map((item) => ({
              role: item.role === "bot" ? "assistant" : "user",
              content: item.text,
            }));
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error("Chat initialization failed:", error);
        if (mountedRef.current) {
          setStorageError(error.message || "Could not connect to Supabase.");
        }
      } finally {
        if (mountedRef.current) setIsReady(true);
      }
    };

    initialize();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const addMusicPlayer = (songIndex) => {
    const playerMessage = {
      id: idRef.current++,
      role: "bot",
      type: "music",
      songIndex,
    };
    setMessages((previous) => [
      ...previous.filter((message) => message.type !== "music"),
      playerMessage,
    ]);
  };

  const handleImageRequest = (message) => {
    const image = getImageForMessage(message);
    if (!image) return false;

    setLoading(true);
    addUserMessage(message);

    window.setTimeout(() => {
      addMessage({ text: "Sure! Here's a photo of John Lloyd 📷" });
      addMessage({
        type: "image",
        text: image.caption || "Photo",
        src: image.src,
        caption: image.caption,
      });
      setLoading(false);
    }, 500);

    return true;
  };

  const handleDevFlow = async (message) => {
    const dev = devRef.current;

    if (!dev.awaitingCode && !dev.awaitingInfo && isDevTrigger(message)) {
      dev.awaitingCode = true;
      addUserMessage(message);
      addMessage({
        text:
          "Developer information can be added after your account has been granted developer access. Enter your developer access code.",
      });
      return true;
    }

    if (dev.awaitingCode) {
      addUserMessage(message);
      dev.awaitingCode = false;

      // Do not validate a secret in frontend code. This requires a secure
      // server-side/Edge Function check; see setup notes accompanying this code.
      addMessage({
        text:
          "Developer-code verification is not configured yet. For security, the access code must be checked by a Supabase Edge Function, not inside the browser.",
        isError: true,
      });
      return true;
    }

    if (dev.awaitingInfo) {
      addUserMessage(message);
      dev.awaitingInfo = false;

      try {
        await addExtraInfo(message);
        addMessage({
          text: "✓ Your additional information has been saved to Supabase.",
          isSystem: true,
        });
      } catch (error) {
        addMessage({
          text: `⚠ Could not save developer information: ${error.message}`,
          isError: true,
        });
      }
      return true;
    }

    return false;
  };

  const handleMusicRequest = (message) => {
    const intent = getMusicIntent(message);
    if (!intent) return;

    if (intent.type === "play") {
      playSong?.(intent.index);
      addMusicPlayer(intent.index);
    } else {
      addMessage({ text: PLAYLIST_MESSAGE });
    }
  };

  const fetchReply = async (message) => {
    try {
      historyRef.current.push({ role: "user", content: message });
      const reply = await requestBotReply(historyRef.current);
      historyRef.current.push({ role: "assistant", content: reply });
      setIsTyping(false);
      addMessage({ text: reply });
    } catch (error) {
      setIsTyping(false);
      addMessage({
        text: `⚠ ${error.message || "Something went wrong. Please try again."}`,
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text) => {
    const message = String(text ?? "").trim();
    if (!message || loadingRef.current || !isReady) return false;

    setShowSuggestions(false);
    setStorageError("");

    if (handleImageRequest(message)) return true;
    if (await handleDevFlow(message)) return true;

    setLoading(true);
    addUserMessage(message);

    // Give the first conversation a useful title.
    if (historyRef.current.length === 0 && conversationIdRef.current) {
      void updateConversationTitle(conversationIdRef.current, message).catch(
        (error) => console.error("Could not update conversation title:", error)
      );
    }

    handleMusicRequest(message);
    setIsTyping(true);
    await fetchReply(message);
    return true;
  };

  return {
    messages,
    isTyping,
    isLoading: isLoading || !isReady,
    isReady,
    storageError,
    showSuggestions,
    sendMessage,
  };
}
