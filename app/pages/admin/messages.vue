<template>
  <div class="messages-shop-page space-y-5 xl:flex xl:h-[calc(100dvh-8.25rem)] xl:min-h-0 xl:flex-col xl:gap-5 xl:space-y-0">
    <AdminPageHeader title="Сообщения" kicker="Поддержка"
      description="Диалоги с пользователями, вопросы по заказам и оперативные ответы.">
      <template #actions>
        <UButton color="neutral" variant="ghost" icon="i-lucide-refresh-cw" size="lg"
          class="h-12 justify-center rounded-full bg-white px-4 text-zinc-600 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100"
          :loading="conversationsPending" @click="refreshConversations()">
          Обновить
        </UButton>
      </template>
    </AdminPageHeader>

    <UAlert v-if="conversationsError" color="error" variant="soft" title="Не удалось загрузить диалоги"
      :description="getErrorMessage(conversationsError)" class="rounded-2xl" />

    <div class="grid min-h-130 gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[360px_minmax(0,1fr)]">
      <UCard class="admin-list-card min-h-0" :ui="{ body: 'flex h-full min-h-0 flex-col p-0' }">
        <div class="shrink-0 border-b border-(--admin-border) p-4">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <p class="admin-section-heading">
                Входящие
              </p>
              <p class="admin-section-copy">
                {{ filteredConversations.length }} из {{ conversations.length }} диалогов
              </p>
            </div>
            <UBadge :color="socketConnected ? 'success' : 'neutral'" variant="soft" class="rounded-md">
              {{ socketConnected ? "онлайн" : "история" }}
            </UBadge>
          </div>
          <div class="rounded-3xl bg-[#f9fafb] p-1.5 shadow-inner shadow-zinc-950/5">
            <UInput v-model="search" icon="i-lucide-search" placeholder="Найти пользователя" size="xl" variant="none"
              class="w-full" :ui="adminInputUi" />
          </div>
        </div>

        <div class="admin-muted-scroll min-h-0 space-y-2 overflow-y-auto bg-[#f9fafb] p-3 xl:flex-1">
          <button v-for="conversation in filteredConversations" :key="conversation.user.id" type="button"
            class="flex w-full gap-3 rounded-2xl bg-white p-3 text-left shadow-sm shadow-zinc-950/5 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-zinc-950/10"
            :class="selectedUserId === conversation.user.id ? 'ring-2 ring-emerald-200 shadow-emerald-950/10' : ''"
            @click="selectConversation(conversation.user.id)">
            <img v-if="conversation.user.image" :src="conversation.user.image" alt=""
              class="size-10 shrink-0 rounded-lg object-cover ring-1 ring-(--admin-border)">
            <div v-else class="admin-avatar size-10 shrink-0 text-xs">
              {{ getInitials(conversation.user.name || conversation.user.email) }}
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate font-semibold text-(--admin-text)">
                    {{ conversation.user.name || conversation.user.email }}
                  </p>
                  <p class="mt-0.5 truncate text-xs text-(--admin-text-muted)">
                    {{ conversation.user.email }}
                  </p>
                </div>
                <span v-if="conversation.unreadCount"
                  class="grid min-w-6 place-items-center rounded-full bg-(--admin-accent) px-2 py-0.5 text-xs font-semibold text-white">
                  {{ conversation.unreadCount }}
                </span>
              </div>

              <p class="mt-2 line-clamp-2 text-sm text-(--admin-text-muted)">
                {{ conversation.lastMessage?.message || "Диалог пока пуст" }}
              </p>
              <time v-if="conversation.lastMessage"
                class="mt-2 flex items-center justify-between gap-2 text-xs text-(--admin-text-muted)">
                <span>{{ formatDate(conversation.lastMessage.createdAt) }}</span>
                <span>{{ conversation.totalMessages }} сообщ.</span>
              </time>
            </div>
          </button>

          <AdminEmptyState v-if="!filteredConversations.length && !conversationsPending" title="Диалоги не найдены"
            description="Проверьте поиск или список пользователей.">
            <template #icon>
              <MessageSquare class="size-6" />
            </template>
          </AdminEmptyState>
        </div>
      </UCard>

      <UCard class="admin-list-card min-h-0" :ui="{ body: 'flex h-full min-h-0 flex-col p-0' }">
        <template v-if="selectedUser">
          <header class="shrink-0 border-b border-(--admin-border) bg-white p-4">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div class="flex min-w-0 items-center gap-3">
                <div class="admin-avatar size-11 shrink-0 text-sm">
                  {{ getInitials(selectedUser.name || selectedUser.email) }}
                </div>
                <div class="min-w-0">
                  <p class="truncate text-lg font-semibold text-(--admin-text)">
                    {{ selectedUser.name || selectedUser.email }}
                  </p>
                  <p class="truncate text-sm text-(--admin-text-muted)">
                    {{ selectedUser.email }} · {{ messages.length }} сообщений
                  </p>
                </div>
              </div>

              <UButton color="neutral" variant="outline" icon="i-lucide-refresh-cw" size="lg"
                class="h-11 rounded-full bg-white px-4"
                :loading="threadPending" @click="loadThread(selectedUser.id)">
                Обновить
              </UButton>
            </div>
          </header>

          <div ref="messagesContainer" class="admin-muted-scroll min-h-0 flex-1 overflow-y-auto bg-[#f9fafb] p-4">
            <div v-if="threadPending" class="space-y-3">
              <USkeleton v-for="item in 5" :key="item" class="h-20 rounded-lg" />
            </div>

            <div v-else v-auto-animate class="space-y-3">
              <article v-for="message in messages" :key="message.id" class="flex"
                :class="message.senderRole === 'ADMIN' ? 'justify-end' : 'justify-start'">
                <div class="max-w-[min(44rem,84%)] rounded-2xl px-4 py-3 shadow-sm" :class="message.senderRole === 'ADMIN'
                  ? 'bg-(--admin-accent) text-white shadow-green-950/10'
                  : 'bg-(--admin-surface) text-(--admin-text) ring-1 ring-(--admin-border)'">
                  <p class="text-xs font-semibold"
                    :class="message.senderRole === 'ADMIN' ? 'text-white/70' : 'text-(--admin-text-muted)'">
                    {{ getSenderLabel(message.senderRole) }}
                  </p>
                  <p class="mt-1 whitespace-pre-line text-sm leading-6">
                    {{ message.message }}
                  </p>
                  <time class="mt-2 block text-xs"
                    :class="message.senderRole === 'ADMIN' ? 'text-white/65' : 'text-(--admin-text-muted)'">
                    {{ formatDate(message.createdAt) }}
                  </time>
                </div>
              </article>

              <AdminEmptyState v-if="!messages.length" title="Диалог пуст"
                description="Напишите первое сообщение пользователю.">
                <template #icon>
                  <MessageSquare class="size-6" />
                </template>
              </AdminEmptyState>
            </div>
          </div>

          <form class="shrink-0 rounded-b-2xl border-t border-zinc-100 bg-white/95 p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-18px_44px_rgba(15,23,42,0.08)] backdrop-blur sm:p-3 sm:pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
            @submit.prevent="sendMessage">
            <UFormField :error="messageError">
              <div class="flex items-end gap-2 rounded-2xl bg-[#f3f4f6] p-1.5 shadow-inner shadow-zinc-950/5 ring-1 ring-transparent transition focus-within:ring-emerald-500/45">
                <textarea ref="messageInput" v-model="draftMessage"
                  class="h-12 min-h-12 max-h-36 flex-1 resize-none overflow-y-hidden rounded-xl bg-transparent px-3 py-3 text-sm leading-5 text-zinc-950 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="submitting" placeholder="Сообщение" rows="1" @input="resizeMessageInput"
                  @keydown.enter.exact.prevent="sendMessage" />
                <button type="submit"
                  class="grid size-11 shrink-0 place-items-center rounded-full bg-(--admin-accent) text-white shadow-md shadow-emerald-950/15 transition duration-300 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                  :disabled="!draftMessage.trim() || submitting" aria-label="Отправить сообщение">
                  <UIcon :name="submitting ? 'i-lucide-loader-circle' : 'i-lucide-send'" class="size-4"
                    :class="submitting ? 'animate-spin' : ''" />
                </button>
              </div>
            </UFormField>
          </form>
        </template>

        <div v-else class="grid min-h-130 place-items-center p-6 xl:min-h-0 xl:flex-1">
          <AdminEmptyState title="Выберите диалог" description="Слева отображаются пользователи и последние сообщения.">
            <template #icon>
              <MessageSquare class="size-6" />
            </template>
          </AdminEmptyState>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MessageSquare } from "@lucide/vue";
import { toast } from "vue-sonner";
import { formatDate, getErrorMessage } from "~~/app/shared/lib/adminFormatters";
import { adminFetch } from "~~/app/shared/lib/adminFetch";
import type {
  AdminMessage,
  MessageConversation,
  MessageConversationListResponse,
  MessageSenderRole,
  MessageThreadResponse
} from "~~/app/shared/types/admin";

type MessageCreatedEvent = {
  message: AdminMessage;
  type: "message.created";
};

type MessageReadEvent = {
  messageIds: number[];
  type: "message.read";
  userId: string;
};

type RealtimeEvent = MessageCreatedEvent | MessageReadEvent | { type: "connection.ready" };

definePageMeta({
  layout: "admin"
});

const search = ref("");
const route = useRoute();
const selectedUserId = ref<string | null>(null);
const messages = ref<AdminMessage[]>([]);
const selectedThreadUser = ref<MessageThreadResponse["user"] | null>(null);
const threadPending = ref(false);
const draftMessage = ref("");
const submitting = ref(false);
const messageError = ref("");
const socketConnected = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);
const messageInput = ref<HTMLTextAreaElement | null>(null);
let socket: WebSocket | null = null;
const messageInputMinHeight = 48;
const messageInputMaxHeight = messageInputMinHeight * 3;

const adminInputUi = {
  base: "h-12 rounded-2xl bg-transparent font-medium text-zinc-700"
};

const {
  data: conversationsData,
  pending: conversationsPending,
  error: conversationsError,
  refresh: refreshConversations
} = await useAsyncData(
  "admin-message-conversations",
  () => adminFetch<MessageConversationListResponse>("/api/admin/messages")
);

const conversations = computed(() => conversationsData.value?.conversations ?? []);

const filteredConversations = computed(() => {
  const query = search.value.trim().toLowerCase();

  if (!query) {
    return conversations.value;
  }

  return conversations.value.filter((conversation) => [
    conversation.user.name,
    conversation.user.email,
    conversation.lastMessage?.message
  ].some((value) => value?.toLowerCase().includes(query)));
});
const selectedConversation = computed<MessageConversation | null>(() =>
  conversations.value.find((conversation) => conversation.user.id === selectedUserId.value) ?? null
);
const selectedUser = computed(() => selectedConversation.value?.user ?? selectedThreadUser.value);
const requestedUserId = computed(() => {
  const value = route.query.userId;

  return typeof value === "string" && value.trim() ? value : null;
});

onMounted(async () => {
  const initialUserId = requestedUserId.value ?? conversations.value[0]?.user.id ?? null;

  if (initialUserId) {
    await selectConversation(initialUserId);
  }

  connectSocket();
  resizeMessageInput();
});

onBeforeUnmount(() => {
  socket?.close();
  socket = null;
});

watch(conversations, async (next) => {
  const nextUserId = requestedUserId.value ?? next[0]?.user.id ?? null;

  if (!selectedUserId.value && nextUserId) {
    await selectConversation(nextUserId);
  }
});

watch(requestedUserId, async (userId) => {
  if (userId && userId !== selectedUserId.value) {
    await selectConversation(userId);
  }
});

async function selectConversation(userId: string) {
  selectedUserId.value = userId;
  await loadThread(userId);
}

async function loadThread(userId: string) {
  threadPending.value = true;

  try {
    const response = await adminFetch<MessageThreadResponse>(`/api/admin/messages/${userId}`);
    messages.value = response.messages;
    selectedThreadUser.value = response.user;
    await refreshConversations();
    await scrollToBottom();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось загрузить диалог"));
  } finally {
    threadPending.value = false;
  }
}

async function sendMessage() {
  messageError.value = "";
  const text = draftMessage.value.trim();
  const userId = selectedUserId.value;

  if (!userId) {
    messageError.value = "Выберите пользователя";
    return;
  }

  if (!text) {
    messageError.value = "Введите сообщение";
    return;
  }

  submitting.value = true;

  try {
    const response = await adminFetch<{ message: AdminMessage }>(`/api/admin/messages/${userId}`, {
      method: "POST",
      body: {
        message: text
      }
    });

    upsertMessage(response.message);
    draftMessage.value = "";
    resizeMessageInput();
    await refreshConversations();
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
      if (payload.message.userId === selectedUserId.value) {
        upsertMessage(payload.message);
        await scrollToBottom();
      }

      await refreshConversations();
    }

    if (payload.type === "message.read") {
      markMessagesRead(payload.messageIds);
      await refreshConversations();
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

function upsertMessage(message: AdminMessage) {
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

function getSenderLabel(senderRole: MessageSenderRole) {
  if (senderRole === "ADMIN") {
    return "Администратор";
  }

  if (senderRole === "USER") {
    return "Пользователь";
  }

  return "Уведомление";
}

function getInitials(value: string) {
  return value
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
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
  const element = messagesContainer.value;

  if (element) {
    element.scrollTop = element.scrollHeight;
  }
}
</script>
