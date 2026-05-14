import Pusher from "pusher-js";

let _pusher: Pusher | null = null;

export function getPusherClient(): Pusher | null {
  if (typeof window === "undefined") return null;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!key || !cluster) return null;
  if (_pusher) return _pusher;
  _pusher = new Pusher(key, { cluster });
  return _pusher;
}

export function workspaceChannel(workspaceId: string): string {
  return `workspace-${workspaceId}`;
}
