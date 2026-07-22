import { shopFetch } from "~~/app/shared/lib/shopFetch";
import type { MessageSenderRole, ShopMessage } from "~~/app/shared/types/shop";

type MessageCreatedEvent = {
  message: ShopMessage;
  type: "message.created";
};

type MessageReadEvent = {
  messageIds: number[];
  type: "message.read";
};

type RealtimeEvent = MessageCreatedEvent | MessageReadEvent | { type: "connection.ready" };

type UnreadMessagesResponse = {
  unreadCount: number;
  unreadMessageIds: number[];
};

const incomingSenderRoles = new Set<MessageSenderRole>(["ADMIN", "SYSTEM"]);

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let shouldReconnect = false;

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

function isIncomingUnreadMessage(message: ShopMessage) {
  return incomingSenderRoles.has(message.senderRole) && !message.readAt;
}

export const useMessageNotificationsStore = defineStore("shop-message-notifications", {
  state: () => ({
    initialized: false,
    pending: false,
    socketConnected: false,
    unreadMessageIds: [] as number[],
    userId: null as string | null
  }),
  getters: {
    unreadCount: (state) => state.unreadMessageIds.length
  },
  actions: {
    async initialize(userId: string) {
      if (!import.meta.client) {
        return;
      }

      if (this.userId !== userId) {
        this.disconnect();
        this.userId = userId;
        this.unreadMessageIds = [];
        this.initialized = false;
      }

      if (!this.initialized) {
        await this.fetchUnread();
      }

      this.connectSocket();
    },
    async fetchUnread() {
      this.pending = true;

      try {
        const response = await shopFetch<UnreadMessagesResponse>("/api/public/messages/unread");
        this.unreadMessageIds = response.unreadMessageIds;
        this.initialized = true;
      } catch {
        this.unreadMessageIds = [];
        this.initialized = false;
      } finally {
        this.pending = false;
      }
    },
    connectSocket() {
      if (!import.meta.client || socket) {
        return;
      }

      shouldReconnect = true;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      socket = new WebSocket(`${protocol}//${window.location.host}/api/messages/ws`);

      socket.addEventListener("open", () => {
        this.socketConnected = true;
      });

      socket.addEventListener("close", (event) => {
        this.socketConnected = false;
        socket = null;

        if (event.code === 1008) {
          shouldReconnect = false;
          return;
        }

        this.scheduleReconnect();
      });

      socket.addEventListener("message", (event) => {
        const payload = parseRealtimeEvent(event.data);

        if (!payload) {
          return;
        }

        this.handleRealtimeEvent(payload);
      });
    },
    scheduleReconnect() {
      if (!import.meta.client || !shouldReconnect || reconnectTimer) {
        return;
      }

      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;

        if (shouldReconnect) {
          this.connectSocket();
        }
      }, 3000);
    },
    disconnect() {
      shouldReconnect = false;

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }

      const currentSocket = socket;
      socket = null;
      currentSocket?.close();
      this.socketConnected = false;
    },
    handleRealtimeEvent(payload: RealtimeEvent) {
      if (payload.type === "message.created") {
        this.addUnreadMessage(payload.message);
      }

      if (payload.type === "message.read") {
        this.removeUnreadIds(payload.messageIds);
      }
    },
    addUnreadMessage(message: ShopMessage) {
      if (!isIncomingUnreadMessage(message) || this.unreadMessageIds.includes(message.id)) {
        return;
      }

      this.unreadMessageIds.push(message.id);
    },
    removeUnreadIds(messageIds: number[]) {
      if (!messageIds.length) {
        return;
      }

      const readIds = new Set(messageIds);
      this.unreadMessageIds = this.unreadMessageIds.filter((messageId) => !readIds.has(messageId));
    },
    clearUnread() {
      this.unreadMessageIds = [];
    },
    reset() {
      this.disconnect();
      this.initialized = false;
      this.pending = false;
      this.unreadMessageIds = [];
      this.userId = null;
    }
  }
});
