import type { Peer } from "crossws";

export type RealtimeMessagePayload = {
  id: number;
  userId?: string;
  senderRole: string;
  message: string;
  readAt: Date | string | null;
  createdAt: Date | string;
};

export type MessageRealtimeEvent =
  | {
      type: "message.created";
      message: RealtimeMessagePayload;
    }
  | {
      type: "message.read";
      messageIds: number[];
      userId?: string;
    };

const peersByTopic = new Map<string, Set<Peer>>();
const topicsByPeer = new WeakMap<Peer, Set<string>>();

function getTopicPeers(topic: string) {
  const peers = peersByTopic.get(topic) ?? new Set<Peer>();
  peersByTopic.set(topic, peers);
  return peers;
}

function serializeEvent(event: MessageRealtimeEvent) {
  return JSON.stringify(event);
}

export function subscribeMessagePeer(peer: Peer, topic: string) {
  getTopicPeers(topic).add(peer);
  const topics = topicsByPeer.get(peer) ?? new Set<string>();
  topics.add(topic);
  topicsByPeer.set(peer, topics);
}

export function unsubscribeMessagePeer(peer: Peer) {
  const topics = topicsByPeer.get(peer);

  if (!topics) {
    return;
  }

  for (const topic of topics) {
    const peers = peersByTopic.get(topic);
    peers?.delete(peer);

    if (peers?.size === 0) {
      peersByTopic.delete(topic);
    }
  }

  topicsByPeer.delete(peer);
}

export function broadcastMessageEvent(topic: string, event: MessageRealtimeEvent) {
  const payload = serializeEvent(event);
  const peers = peersByTopic.get(topic);

  if (!peers?.size) {
    return;
  }

  for (const peer of peers) {
    try {
      peer.send(payload);
    } catch {
      peers.delete(peer);
    }
  }
}

export function broadcastMessageToUser(userId: string, event: MessageRealtimeEvent) {
  broadcastMessageEvent(`user:${userId}`, event);
}

export function broadcastMessageToAdmins(event: MessageRealtimeEvent) {
  broadcastMessageEvent("admins", event);
}
