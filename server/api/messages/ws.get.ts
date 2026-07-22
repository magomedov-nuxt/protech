import { Role } from "@prisma/client";
import { auth } from "~~/server/utils/auth";
import {
  subscribeMessagePeer,
  unsubscribeMessagePeer
} from "~~/server/utils/messageRealtime";

type MessagePeerContext = {
  role?: Role;
  userId?: string;
};

export default defineWebSocketHandler({
  async upgrade(request) {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        id: true,
        role: true
      }
    });

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (!request.context) {
      return new Response("Unauthorized", { status: 401 });
    }

    const context = request.context as MessagePeerContext;
    context.userId = user.id;
    context.role = user.role;
  },

  open(peer) {
    const context = peer.context as MessagePeerContext;

    if (!context.userId) {
      peer.close(1008, "Unauthorized");
      return;
    }

    subscribeMessagePeer(peer, `user:${context.userId}`);

    if (context.role === Role.ADMIN) {
      subscribeMessagePeer(peer, "admins");
    }

    peer.send(JSON.stringify({
      type: "connection.ready",
      role: context.role,
      userId: context.userId
    }));
  },

  message(peer, message) {
    if (message.text() === "ping") {
      peer.send("pong");
    }
  },

  close(peer) {
    unsubscribeMessagePeer(peer);
  },

  error(peer) {
    unsubscribeMessagePeer(peer);
  }
});
