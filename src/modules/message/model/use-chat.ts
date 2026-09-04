import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// 🟡 MOBIL FARQI: veb `react-router-dom`ning `useNavigate` ini ishlatadi.
// Expo Router ekvivalenti — `useRouter().replace()`.
import { useRouter } from "expo-router";
import { toast } from "sonner";
import { conversationApi, conversationKeys, readCachedConversation } from "@/modules/conversation";
import type { ChatMessage, ConversationRole, SendMessagePayload } from "@/shared/types";
import { messageApi } from "../api/message.api";
import { ChatSocketManager, type SocketState } from "../lib/chat-socket-manager";
import { markMessageFailed, upsertMessage } from "../lib/message.mappers";
import { messageKeys } from "./message.keys";

const TYPING_RESET_MS = 2600;

/** WebSocket ishlamayotgan holat uchun zaxira — kanal ulanganda o'chadi. */
const REST_FALLBACK_POLL_MS = 6000;

export interface UseChatOptions {
  role?: ConversationRole;
  senderId?: string | null;
}

interface OptimisticContext {
  temporaryId: string;
}

export function useChat(
  conversationId: string | undefined,
  { role = "teacher", senderId = null }: UseChatOptions = {}
) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const messagesKey = useMemo(
    () => messageKeys.all(conversationId ?? "", role),
    [conversationId, role]
  );
  const [socketState, setSocketState] = useState<SocketState>("idle");
  const [typing, setTyping] = useState<string | null>(null);

  // Yon paneldagi ro'yxatdagi nusxa — chat ochilishi uchun detal so'rovi
  // kutilmaydi, u fonda kelib ustiga yoziladi. Keshda topilmasa `undefined`
  // bo'ladi va sahifa odatdagidek skeleton ko'rsatadi.
  const cachedConversation = readCachedConversation(queryClient, conversationId, role);

  const conversation = useQuery({
    queryKey: conversationKeys.detail(conversationId ?? "", role),
    queryFn: ({ signal }) => conversationApi.getById(conversationId as string, { signal }),
    enabled: Boolean(conversationId),
    placeholderData: cachedConversation,
  });

  const messages = useQuery({
    queryKey: messagesKey,
    queryFn: ({ signal }) => messageApi.getAll(conversationId as string, { signal }),
    enabled: Boolean(conversationId),
    // WebSocket uzilgan bo'lsa yangi xabarlar kelmay qoladi — zaxira sifatida
    // tarixni qayta so'raymiz. Kanal ulanishi bilan polling o'chadi.
    refetchInterval: socketState === "connected" ? false : REST_FALLBACK_POLL_MS,
  });

  const socket = useMemo(
    () =>
      conversationId
        ? new ChatSocketManager({
            roomId: conversationId,
            onState: setSocketState,
            onEvent: (event) => {
              if (event.type === "message") {
                queryClient.setQueryData<ChatMessage[]>(messagesKey, (current = []) =>
                  upsertMessage(current, event.message)
                );
              }
              // O'zimizning "yozmoqda" signalimizni ko'rsatmaymiz.
              if (event.type === "typing" && event.userId !== String(senderId)) {
                setTyping(event.name);
                globalThis.setTimeout(() => setTyping(null), TYPING_RESET_MS);
              }
              /*
               * Kursdan chiqarildik: server socketni baribir yopadi, lekin
               * foydalanuvchi nima bo'lganini bilishi va ochiq chatda qolib
               * ketmasligi kerak. Ro'yxat ham yangilanadi — guruh yo'qoladi.
               */
              if (event.type === "removed") {
                toast.error("Siz bu guruhdan chiqarildingiz");
                queryClient.invalidateQueries({ queryKey: conversationKeys.all });
                router.replace(role === "teacher" ? "/teacher/chats" : "/student/chats");
              }
            },
          })
        : null,
    [conversationId, messagesKey, router, queryClient, role, senderId]
  );

  useEffect(() => {
    socket?.start();
    return () => socket?.stop();
  }, [socket]);

  const sendMessage = useMutation({
    mutationFn: (payload: SendMessagePayload) => messageApi.send(conversationId as string, payload),
    // Optimistik xabar darhol ko'rinadi, javob kelgach haqiqiysi bilan almashadi.
    onMutate: async (payload): Promise<OptimisticContext> => {
      const temporaryId = `temp-${crypto.randomUUID()}`;
      const optimistic: ChatMessage = {
        id: temporaryId,
        conversationId: conversationId ?? "",
        senderId: senderId ?? "",
        senderName: "",
        senderUsername: "",
        text: payload.text,
        type: "text",
        createdAt: new Date().toISOString(),
        status: "pending",
        pending: true,
        failed: false,
        retryPayload: payload,
      };
      queryClient.setQueryData<ChatMessage[]>(messagesKey, (current = []) =>
        upsertMessage(current, optimistic)
      );
      return { temporaryId };
    },
    onSuccess: (message, _payload, context) => {
      queryClient.setQueryData<ChatMessage[]>(messagesKey, (current = []) =>
        upsertMessage(
          current.filter((item) => item.id !== context.temporaryId),
          message
        )
      );
      queryClient.invalidateQueries({ queryKey: conversationKeys.all });
    },
    onError: (_error, _payload, context) =>
      queryClient.setQueryData<ChatMessage[]>(messagesKey, (current = []) =>
        markMessageFailed(current, context?.temporaryId ?? "")
      ),
  });

  const updateMessage = useMutation({
    mutationFn: (_variables: { messageId: string; text: string }) => messageApi.update(),
  });
  const deleteMessage = useMutation({
    mutationFn: (_variables: { messageId: string; scope: "me" | "everyone" }) => messageApi.remove(),
  });
  const toggleReaction = useMutation({
    mutationFn: (_variables: { messageId: string; emoji: string }) => messageApi.toggleReaction(),
  });

  function retryMessage(message: ChatMessage) {
    queryClient.setQueryData<ChatMessage[]>(messagesKey, (current = []) =>
      current.filter((item) => item.id !== message.id)
    );
    sendMessage.mutate(message.retryPayload ?? { text: message.text });
  }

  return {
    conversation: {
      ...conversation,
      data: conversation.data
        ? { ...conversation.data, typing: Boolean(typing), typingName: typing }
        : conversation.data,
    },
    messages,
    sendMessage,
    retryMessage,
    updateMessage,
    deleteMessage,
    toggleReaction,
    socketState,
    sendTyping: () => socket?.sendTyping(),
  };
}

/** `useChat` qaytaradigan to'liq shakl — widget va sahifalar shu tipga tayanadi. */
export type ChatController = ReturnType<typeof useChat>;
