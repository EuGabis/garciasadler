import Pusher from "pusher";
import { env } from "@/lib/env";

let _pusher: Pusher | null = null;

export function getPusherServer(): Pusher | null {
  if (
    !env.PUSHER_APP_ID ||
    !env.PUSHER_SECRET ||
    !env.NEXT_PUBLIC_PUSHER_KEY ||
    !env.NEXT_PUBLIC_PUSHER_CLUSTER
  ) {
    return null;
  }
  if (_pusher) return _pusher;
  _pusher = new Pusher({
    appId: env.PUSHER_APP_ID,
    key: env.NEXT_PUBLIC_PUSHER_KEY,
    secret: env.PUSHER_SECRET,
    cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER,
    useTLS: true,
  });
  return _pusher;
}

export type RealtimeEvent =
  | { type: "message:new"; conversationId: string; preview: string }
  | { type: "conversation:updated"; conversationId: string };

export function workspaceChannel(workspaceId: string): string {
  return `workspace-${workspaceId}`;
}

export async function publishRealtime(workspaceId: string, event: RealtimeEvent): Promise<void> {
  const pusher = getPusherServer();
  if (!pusher) return;
  try {
    await pusher.trigger(workspaceChannel(workspaceId), event.type, event);
  } catch (e) {
    console.error("[pusher] trigger failed:", e);
  }
}
