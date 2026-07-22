<template>
  <div class="mx-auto w-full max-w-330 px-4 py-4 sm:px-6 lg:px-8 lg:py-5">
    <section class="flex h-[calc(100dvh-8rem)] min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <header class="shrink-0 border-b border-zinc-100 px-3 py-3 sm:px-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <span class="grid size-10 place-items-center rounded-xl bg-zinc-950 text-white shadow-md shadow-zinc-950/15">
              <UIcon name="i-lucide-message-circle" class="size-5" />
            </span>
            <div>
              <h1 class="text-xl font-semibold tracking-normal text-zinc-950 sm:text-2xl">
                Сообщения
              </h1>
              <p class="mt-0.5 flex items-center gap-2 text-xs text-zinc-500 sm:text-sm">
                <span class="size-2 rounded-full" :class="socketConnected ? 'bg-emerald-500' : 'bg-zinc-300'" />
                {{ connectionLabel }}
              </p>
            </div>
          </div>

          <UButton color="neutral" variant="soft" icon="i-lucide-refresh-cw" square
            class="rounded-full bg-[#f3f4f6] transition duration-300 hover:scale-105" :loading="loading"
            aria-label="Обновить сообщения" @click="loadMessages" />
        </div>
      </header>

      <div ref="messagesViewport" class="min-h-0 flex-1 overflow-y-auto bg-[#f8faf9] px-3 py-4 sm:px-4"
        role="log" aria-live="polite" aria-relevant="additions text">
        <div v-if="loading" class="space-y-3">
          <USkeleton v-for="item in 5" :key="item" class="h-14 rounded-lg" />
        </div>

        <OrderEmptyState v-else-if="!messages.length" icon="i-lucide-message-circle" title="Сообщений пока нет"
          description="Напишите нам по заказу, оплате, доставке или товару."
          class="mx-auto max-w-xl min-h-72 bg-white" />

        <div v-else v-auto-animate class="space-y-3">
          <article v-for="message in messages" :key="message.id" class="flex"
            :class="message.senderRole === 'USER' ? 'justify-end' : 'justify-start'">
            <div class="max-w-[min(38rem,88%)] rounded-2xl px-3 py-2 shadow-sm sm:px-3.5" :class="message.senderRole === 'USER'
              ? 'rounded-br-sm bg-emerald-600 text-white shadow-emerald-950/10'
              : 'rounded-bl-sm bg-white text-zinc-950 shadow-zinc-950/5 ring-1 ring-zinc-100'">
              <p class="text-xs font-semibold"
                :class="message.senderRole === 'USER' ? 'text-emerald-50/80' : 'text-zinc-400'">
                {{ getSenderLabel(message.senderRole) }}
              </p>
              <p class="mt-1 whitespace-pre-line wrap-break-words text-sm leading-5">
                {{ message.message }}
              </p>
              <time class="mt-1.5 block text-xs"
                :class="message.senderRole === 'USER' ? 'text-emerald-50/70' : 'text-zinc-400'">
                {{ formatDateTime(message.createdAt) }}
              </time>
            </div>
          </article>
        </div>

        <div ref="messagesEnd" class="h-px scroll-mb-28" aria-hidden="true" />
      </div>

      <form class="shrink-0 rounded-b-2xl border-t border-zinc-100 bg-white/95 p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-18px_44px_rgba(15,23,42,0.08)] backdrop-blur sm:p-3 sm:pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
        @submit.prevent="sendMessage">
        <UFormField :error="messageError">
          <div class="flex items-end gap-2 rounded-2xl bg-[#f3f4f6] p-1.5 shadow-inner shadow-zinc-950/5 ring-1 ring-transparent transition focus-within:ring-emerald-500/45">
            <textarea ref="messageInput" v-model="draftMessage"
              class="h-12 min-h-12 max-h-36 flex-1 resize-none overflow-y-hidden rounded-xl bg-transparent px-3 py-3 text-sm leading-5 text-zinc-950 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="submitting" placeholder="Сообщение" rows="1" aria-label="Сообщение поддержке" @input="resizeMessageInput"
              @keydown.enter.exact.prevent="sendMessage" />
            <button type="submit"
              class="mb-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-emerald-600 text-white shadow-md shadow-emerald-950/15 transition duration-300 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              :disabled="!draftMessage.trim()" aria-label="Отправить сообщение">
              <UIcon :name="submitting ? 'i-lucide-loader-circle' : 'i-lucide-send'" class="size-4"
                :class="submitting ? 'animate-spin' : ''" />
            </button>
          </div>
        </UFormField>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";
import { formatDateTime, getErrorMessage } from "~~/app/shared/lib/shopFormatters";
import { shopFetch } from "~~/app/shared/lib/shopFetch";
import type { MessagesResponse, MessageSenderRole, ShopMessage } from "~~/app/shared/types/shop";
import { useAuthStore } from "~~/app/stores/auth";
import { useMessageNotificationsStore } from "~~/app/stores/messageNotifications";

type MessageCreatedEvent = {
  message: ShopMessage;
  type: "message.created";
};

type MessageReadEvent = {
  messageIds: number[];
  type: "message.read";
};

type RealtimeEvent = MessageCreatedEvent | MessageReadEvent | { type: "connection.ready" };

useSeoMeta({
  title: "Сообщения",
  description: "Сообщения покупателя ПроТех76."
});

const auth = useAuthStore();
const messageNotifications = useMessageNotificationsStore();
const messages = ref<ShopMessage[]>([]);
const loading = ref(true);
const submitting = ref(false);
const draftMessage = ref("");
const messageError = ref("");
const socketConnected = ref(false);
const messagesViewport = ref<HTMLElement | null>(null);
const messagesEnd = ref<HTMLElement | null>(null);
const messageInput = ref<HTMLTextAreaElement | null>(null);
let socket: WebSocket | null = null;
const messageInputMinHeight = 48;
const messageInputMaxHeight = messageInputMinHeight * 3;

const connectionLabel = computed(() => socketConnected.value ? "Онлайн" : "История сообщений");

onMounted(async () => {
  const user = auth.user ?? await auth.fetchMe();

  if (!user) {
    await navigateTo("/auth?redirect=/messages");
    return;
  }

  await loadMessages();
  connectSocket();
  resizeMessageInput();
});

onBeforeUnmount(() => {
  socket?.close();
  socket = null;
});

async function loadMessages() {
  loading.value = true;

  try {
    const response = await shopFetch<MessagesResponse>("/api/public/messages");
    messages.value = response.messages;
    messageNotifications.clearUnread();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось загрузить сообщения"));
  } finally {
    loading.value = false;
    if (messages.value.length) {
      await scrollToBottom();
    }
  }
}

async function sendMessage() {
  messageError.value = "";
  const text = draftMessage.value.trim();

  if (!text) {
    messageError.value = "Введите сообщение";
    return;
  }

  submitting.value = true;

  try {
    const response = await shopFetch<{ message: ShopMessage }>("/api/public/messages", {
      method: "POST",
      body: {
        message: text
      }
    });

    upsertMessage(response.message);
    draftMessage.value = "";
    resizeMessageInput();
    await scrollToBottom();
  } catch (error) {
    messageError.value = getErrorMessage(error, "Не удалось отправить сообщение");
    toast.error(messageError.value);
  } finally {
    submitting.value = false;
  }
}

function connectSocket() {
  if (!import.meta.client || socket) {
    return;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  socket = new WebSocket(`${protocol}//${window.location.host}/api/messages/ws`);

  socket.addEventListener("open", () => {
    socketConnected.value = true;
  });

  socket.addEventListener("close", () => {
    socketConnected.value = false;
    socket = null;
  });

  socket.addEventListener("message", async (event) => {
    const payload = parseRealtimeEvent(event.data);

    if (!payload) {
      return;
    }

    if (payload.type === "message.created") {
      upsertMessage(payload.message);

      if (isIncomingMessage(payload.message)) {
        await markIncomingMessagesRead([payload.message.id]);
      }

      await scrollToBottom();
    }

    if (payload.type === "message.read") {
      markMessagesRead(payload.messageIds);
    }
  });
}

function parseRealtimeEvent(data: unknown): RealtimeEvent | null {
  if (typeof data !== "string") {
    return null;
  }

  try {
    return JSON.parse(data) as RealtimeEvent;
  } catch {
    return null;
  }
}

function upsertMessage(message: ShopMessage) {
  const index = messages.value.findIndex((item) => item.id === message.id);

  if (index >= 0) {
    messages.value[index] = message;
  } else {
    messages.value.push(message);
  }

  messages.value.sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
}

function markMessagesRead(messageIds: number[]) {
  const readAt = new Date().toISOString();
  const messageIdSet = new Set(messageIds);

  messages.value = messages.value.map((message) => (
    messageIdSet.has(message.id)
      ? { ...message, readAt }
      : message
  ));
}

async function markIncomingMessagesRead(messageIds: number[]) {
  try {
    const response = await shopFetch<{ messageIds: number[] }>("/api/public/messages/read", {
      method: "POST",
      body: {
        messageIds
      }
    });

    markMessagesRead(response.messageIds);
    messageNotifications.removeUnreadIds(response.messageIds);
  } catch {
    messageNotifications.removeUnreadIds(messageIds);
  }
}

function isIncomingMessage(message: ShopMessage) {
  return message.senderRole === "ADMIN" || message.senderRole === "SYSTEM";
}

function getSenderLabel(senderRole: MessageSenderRole) {
  if (senderRole === "USER") {
    return "Вы";
  }

  if (senderRole === "ADMIN") {
    return "Поддержка";
  }

  return "Уведомление";
}

function resizeMessageInput() {
  const input = messageInput.value;

  if (!input) {
    return;
  }

  input.style.height = `${messageInputMinHeight}px`;
  const nextHeight = Math.min(input.scrollHeight, messageInputMaxHeight);
  input.style.height = `${Math.max(messageInputMinHeight, nextHeight)}px`;
  input.style.overflowY = input.scrollHeight > messageInputMaxHeight ? "auto" : "hidden";
}

async function scrollToBottom() {
  await nextTick();

  if (messagesViewport.value) {
    messagesViewport.value.scrollTop = messagesViewport.value.scrollHeight;
    return;
  }

  messagesEnd.value?.scrollIntoView({ block: "end" });
}
</script>
